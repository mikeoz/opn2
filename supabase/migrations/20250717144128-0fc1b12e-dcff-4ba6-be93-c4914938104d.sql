
-- Complete the unified profile model implementation
-- Update the providers table structure and remove redundant organization tracking

-- First, let's clean up the providers table to remove duplicate organization entries
-- that might have been created during the transition
DELETE FROM public.providers 
WHERE provider_type = 'business' 
AND id IN (
  SELECT p1.id 
  FROM public.providers p1
  JOIN public.providers p2 ON p1.name = p2.name 
  AND p1.provider_type = p2.provider_type
  AND p1.id > p2.id
);

-- Update the providers table to use a cleaner structure
-- Add a user_id reference to link providers directly to profiles
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update existing provider entries to link them to their corresponding profiles
UPDATE public.providers 
SET user_id = p.id
FROM public.profiles p
WHERE public.providers.provider_type = 'business'
AND (
  public.providers.name = p.organization_name OR
  public.providers.name = CONCAT(p.first_name, ' ', p.last_name)
)
AND p.account_type = 'non_individual';

-- Remove the redundant handle_new_organization_provider function and trigger
DROP TRIGGER IF EXISTS on_new_organization_provider ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_organization_provider();

-- Update the handle_new_user function to create cleaner provider entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table with unified field structure
  INSERT INTO public.profiles (
    id,
    account_type,
    guid,
    first_name,
    last_name,
    email,
    organization_name
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual')::public.account_type,
    public.generate_guid(),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'organization_name'
  );

  -- Only create provider for non-individual accounts
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
    BEGIN
      INSERT INTO public.providers (
        user_id,
        name, 
        provider_type, 
        description, 
        capabilities, 
        contact_info
      )
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data ->> 'organization_name', 
          NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'
        ),
        'business',
        'Organization provider account',
        '["organization_services", "card_sharing"]'::jsonb,
        jsonb_build_object(
          'email', NEW.email,
          'representative', 
          CASE 
            WHEN NEW.raw_user_meta_data ->> 'first_name' IS NOT NULL 
                 AND NEW.raw_user_meta_data ->> 'last_name' IS NOT NULL 
            THEN NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'
            ELSE NULL 
          END
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create provider for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- Update RLS policies for providers table to account for user_id reference
DROP POLICY IF EXISTS "Users can manage their own provider entries" ON public.providers;

CREATE POLICY "Users can manage their own provider entries" 
  ON public.providers 
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

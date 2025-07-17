
-- Simplify the profiles table to use consistent field names
-- Add organization_name field for organizations
-- Remove confusing dual fields

-- First, let's add the organization_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'organization_name') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_name text;
    END IF;
END $$;

-- Update existing organization accounts to use the new unified structure
UPDATE public.profiles 
SET 
    organization_name = entity_name,
    first_name = COALESCE(rep_first_name, first_name),
    last_name = COALESCE(rep_last_name, last_name),
    email = COALESCE(rep_email, email)
WHERE account_type = 'non_individual';

-- Remove the redundant columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS entity_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rep_first_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rep_last_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rep_email;

-- Update the handle_new_user function to use the simplified structure
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

  -- Only create provider for non-individual accounts, but use exception handling
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
    BEGIN
      INSERT INTO public.providers (name, provider_type, description, capabilities, contact_info)
      VALUES (
        COALESCE(NEW.raw_user_meta_data ->> 'organization_name', NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'),
        'business',
        'Organization provider account',
        '["organization_services", "card_sharing"]'::jsonb,
        jsonb_build_object(
          'email', NEW.email,
          'representative', 
          CASE 
            WHEN NEW.raw_user_meta_data ->> 'first_name' IS NOT NULL AND NEW.raw_user_meta_data ->> 'last_name' IS NOT NULL 
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

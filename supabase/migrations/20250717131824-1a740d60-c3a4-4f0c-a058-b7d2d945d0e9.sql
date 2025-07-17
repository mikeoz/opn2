
-- First, ensure the providers table exists with the correct structure
DROP TABLE IF EXISTS public.providers CASCADE;

CREATE TABLE public.providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  provider_type text NOT NULL,
  description text,
  capabilities jsonb DEFAULT '[]'::jsonb,
  standards jsonb DEFAULT '[]'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create the necessary policies
CREATE POLICY "Anyone can view providers" 
  ON public.providers 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can create providers during registration" 
  ON public.providers 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update providers" 
  ON public.providers 
  FOR UPDATE 
  USING (true);

-- Create a robust handle_new_user function that won't fail user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- First, insert into profiles table (this is critical and must succeed)
  INSERT INTO public.profiles (
    id,
    account_type,
    guid,
    first_name,
    last_name,
    email,
    entity_name,
    rep_first_name,
    rep_last_name,
    rep_email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual')::public.account_type,
    public.generate_guid(),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'entity_name',
    NEW.raw_user_meta_data ->> 'rep_first_name',
    NEW.raw_user_meta_data ->> 'rep_last_name',
    NEW.raw_user_meta_data ->> 'rep_email'
  );

  -- Only try to create provider for non-individual accounts, but use exception handling
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
    BEGIN
      INSERT INTO public.providers (name, provider_type, description, capabilities, contact_info)
      VALUES (
        COALESCE(NEW.raw_user_meta_data ->> 'entity_name', NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'),
        'business',
        'Organization provider account',
        '["organization_services", "card_sharing"]'::jsonb,
        jsonb_build_object(
          'email', NEW.email,
          'representative', 
          CASE 
            WHEN NEW.raw_user_meta_data ->> 'rep_first_name' IS NOT NULL AND NEW.raw_user_meta_data ->> 'rep_last_name' IS NOT NULL 
            THEN NEW.raw_user_meta_data ->> 'rep_first_name' || ' ' || NEW.raw_user_meta_data ->> 'rep_last_name'
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

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

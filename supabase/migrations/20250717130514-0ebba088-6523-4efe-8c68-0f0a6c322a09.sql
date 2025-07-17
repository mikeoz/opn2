
-- Clean up existing data and reset for fresh start
-- This will remove all existing users, profiles, providers, and related data

-- First, disable RLS temporarily to allow cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships DISABLE ROW LEVEL SECURITY;

-- Clear all existing data (cascading deletes will handle relationships)
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.organization_memberships CASCADE;
TRUNCATE TABLE public.card_relationships CASCADE;
TRUNCATE TABLE public.card_field_values CASCADE;
TRUNCATE TABLE public.user_cards CASCADE;
TRUNCATE TABLE public.card_labels CASCADE;
TRUNCATE TABLE public.providers CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Ensure the providers table policies are correct
DROP POLICY IF EXISTS "System can create providers during registration" ON public.providers;
DROP POLICY IF EXISTS "System can update providers" ON public.providers;
DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;

-- Create fresh, permissive policies for providers
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

-- Ensure the handle_new_user function is working correctly by recreating it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table
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

  -- Only create provider for non-individual accounts
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
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
  END IF;

  RETURN NEW;
END;
$function$;

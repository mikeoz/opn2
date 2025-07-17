-- Fix the user registration trigger to handle providers table correctly

-- First, let's update the handle_new_user function to properly handle the providers table
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
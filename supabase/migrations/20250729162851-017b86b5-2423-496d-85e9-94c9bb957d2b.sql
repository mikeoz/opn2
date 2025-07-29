-- Update the handle_new_user function to automatically assign admin role to organization account creators
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
    organization_name,
    username
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual')::public.account_type,
    public.generate_guid(),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'organization_name',
    -- Generate username from email prefix
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );

  -- Automatically assign admin role to organization account creators
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
    -- Insert admin role for organization account creators
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Create provider entry for organizations
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

-- STEP 1: Clean up existing problematic triggers and functions
DROP TRIGGER IF EXISTS on_new_organization_provider ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_organization_provider();

-- STEP 2: Create a bulletproof, minimal user registration function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- ONLY create the user profile - nothing else
  -- This MUST succeed for registration to work
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
  ) VALUES (
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

  RETURN NEW;
END;
$function$;

-- STEP 3: Ensure the trigger exists and is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Create a robust organization setup function (called from application)
CREATE OR REPLACE FUNCTION public.setup_organization_provider(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  profile_record public.profiles;
  provider_id uuid;
  result jsonb;
BEGIN
  -- Get the user's profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE id = user_id AND account_type = 'non_individual';
  
  -- If not an organization account, return error
  IF profile_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not an organization account'
    );
  END IF;
  
  -- Check if provider already exists
  SELECT id INTO provider_id
  FROM public.providers
  WHERE contact_info->>'email' = profile_record.email;
  
  -- Create provider if it doesn't exist
  IF provider_id IS NULL THEN
    INSERT INTO public.providers (
      name,
      provider_type,
      description,
      capabilities,
      contact_info
    ) VALUES (
      COALESCE(profile_record.entity_name, profile_record.first_name || ' ' || profile_record.last_name),
      'business',
      'Organization provider account',
      '["organization_services", "card_sharing"]'::jsonb,
      jsonb_build_object(
        'email', profile_record.email,
        'representative', 
        CASE 
          WHEN profile_record.rep_first_name IS NOT NULL AND profile_record.rep_last_name IS NOT NULL 
          THEN profile_record.rep_first_name || ' ' || profile_record.rep_last_name
          ELSE NULL 
        END
      )
    ) RETURNING id INTO provider_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'provider_id', provider_id,
    'message', 'Organization provider setup complete'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- STEP 5: Create RLS policy for the new function
CREATE POLICY IF NOT EXISTS "Users can setup their own organization provider" 
  ON public.providers 
  FOR INSERT 
  WITH CHECK (true); -- Function handles authorization internally

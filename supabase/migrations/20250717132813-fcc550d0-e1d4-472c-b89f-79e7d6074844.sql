
-- Simplify the handle_new_user function to ONLY handle profiles
-- Remove provider creation to avoid registration failures
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only insert into profiles table (this is critical and must succeed)
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

  RETURN NEW;
END;
$function$;

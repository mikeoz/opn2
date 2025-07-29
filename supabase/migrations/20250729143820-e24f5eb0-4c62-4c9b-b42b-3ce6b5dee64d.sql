-- PHASE 1: Critical Role-Based Access Control Fixes

-- 1. Fix database functions security by adding proper search_path
CREATE OR REPLACE FUNCTION public.generate_card_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM public.user_cards WHERE card_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.generate_guid()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  letters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  digits TEXT := '0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 3 random letters
  FOR i IN 1..3 LOOP
    result := result || substr(letters, floor(random() * length(letters) + 1)::integer, 1);
  END LOOP;
  
  -- Generate 7 random digits
  FOR i IN 1..7 LOOP
    result := result || substr(digits, floor(random() * length(digits) + 1)::integer, 1);
  END LOOP;
  
  RETURN result;
END;
$function$;

-- 2. Replace insecure user_roles RLS policies
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Only admins can manage roles (except viewing own roles)
CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 3. Create secure admin management function
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only existing admins can assign admin roles
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign admin roles';
  END IF;
  
  -- Insert admin role for target user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.audit_logs (
    table_name, 
    operation, 
    record_id, 
    new_values, 
    user_id
  ) VALUES (
    'user_roles',
    'ADMIN_ROLE_ASSIGNED',
    target_user_id,
    jsonb_build_object('role', 'admin', 'assigned_by', auth.uid()),
    auth.uid()
  );
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only existing admins can revoke admin roles
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can revoke admin roles';
  END IF;
  
  -- Don't allow users to revoke their own admin role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  
  -- Remove admin role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';
  
  -- Log the action
  INSERT INTO public.audit_logs (
    table_name, 
    operation, 
    record_id, 
    new_values, 
    user_id
  ) VALUES (
    'user_roles',
    'ADMIN_ROLE_REVOKED',
    target_user_id,
    jsonb_build_object('role', 'admin', 'revoked_by', auth.uid()),
    auth.uid()
  );
  
  RETURN true;
END;
$$;
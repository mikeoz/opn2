-- Fix security warnings by updating functions with proper search_path

-- Update increment_qr_scan_count function
CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(qr_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.merchant_qr_codes 
  SET scan_count = scan_count + 1,
      updated_at = now()
  WHERE id = qr_code_id;
END;
$$;

-- Update generate_qr_code_data function
CREATE OR REPLACE FUNCTION public.generate_qr_code_data(merchant_id uuid, qr_type text DEFAULT 'store_entry')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text := 'https://app.opn2.com';
  result text;
BEGIN
  result := base_url || '/scan/' || merchant_id || '/' || qr_type || '/' || encode(gen_random_bytes(16), 'hex');
  RETURN result;
END;
$$;

-- Update auto_generate_qr_code function
CREATE OR REPLACE FUNCTION public.auto_generate_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code_data IS NULL OR NEW.qr_code_data = '' THEN
    NEW.qr_code_data := public.generate_qr_code_data(NEW.merchant_id, NEW.qr_type);
  END IF;
  RETURN NEW;
END;
$$;

-- Update log_merchant_interaction function
CREATE OR REPLACE FUNCTION public.log_merchant_interaction(
  p_user_id uuid,
  p_merchant_id uuid,
  p_interaction_type text,
  p_interaction_data jsonb DEFAULT '{}'::jsonb,
  p_qr_code_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  relationship_id uuid;
  interaction_id uuid;
BEGIN
  -- Find or create user-provider relationship
  SELECT id INTO relationship_id
  FROM public.user_provider_relationships
  WHERE user_id = p_user_id AND provider_id = p_merchant_id;
  
  IF relationship_id IS NULL THEN
    -- Create new relationship
    INSERT INTO public.user_provider_relationships (
      user_id,
      provider_id,
      relationship_type,
      access_permissions
    ) VALUES (
      p_user_id,
      p_merchant_id,
      'customer',
      '{"basic_access": true, "scan_history": true}'::jsonb
    ) RETURNING id INTO relationship_id;
  END IF;
  
  -- Log the interaction
  INSERT INTO public.relationship_interactions (
    relationship_id,
    interaction_type,
    interaction_data,
    created_by
  ) VALUES (
    relationship_id,
    p_interaction_type,
    p_interaction_data || jsonb_build_object('qr_code_id', p_qr_code_id),
    p_user_id
  ) RETURNING id INTO interaction_id;
  
  -- Update QR code scan count if provided
  IF p_qr_code_id IS NOT NULL THEN
    PERFORM public.increment_qr_scan_count(p_qr_code_id);
  END IF;
  
  RETURN interaction_id;
END;
$$;
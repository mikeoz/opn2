-- Add logo storage support for organization profiles
ALTER TABLE public.profiles 
ADD COLUMN logo_url text;

-- Create merchant QR codes table for the reverse loyalty system
CREATE TABLE public.merchant_qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL,
  qr_code_data text NOT NULL,
  qr_type text NOT NULL DEFAULT 'store_entry',
  display_name text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  scan_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on merchant_qr_codes
ALTER TABLE public.merchant_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant QR codes
CREATE POLICY "Merchants can manage their own QR codes" 
ON public.merchant_qr_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.providers p 
    WHERE p.id = merchant_qr_codes.merchant_id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers p 
    WHERE p.id = merchant_qr_codes.merchant_id 
    AND p.user_id = auth.uid()
  )
);

-- Anyone can view active QR codes (for scanning)
CREATE POLICY "Anyone can view active QR codes for scanning" 
ON public.merchant_qr_codes 
FOR SELECT 
USING (is_active = true);

-- Add foreign key constraint
ALTER TABLE public.merchant_qr_codes 
ADD CONSTRAINT merchant_qr_codes_merchant_id_fkey 
FOREIGN KEY (merchant_id) REFERENCES public.providers(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_merchant_qr_codes_merchant_id ON public.merchant_qr_codes(merchant_id);
CREATE INDEX idx_merchant_qr_codes_active ON public.merchant_qr_codes(is_active) WHERE is_active = true;

-- Create function to update QR code scan count
CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(qr_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.merchant_qr_codes 
  SET scan_count = scan_count + 1,
      updated_at = now()
  WHERE id = qr_code_id;
END;
$$;

-- Create function to generate QR code data
CREATE OR REPLACE FUNCTION public.generate_qr_code_data(merchant_id uuid, qr_type text DEFAULT 'store_entry')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text := 'https://app.opn2.com';
  result text;
BEGIN
  result := base_url || '/scan/' || merchant_id || '/' || qr_type || '/' || encode(gen_random_bytes(16), 'hex');
  RETURN result;
END;
$$;

-- Add trigger to auto-generate QR code data if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_qr_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.qr_code_data IS NULL OR NEW.qr_code_data = '' THEN
    NEW.qr_code_data := public.generate_qr_code_data(NEW.merchant_id, NEW.qr_type);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_qr_code_trigger
BEFORE INSERT ON public.merchant_qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_qr_code();

-- Create activity logging function for QR scans and check-ins
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
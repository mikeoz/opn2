-- Fix security warnings from linter
-- Add SET search_path = '' to existing functions that are missing it

-- Fix function search path for security
DROP FUNCTION IF EXISTS public.log_enhanced_audit(TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.log_enhanced_audit(
  p_table_name TEXT,
  p_operation TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_privacy_level TEXT DEFAULT 'standard',
  p_data_classification TEXT DEFAULT 'internal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.enhanced_audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    old_values,
    new_values,
    privacy_level,
    data_classification,
    timestamp
  ) VALUES (
    p_table_name,
    p_operation,
    p_record_id,
    auth.uid(),
    p_old_values,
    p_new_values,
    p_privacy_level,
    p_data_classification,
    now()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Fix function search path for data retention compliance
DROP FUNCTION IF EXISTS public.check_data_retention_compliance(TEXT, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION public.check_data_retention_compliance(
  p_data_type TEXT,
  p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  policy_record public.data_retention_policies%ROWTYPE;
  age_days INTEGER;
  result JSONB;
BEGIN
  -- Get retention policy
  SELECT * INTO policy_record
  FROM public.data_retention_policies
  WHERE data_type = p_data_type AND is_active = TRUE
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'retain', TRUE,
      'action', 'review',
      'reason', 'No retention policy found',
      'days_remaining', NULL
    );
  END IF;
  
  -- Calculate age in days
  age_days := EXTRACT(EPOCH FROM (now() - p_created_at)) / 86400;
  
  -- Determine action
  IF age_days >= policy_record.retention_period_days THEN
    IF policy_record.auto_delete THEN
      result := jsonb_build_object(
        'retain', FALSE,
        'action', CASE WHEN policy_record.archive_first THEN 'archive_then_delete' ELSE 'delete' END,
        'reason', 'Retention period exceeded',
        'days_remaining', 0
      );
    ELSE
      result := jsonb_build_object(
        'retain', TRUE,
        'action', 'manual_review',
        'reason', 'Retention period exceeded but manual review required',
        'days_remaining', 0
      );
    END IF;
  ELSE
    result := jsonb_build_object(
      'retain', TRUE,
      'action', 'keep',
      'reason', 'Within retention period',
      'days_remaining', policy_record.retention_period_days - age_days
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Enable RLS on the data_retention_policies table that was missing RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for data retention policies
CREATE POLICY "Admins can manage retention policies" 
ON public.data_retention_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active retention policies" 
ON public.data_retention_policies 
FOR SELECT 
USING (is_active = TRUE);
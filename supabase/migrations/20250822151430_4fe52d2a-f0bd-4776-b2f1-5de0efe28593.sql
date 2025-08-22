-- Enhanced Audit Logging System for Security & Privacy Compliance
-- Creates comprehensive audit trail for all data access and modifications

-- Create enhanced audit logs table with more detailed tracking
CREATE TABLE IF NOT EXISTS public.enhanced_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  user_id UUID,
  session_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  privacy_level TEXT DEFAULT 'standard',
  data_classification TEXT DEFAULT 'internal',
  compliance_flags JSONB DEFAULT '{}',
  retention_policy TEXT DEFAULT 'standard',
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on enhanced audit logs
ALTER TABLE public.enhanced_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for enhanced audit logs
CREATE POLICY "System can insert audit logs" 
ON public.enhanced_audit_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs" 
ON public.enhanced_audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own audit logs" 
ON public.enhanced_audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create privacy consent tracking table
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  version TEXT NOT NULL DEFAULT '1.0',
  context TEXT NOT NULL,
  evidence TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on privacy consents
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

-- Create policies for privacy consents
CREATE POLICY "Users can manage their own consents" 
ON public.privacy_consents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" 
ON public.privacy_consents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create data retention policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL,
  retention_period_days INTEGER NOT NULL,
  legal_basis TEXT NOT NULL,
  auto_delete BOOLEAN DEFAULT FALSE,
  archive_first BOOLEAN DEFAULT TRUE,
  exceptions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert default retention policies
INSERT INTO public.data_retention_policies 
(data_type, retention_period_days, legal_basis, auto_delete, archive_first, exceptions) 
VALUES 
('user_profile', 2555, 'Contract performance and legitimate interest', FALSE, TRUE, '["Active family units with ongoing consent"]'),
('card_data', 1095, 'Legitimate interest for service provision', FALSE, TRUE, '["Shared cards with active relationships"]'),
('audit_logs', 2190, 'Legal obligation', TRUE, TRUE, '[]'),
('family_data', 1825, 'Consent and legitimate interest', FALSE, TRUE, '["Active family units with ongoing consent"]'),
('relationship_data', 1095, 'Legitimate interest and consent', FALSE, TRUE, '["Active relationships"]')
ON CONFLICT DO NOTHING;

-- Create data subject requests table for GDPR compliance
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  legal_basis TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID
);

-- Enable RLS on data subject requests
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for data subject requests
CREATE POLICY "Users can create their own data requests" 
ON public.data_subject_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own data requests" 
ON public.data_subject_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all data requests" 
ON public.data_subject_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create enhanced sharing permissions table
CREATE TABLE IF NOT EXISTS public.sharing_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('card', 'family_unit', 'organization')),
  granted_to_user_id UUID,
  granted_to_role TEXT,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit', 'share', 'delete', 'download')),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  conditions JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on sharing permissions
ALTER TABLE public.sharing_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for sharing permissions
CREATE POLICY "Users can create permissions for their resources" 
ON public.sharing_permissions 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage permissions they created" 
ON public.sharing_permissions 
FOR ALL 
USING (auth.uid() = created_by);

CREATE POLICY "Users can view permissions granted to them" 
ON public.sharing_permissions 
FOR SELECT 
USING (auth.uid() = granted_to_user_id OR auth.uid() = created_by);

-- Create performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_logs_user_id ON public.enhanced_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_logs_timestamp ON public.enhanced_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_logs_table_operation ON public.enhanced_audit_logs(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_user_type ON public.privacy_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_sharing_permissions_resource ON public.sharing_permissions(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_family_units_generation ON public.family_units(generation_level);
CREATE INDEX IF NOT EXISTS idx_user_cards_family_unit ON public.user_cards(family_unit_id) WHERE family_unit_id IS NOT NULL;

-- Create function for enhanced audit logging
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

-- Create function to check data retention compliance
CREATE OR REPLACE FUNCTION public.check_data_retention_compliance(
  p_data_type TEXT,
  p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_privacy_consents_updated_at
  BEFORE UPDATE ON public.privacy_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

CREATE TRIGGER update_sharing_permissions_updated_at
  BEFORE UPDATE ON public.sharing_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();
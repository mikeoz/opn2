-- Enable RLS on new tables
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organization Memberships Policies
CREATE POLICY "Users can view their own memberships" ON organization_memberships
  FOR SELECT USING (
    auth.uid() = individual_user_id OR 
    auth.uid() = organization_user_id OR
    auth.uid() = created_by
  );

CREATE POLICY "Users can create memberships for their organization" ON organization_memberships
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    (auth.uid() = organization_user_id OR 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'non_individual'))
  );

CREATE POLICY "Organization admins can update memberships" ON organization_memberships
  FOR UPDATE USING (
    auth.uid() = organization_user_id OR 
    auth.uid() = created_by
  );

CREATE POLICY "Organization admins can delete memberships" ON organization_memberships
  FOR DELETE USING (
    auth.uid() = organization_user_id OR 
    auth.uid() = created_by
  );

-- Card Categories Policies
CREATE POLICY "Anyone can view active categories" ON card_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON card_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Sharing Templates Policies
CREATE POLICY "Anyone can view public templates" ON sharing_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON sharing_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own templates" ON sharing_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON sharing_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON sharing_templates
  FOR DELETE USING (created_by = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
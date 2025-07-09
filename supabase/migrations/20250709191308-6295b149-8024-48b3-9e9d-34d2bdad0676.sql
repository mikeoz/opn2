-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_card_relationships_permissions ON card_relationships USING GIN (permissions);
CREATE INDEX IF NOT EXISTS idx_user_provider_relationships_access_permissions ON user_provider_relationships USING GIN (access_permissions);
CREATE INDEX IF NOT EXISTS idx_user_provider_relationships_transaction_controls ON user_provider_relationships USING GIN (transaction_controls);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_template ON user_cards (user_id, template_id);
CREATE INDEX IF NOT EXISTS idx_card_field_values_user_card ON card_field_values (user_card_id);
CREATE INDEX IF NOT EXISTS idx_card_relationships_card_id ON card_relationships (card_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles (account_type);

-- Organization Memberships Table
CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_user_id UUID NOT NULL,
  organization_user_id UUID NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(individual_user_id, organization_user_id)
);

-- Card Categories Table
CREATE TABLE IF NOT EXISTS card_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sharing Templates Table
CREATE TABLE IF NOT EXISTS sharing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_permissions JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Add category reference to card_templates
ALTER TABLE card_templates 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES card_categories(id);

-- Insert default card categories
INSERT INTO card_categories (name, description, icon, sort_order) VALUES
('Personal', 'Personal identification and contact cards', 'user', 1),
('Contact', 'Address, phone, and communication cards', 'mail', 2),
('Social', 'Social media and online presence cards', 'share-2', 3),
('Professional', 'Business and professional cards', 'briefcase', 4),
('Organization', 'Organizational and institutional cards', 'building', 5),
('Special', 'Special purpose and custom cards', 'star', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert default sharing templates
INSERT INTO sharing_templates (name, description, template_permissions, is_public, created_by) VALUES
('Basic View', 'Basic information viewing permissions', '{"cards": ["view_basic"], "profile": ["view_basic"]}', true, NULL),
('Full Access', 'Complete access to all information', '{"cards": ["view_basic", "view_detailed", "edit"], "profile": ["view_basic", "view_detailed"]}', true, NULL),
('Organization Member', 'Standard permissions for organization members', '{"cards": ["view_basic", "view_detailed"], "profile": ["view_basic"], "organization": ["view_basic"]}', true, NULL),
('Service Provider', 'Permissions for service providers', '{"cards": ["view_basic", "view_detailed"], "profile": ["view_basic"], "services": ["read", "write"]}', true, NULL)
ON CONFLICT (name) DO NOTHING;
-- Phase 1: Database Migration for vCard Integration
-- Extends user_cards and creates supporting tables for field-level policies and merge engine

-- =====================================================
-- 1. EXTEND user_cards TABLE
-- =====================================================

-- Add new columns to support vCard granular data model
ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS person_id TEXT,
  ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{"source": "manual", "confidence": 1.0, "precedence": "user_input"}'::jsonb,
  ADD COLUMN IF NOT EXISTS quality JSONB DEFAULT '{"confidence": 1.0, "completeness": 1.0, "lastVerified": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS consent JSONB DEFAULT '{"defaultConsent": true, "recipients": [], "granted_at": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS field_policies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_cards_person_id ON public.user_cards(person_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_card_type ON public.user_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_user_cards_version ON public.user_cards(version);

-- Add comment documentation
COMMENT ON COLUMN public.user_cards.person_id IS 'Logical person identifier - allows multiple cards per person';
COMMENT ON COLUMN public.user_cards.card_type IS 'Type of vCard: email, phone, address, personal_identity, etc.';
COMMENT ON COLUMN public.user_cards.provenance IS 'Source tracking: {source, confidence, precedence, importedAt, sourceId}';
COMMENT ON COLUMN public.user_cards.quality IS 'Quality metrics: {confidence, completeness, lastVerified}';
COMMENT ON COLUMN public.user_cards.consent IS 'Consent data: {defaultConsent, recipients, granted_at, revoked_at}';
COMMENT ON COLUMN public.user_cards.field_policies IS 'Array of field-level policies: [{path, scope, recipients, consent}]';
COMMENT ON COLUMN public.user_cards.version IS 'Semantic version for schema evolution';

-- =====================================================
-- 2. CREATE card_merge_conflicts TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.card_merge_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('field_conflict', 'duplicate_card', 'version_conflict')),
  winning_card_id UUID REFERENCES public.user_cards(id) ON DELETE SET NULL,
  losing_card_ids UUID[] NOT NULL,
  conflict_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution_strategy TEXT CHECK (resolution_strategy IN ('manual', 'auto_confidence', 'auto_recency', 'auto_precedence')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merge_conflicts_user_id ON public.card_merge_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_merge_conflicts_person_id ON public.card_merge_conflicts(person_id);
CREATE INDEX IF NOT EXISTS idx_merge_conflicts_resolved ON public.card_merge_conflicts(resolved_at) WHERE resolved_at IS NULL;

-- RLS Policies
ALTER TABLE public.card_merge_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own merge conflicts"
  ON public.card_merge_conflicts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merge conflicts"
  ON public.card_merge_conflicts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merge conflicts"
  ON public.card_merge_conflicts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merge conflicts"
  ON public.card_merge_conflicts
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. CREATE vcf_imports TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vcf_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT,
  import_source TEXT NOT NULL CHECK (import_source IN ('file_upload', 'url', 'email', 'api')),
  total_vcards INTEGER DEFAULT 0,
  processed_vcards INTEGER DEFAULT 0,
  failed_vcards INTEGER DEFAULT 0,
  cards_created UUID[] DEFAULT ARRAY[]::UUID[],
  merge_conflicts_created UUID[] DEFAULT ARRAY[]::UUID[],
  import_options JSONB DEFAULT '{}'::jsonb,
  error_log JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vcf_imports_user_id ON public.vcf_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_vcf_imports_status ON public.vcf_imports(status);
CREATE INDEX IF NOT EXISTS idx_vcf_imports_created_at ON public.vcf_imports(created_at DESC);

-- RLS Policies
ALTER TABLE public.vcf_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own VCF imports"
  ON public.vcf_imports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VCF imports"
  ON public.vcf_imports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VCF imports"
  ON public.vcf_imports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VCF imports"
  ON public.vcf_imports
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE consent_receipts TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.consent_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  field_path TEXT,
  consent_action TEXT NOT NULL CHECK (consent_action IN ('granted', 'revoked', 'modified')),
  scope TEXT NOT NULL CHECK (scope IN ('public', 'authenticated', 'family', 'friends', 'private')),
  recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  evidence JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_receipts_user_id ON public.consent_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_receipts_card_id ON public.consent_receipts(card_id);
CREATE INDEX IF NOT EXISTS idx_consent_receipts_created_at ON public.consent_receipts(created_at DESC);

-- RLS Policies
ALTER TABLE public.consent_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent receipts"
  ON public.consent_receipts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consent receipts"
  ON public.consent_receipts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent receipts"
  ON public.consent_receipts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 5. CREATE TRIGGERS FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_card_merge_conflicts_updated_at ON public.card_merge_conflicts;
CREATE TRIGGER update_card_merge_conflicts_updated_at
  BEFORE UPDATE ON public.card_merge_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vcf_imports_updated_at ON public.vcf_imports;
CREATE TRIGGER update_vcf_imports_updated_at
  BEFORE UPDATE ON public.vcf_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_merge_conflicts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcf_imports TO authenticated;
GRANT SELECT, INSERT ON public.consent_receipts TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE public.card_merge_conflicts IS 'Tracks merge conflicts when multiple vCards for same person exist';
COMMENT ON TABLE public.vcf_imports IS 'Tracks VCF file import jobs and their status';
COMMENT ON TABLE public.consent_receipts IS 'Audit trail for field-level consent changes';
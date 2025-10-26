-- Clear all test/fictional data while preserving schema and configuration
-- This removes operational data but keeps system templates, categories, and user accounts

-- Clear relationship and invitation data (in dependency order)
DELETE FROM public.card_merge_conflicts;
DELETE FROM public.vcf_imports;
DELETE FROM public.card_invitations;
DELETE FROM public.bulk_import_jobs;
DELETE FROM public.demo_generation_jobs;

-- Clear card-related data
DELETE FROM public.card_labels;
DELETE FROM public.card_field_values;
DELETE FROM public.card_relationships;
DELETE FROM public.user_cards;

-- Clear family management data
DELETE FROM public.pending_family_profiles;
DELETE FROM public.family_ownership_transfers;
DELETE FROM public.organization_memberships WHERE is_family_unit = true;
DELETE FROM public.family_units;

-- Clear relationship cards (new system)
DELETE FROM public.relationship_cards;

-- Clear merchant/provider interactions
DELETE FROM public.relationship_interactions;
DELETE FROM public.user_provider_relationships;
DELETE FROM public.merchant_qr_codes;
DELETE FROM public.merchant_inventory;

-- Clear consent and permission records
DELETE FROM public.consent_receipts;
DELETE FROM public.privacy_consents;
DELETE FROM public.sharing_permissions;

-- Clear audit logs (optional - keeping for transparency of this clearing action)
-- DELETE FROM public.audit_logs;

-- Log this data clearing action
INSERT INTO public.audit_logs (
  table_name,
  operation,
  user_id,
  new_values
) VALUES (
  'system_wide',
  'DATA_CLEAR',
  auth.uid(),
  jsonb_build_object(
    'reason', 'Fresh start with relationshipCARD model',
    'cleared_at', now(),
    'tables_cleared', ARRAY[
      'card_merge_conflicts',
      'vcf_imports', 
      'card_invitations',
      'bulk_import_jobs',
      'demo_generation_jobs',
      'card_labels',
      'card_field_values',
      'card_relationships',
      'user_cards',
      'pending_family_profiles',
      'family_ownership_transfers',
      'organization_memberships (family)',
      'family_units',
      'relationship_cards',
      'relationship_interactions',
      'user_provider_relationships',
      'merchant_qr_codes',
      'merchant_inventory',
      'consent_receipts',
      'privacy_consents',
      'sharing_permissions'
    ]
  )
);

-- Preserved data:
-- ✅ profiles (user accounts remain)
-- ✅ user_roles (admin access preserved)
-- ✅ card_templates (system templates)
-- ✅ template_fields (template definitions)
-- ✅ standard_card_templates (standard library)
-- ✅ family_card_templates (family templates)
-- ✅ card_categories (categories)
-- ✅ sharing_templates (sharing configs)
-- ✅ data_retention_policies (policies)
-- ✅ providers (organization accounts)
-- ✅ audit_logs (audit trail preserved)
-- Fix 1: Create provider entries for existing non-individual accounts
INSERT INTO providers (name, provider_type, description, capabilities, contact_info)
SELECT 
  COALESCE(entity_name, first_name || ' ' || last_name) as name,
  'organization' as provider_type,
  'Organization provider account' as description,
  '["organization_services", "card_sharing"]'::jsonb as capabilities,
  jsonb_build_object(
    'email', email,
    'representative', 
    CASE 
      WHEN rep_first_name IS NOT NULL AND rep_last_name IS NOT NULL 
      THEN rep_first_name || ' ' || rep_last_name
      ELSE NULL 
    END
  ) as contact_info
FROM profiles 
WHERE account_type = 'non_individual'
AND NOT EXISTS (
  SELECT 1 FROM providers 
  WHERE providers.name = COALESCE(profiles.entity_name, profiles.first_name || ' ' || profiles.last_name)
);

-- Fix 2: Create trigger to automatically add non-individual accounts as providers
CREATE OR REPLACE FUNCTION handle_new_organization_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create provider for non-individual accounts
  IF NEW.account_type = 'non_individual' THEN
    INSERT INTO providers (name, provider_type, description, capabilities, contact_info)
    VALUES (
      COALESCE(NEW.entity_name, NEW.first_name || ' ' || NEW.last_name),
      'organization',
      'Organization provider account',
      '["organization_services", "card_sharing"]'::jsonb,
      jsonb_build_object(
        'email', NEW.email,
        'representative', 
        CASE 
          WHEN NEW.rep_first_name IS NOT NULL AND NEW.rep_last_name IS NOT NULL 
          THEN NEW.rep_first_name || ' ' || NEW.rep_last_name
          ELSE NULL 
        END
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new organization accounts
CREATE TRIGGER on_new_organization_provider
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_organization_provider();
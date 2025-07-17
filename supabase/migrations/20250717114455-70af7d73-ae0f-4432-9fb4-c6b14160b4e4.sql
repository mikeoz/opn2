-- Create the Leasehold CARD template for BBT
INSERT INTO card_templates (
  name,
  description,
  type,
  transaction_code,
  created_by
) VALUES (
  'Leasehold CARD',
  'BBT property leasehold information card for tracking lot and parcel details',
  'admin',
  'S',
  NULL  -- Admin template, no specific creator
);

-- Get the template ID for field creation
-- We'll create the fields for the leasehold template
WITH leasehold_template AS (
  SELECT id FROM card_templates WHERE name = 'Leasehold CARD' AND type = 'admin' LIMIT 1
)
INSERT INTO template_fields (
  template_id,
  field_name,
  field_type,
  is_required,
  display_order
)
SELECT 
  lt.id,
  field_data.field_name,
  field_data.field_type::field_type,
  field_data.is_required,
  field_data.display_order
FROM leasehold_template lt,
(VALUES 
  ('Lot Number', 'string', true, 1),
  ('Parcel Number', 'string', true, 2),
  ('Parcel 2 Number', 'string', false, 3),
  ('OLOT', 'string', false, 4),
  ('Original Lease Date', 'string', true, 5)
) AS field_data(field_name, field_type, is_required, display_order);
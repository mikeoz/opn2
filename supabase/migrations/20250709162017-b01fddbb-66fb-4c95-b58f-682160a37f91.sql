-- Create organization card template
INSERT INTO public.card_templates (
  name,
  description,
  type,
  card_type,
  transaction_code
) VALUES (
  'Organization',
  'Template for organization/group information',
  'admin',
  'admin',
  'S'
);

-- Get the template ID for adding fields
DO $$
DECLARE
  template_id uuid;
BEGIN
  -- Get the organization template ID
  SELECT id INTO template_id 
  FROM public.card_templates 
  WHERE name = 'Organization' AND type = 'admin';

  -- Add organization name field
  INSERT INTO public.template_fields (
    template_id,
    field_name,
    field_type,
    is_required,
    display_order
  ) VALUES (
    template_id,
    'Organization Name',
    'string',
    true,
    1
  );

  -- Add organization description field
  INSERT INTO public.template_fields (
    template_id,
    field_name,
    field_type,
    is_required,
    display_order
  ) VALUES (
    template_id,
    'Description',
    'string',
    false,
    2
  );

  -- Add organization type field
  INSERT INTO public.template_fields (
    template_id,
    field_name,
    field_type,
    is_required,
    display_order
  ) VALUES (
    template_id,
    'Organization Type',
    'string',
    false,
    3
  );

  -- Add contact information field
  INSERT INTO public.template_fields (
    template_id,
    field_name,
    field_type,
    is_required,
    display_order
  ) VALUES (
    template_id,
    'Contact Information',
    'string',
    false,
    4
  );
END $$;
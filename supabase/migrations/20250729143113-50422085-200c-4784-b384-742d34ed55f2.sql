-- Create BBT Address UTC (special form of addressCARD)
INSERT INTO public.card_templates (name, description, type, transaction_code, category_id)
VALUES (
  'BBT Address Card',
  'Specialized address card for Bethany Beach Tennis community with lot and leasehold information',
  'user',
  'S',
  (SELECT id FROM card_categories WHERE name = 'Enhanced Contact' LIMIT 1)
);

-- Get the BBT Address template ID
DO $$
DECLARE
    bbt_address_template_id uuid;
    household_template_id uuid;
    admin_template_id uuid;
BEGIN
    -- Get BBT Address template ID
    SELECT id INTO bbt_address_template_id 
    FROM card_templates 
    WHERE name = 'BBT Address Card';
    
    -- Create BBT Address template fields
    INSERT INTO public.template_fields (template_id, field_name, field_type, is_required, display_order) VALUES
    (bbt_address_template_id, 'Lot Number', 'string', true, 1),
    (bbt_address_template_id, 'Additional Lot Number', 'string', false, 2),
    (bbt_address_template_id, 'Bethany Address Street Number', 'string', true, 3),
    (bbt_address_template_id, 'Bethany Address Street Name', 'string', true, 4),
    (bbt_address_template_id, 'Additional Leasehold Contact', 'string', false, 5);

    -- Create householdCARD UTC
    INSERT INTO public.card_templates (name, description, type, transaction_code, category_id)
    VALUES (
      'Household Card',
      'Card for managing household information and primary contacts',
      'user',
      'S',
      (SELECT id FROM card_categories WHERE name = 'Organization & Role' LIMIT 1)
    );
    
    -- Get household template ID
    SELECT id INTO household_template_id 
    FROM card_templates 
    WHERE name = 'Household Card';
    
    -- Create household template fields
    INSERT INTO public.template_fields (template_id, field_name, field_type, is_required, display_order) VALUES
    (household_template_id, 'Household ID', 'string', true, 1),
    (household_template_id, 'Household Name', 'string', true, 2),
    (household_template_id, 'Household Primary Contact', 'string', true, 3);

    -- Create userAdminCARD UTC
    INSERT INTO public.card_templates (name, description, type, transaction_code, category_id)
    VALUES (
      'User Admin Card',
      'Administrative card for tracking organization user changes and updates',
      'user',
      'S',
      (SELECT id FROM card_categories WHERE name = 'Organization & Role' LIMIT 1)
    );
    
    -- Get admin template ID
    SELECT id INTO admin_template_id 
    FROM card_templates 
    WHERE name = 'User Admin Card';
    
    -- Create admin template fields
    INSERT INTO public.template_fields (template_id, field_name, field_type, is_required, display_order) VALUES
    (admin_template_id, 'Begin Date', 'string', false, 1),
    (admin_template_id, 'Update Date', 'string', false, 2),
    (admin_template_id, 'Change Type', 'string', true, 3),
    (admin_template_id, 'Modified By Organization', 'string', true, 4),
    (admin_template_id, 'Change Notes', 'string', false, 5);
END $$;
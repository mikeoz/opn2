-- Clean up test family unit records for robert.johnson@testco.com
DELETE FROM family_units 
WHERE trust_anchor_user_id = (
  SELECT id FROM profiles WHERE email = 'robert.johnson@testco.com'
);
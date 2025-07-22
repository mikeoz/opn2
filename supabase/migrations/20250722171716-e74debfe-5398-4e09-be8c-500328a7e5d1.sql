-- Create Standard Template Cards (STCs) for Community Onboarding
-- Personal Information STCs
INSERT INTO standard_card_templates (name, description, category, template_data, version, is_active) VALUES

-- 1. birthCARD
('birthCARD', 'Personal birth date information with privacy controls', 'Personal Information', 
'{
  "fields": [
    {"name": "birth_month", "type": "string", "required": true, "order": 1, "options": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]},
    {"name": "birth_day", "type": "string", "required": true, "order": 2},
    {"name": "birth_year", "type": "string", "required": true, "order": 3},
    {"name": "show_year", "type": "string", "required": false, "order": 4, "options": ["Yes", "No"], "default": "No"}
  ]
}', '1.0', true),

-- 2. anniversaryCARD
('anniversaryCARD', 'Anniversary date information with privacy controls', 'Personal Information', 
'{
  "fields": [
    {"name": "anniversary_month", "type": "string", "required": true, "order": 1, "options": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]},
    {"name": "anniversary_day", "type": "string", "required": true, "order": 2},
    {"name": "anniversary_year", "type": "string", "required": true, "order": 3},
    {"name": "show_year", "type": "string", "required": false, "order": 4, "options": ["Yes", "No"], "default": "No"}
  ]
}', '1.0', true),

-- 3. sexCARD (Gender)
('sexCARD', 'Gender identification', 'Personal Information', 
'{
  "fields": [
    {"name": "gender", "type": "string", "required": true, "order": 1, "options": ["M", "F", "Other", "Prefer not to say"]}
  ]
}', '1.0', true),

-- 4. maritalCARD
('maritalCARD', 'Marital status information', 'Personal Information', 
'{
  "fields": [
    {"name": "marital_status", "type": "string", "required": true, "order": 1, "options": ["Single", "Married", "Divorced", "Widowed", "Separated"]},
    {"name": "spouse_reference", "type": "string", "required": false, "order": 2, "description": "Reference to spouse personCARD"}
  ]
}', '1.0', true);

-- Educational STCs
INSERT INTO standard_card_templates (name, description, category, template_data, version, is_active) VALUES

-- 5. gradeCARD
('gradeCARD', 'Student grade level information', 'Educational', 
'{
  "fields": [
    {"name": "grade_level", "type": "string", "required": true, "order": 1, "options": ["Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade", "College", "Graduate"]},
    {"name": "school_year", "type": "string", "required": true, "order": 2},
    {"name": "status", "type": "string", "required": true, "order": 3, "options": ["Active", "Graduated", "Transferred"]}
  ]
}', '1.0', true),

-- 6. schoolCARD
('schoolCARD', 'Educational institution information', 'Educational', 
'{
  "fields": [
    {"name": "school_name", "type": "string", "required": true, "order": 1},
    {"name": "school_type", "type": "string", "required": true, "order": 2, "options": ["Elementary", "Middle School", "High School", "College", "University", "Trade School", "Other"]},
    {"name": "address_reference", "type": "string", "required": false, "order": 3, "description": "Reference to associated addressCARD"}
  ]
}', '1.0', true);

-- Medical & Family STCs  
INSERT INTO standard_card_templates (name, description, category, template_data, version, is_active) VALUES

-- 7. medicalCARD
('medicalCARD', 'Medical information and emergency contacts', 'Medical & Family', 
'{
  "fields": [
    {"name": "medical_notes", "type": "string", "required": false, "order": 1},
    {"name": "allergies", "type": "string", "required": false, "order": 2},
    {"name": "medications", "type": "string", "required": false, "order": 3},
    {"name": "emergency_contact", "type": "string", "required": false, "order": 4},
    {"name": "emergency_phone", "type": "string", "required": false, "order": 5}
  ]
}', '1.0', true),

-- 8. kidCARD
('kidCARD', 'Child/minor status and guardian information', 'Medical & Family', 
'{
  "fields": [
    {"name": "minor_status", "type": "string", "required": true, "order": 1, "options": ["Yes", "No"]},
    {"name": "parent_guardian_1", "type": "string", "required": false, "order": 2, "description": "Reference to parent/guardian personCARD"},
    {"name": "parent_guardian_2", "type": "string", "required": false, "order": 3, "description": "Reference to second parent/guardian personCARD"},
    {"name": "age_verification", "type": "string", "required": false, "order": 4}
  ]
}', '1.0', true);

-- Organization & Role STCs
INSERT INTO standard_card_templates (name, description, category, template_data, version, is_active) VALUES

-- 9. statusCARD
('statusCARD', 'Organization membership status', 'Organization & Role', 
'{
  "fields": [
    {"name": "active_member", "type": "string", "required": true, "order": 1, "options": ["Yes", "No"]},
    {"name": "status_type", "type": "string", "required": true, "order": 2, "options": ["Leaseholder", "Family", "Friend", "Child", "Renter", "Unassigned"]},
    {"name": "effective_date", "type": "string", "required": true, "order": 3}
  ]
}', '1.0', true),

-- 10. orgMemberCARD
('orgMemberCARD', 'Organization membership card issued by organization', 'Organization & Role', 
'{
  "fields": [
    {"name": "membership_type", "type": "string", "required": true, "order": 1, "options": ["Leaseholder", "Family", "Friend", "Child", "Renter", "Unassigned"]},
    {"name": "issue_date", "type": "string", "required": true, "order": 2},
    {"name": "expiry_date", "type": "string", "required": false, "order": 3},
    {"name": "issuing_organization", "type": "string", "required": true, "order": 4},
    {"name": "inactive_reason", "type": "string", "required": false, "order": 5, "options": ["Moved", "Deceased", "Expelled", "Voluntary", "Other"]},
    {"name": "inactive_date", "type": "string", "required": false, "order": 6}
  ]
}', '1.0', true),

-- 11. roleCARD
('roleCARD', 'Role assignment within organization or community', 'Organization & Role', 
'{
  "fields": [
    {"name": "role_title", "type": "string", "required": true, "order": 1, "options": ["Teacher", "Staff", "Employee", "bgCheck", "1st Responder", "Other"]},
    {"name": "custom_role", "type": "string", "required": false, "order": 2, "description": "Custom role title when Other is selected"},
    {"name": "begin_date", "type": "string", "required": true, "order": 3},
    {"name": "end_date", "type": "string", "required": false, "order": 4},
    {"name": "notes", "type": "string", "required": false, "order": 5}
  ]
}', '1.0', true);

-- Enhanced Contact STCs (modifications to existing contact cards)
INSERT INTO standard_card_templates (name, description, category, template_data, version, is_active) VALUES

-- 12. Enhanced addressCARD
('addressCARD', 'Physical address information with type classification', 'Contact Information', 
'{
  "fields": [
    {"name": "address_type", "type": "string", "required": true, "order": 1, "options": ["Home", "Work", "User Label"], "default": "Home"},
    {"name": "custom_label", "type": "string", "required": false, "order": 2, "description": "Custom label when User Label is selected"},
    {"name": "street_address", "type": "string", "required": true, "order": 3},
    {"name": "city", "type": "string", "required": true, "order": 4},
    {"name": "state_province", "type": "string", "required": true, "order": 5},
    {"name": "postal_code", "type": "string", "required": true, "order": 6},
    {"name": "country", "type": "string", "required": true, "order": 7, "default": "United States"}
  ]
}', '1.0', true),

-- 13. Enhanced phoneCARD
('phoneCARD', 'Phone number information with type classification', 'Contact Information', 
'{
  "fields": [
    {"name": "phone_type", "type": "string", "required": true, "order": 1, "options": ["Home", "Work", "Mobile", "Pager", "Fax", "Skype", "User Label"], "default": "Mobile"},
    {"name": "custom_label", "type": "string", "required": false, "order": 2, "description": "Custom label when User Label is selected"},
    {"name": "phone_number", "type": "string", "required": true, "order": 3},
    {"name": "extension", "type": "string", "required": false, "order": 4}
  ]
}', '1.0', true),

-- 14. Enhanced emailCARD
('emailCARD', 'Email address information with type classification', 'Contact Information', 
'{
  "fields": [
    {"name": "email_type", "type": "string", "required": true, "order": 1, "options": ["Home", "Work", "User Label"], "default": "Home"},
    {"name": "custom_label", "type": "string", "required": false, "order": 2, "description": "Custom label when User Label is selected"},
    {"name": "email_address", "type": "string", "required": true, "order": 3}
  ]
}', '1.0', true);
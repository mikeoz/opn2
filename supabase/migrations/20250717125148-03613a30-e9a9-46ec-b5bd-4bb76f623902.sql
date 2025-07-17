-- Migration to transfer admin privileges from communications@bbt.org to mikeoz@brightspotpartners.org

-- First, let's check if mikeoz@brightspotpartners.org exists and grant admin role if they do
DO $$ 
DECLARE
    target_user_id uuid;
    old_admin_id uuid;
BEGIN
    -- Find the user ID for mikeoz@brightspotpartners.org
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE email = 'mikeoz@brightspotpartners.org';
    
    -- Find the user ID for communications@bbt.org
    SELECT id INTO old_admin_id 
    FROM profiles 
    WHERE email = 'communications@bbt.org';
    
    -- If the new admin user exists, grant them admin role
    IF target_user_id IS NOT NULL THEN
        -- Insert admin role for new user (ignore if already exists)
        INSERT INTO user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role granted to mikeoz@brightspotpartners.org (ID: %)', target_user_id;
    ELSE
        RAISE NOTICE 'User mikeoz@brightspotpartners.org not found. They need to register first.';
    END IF;
    
    -- Remove admin role from old admin if they exist
    IF old_admin_id IS NOT NULL THEN
        DELETE FROM user_roles 
        WHERE user_id = old_admin_id AND role = 'admin';
        
        RAISE NOTICE 'Admin role removed from communications@bbt.org (ID: %)', old_admin_id;
    ELSE
        RAISE NOTICE 'User communications@bbt.org not found in system.';
    END IF;
    
END $$;

-- Verify the changes
SELECT 
    p.email,
    p.first_name,
    p.last_name,
    p.entity_name,
    ur.role,
    'Current admin status' as status
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY p.email;
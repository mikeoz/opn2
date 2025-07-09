-- Assign admin role to communications@bbt.org user
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM profiles p
WHERE p.email = 'communications@bbt.org'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'admin'
);
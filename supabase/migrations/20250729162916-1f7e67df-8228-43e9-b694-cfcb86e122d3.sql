-- Manually assign admin role to existing organization user who didn't get it during registration
INSERT INTO public.user_roles (user_id, role)
VALUES ('a5ab7627-0122-436d-8d9f-32b8db48b591', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
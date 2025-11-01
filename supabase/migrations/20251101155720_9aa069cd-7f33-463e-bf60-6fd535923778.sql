-- Create a security definer function to get family member count
-- This bypasses RLS to correctly count all family members
CREATE OR REPLACE FUNCTION public.get_family_member_count(family_trust_anchor_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM organization_memberships
  WHERE organization_user_id = family_trust_anchor_id
    AND is_family_unit = true
    AND status = 'active';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_family_member_count(uuid) TO authenticated;
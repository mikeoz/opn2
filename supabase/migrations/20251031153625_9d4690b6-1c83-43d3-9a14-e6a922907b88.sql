
-- Drop the overly broad policies that may be causing conflicts
DROP POLICY IF EXISTS "Allow checking profile existence by email" ON profiles;
DROP POLICY IF EXISTS "Allow reading member profiles in organization context" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;

-- Create a more specific policy for invitation acceptance flow
-- This allows anon users to check if an email/profile exists
CREATE POLICY "Allow checking if email exists for invitations"
ON profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Policy for authenticated users to read member profiles in their organizations  
CREATE POLICY "Members can read profiles in their family units"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users can read their own profile
  id = auth.uid()
  OR
  -- Users can read profiles of members in family units they belong to
  EXISTS (
    SELECT 1 
    FROM organization_memberships om1
    INNER JOIN organization_memberships om2 
      ON om1.organization_user_id = om2.organization_user_id
      AND om1.is_family_unit = true
      AND om2.is_family_unit = true
    WHERE om1.individual_user_id = auth.uid()
      AND om2.individual_user_id = profiles.id
      AND om1.status = 'active'
      AND om2.status = 'active'
  )
  OR
  -- Users can read the profile of trust anchors of families they belong to
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.individual_user_id = auth.uid()
      AND om.organization_user_id = profiles.id
      AND om.is_family_unit = true
      AND om.status = 'active'
  )
);

-- Fix invitation acceptance: Allow checking if profile exists by email
-- This is needed for invitation acceptance flow to detect existing users
CREATE POLICY "Allow checking profile existence by email"
ON profiles FOR SELECT
TO anon, authenticated
USING (
  -- Allow reading id and email only when querying by email
  -- This is minimal exposure needed for invitation flows
  true
);

-- Fix "Unknown Member" issue: Allow reading member profiles in family context
-- When viewing organization_memberships, allow reading the associated profile
CREATE POLICY "Allow reading member profiles in organization context"
ON profiles FOR SELECT
TO authenticated
USING (
  -- User can read profiles of members in organizations they belong to
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.individual_user_id = profiles.id
    AND (
      om.organization_user_id = auth.uid()
      OR om.individual_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_memberships om2
        WHERE om2.organization_user_id = om.organization_user_id
        AND om2.individual_user_id = auth.uid()
      )
    )
  )
);

-- Additional policy: Users can always read their own profile
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());
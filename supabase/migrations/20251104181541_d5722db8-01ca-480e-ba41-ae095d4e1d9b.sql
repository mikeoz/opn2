-- Add DELETE policy for pending_family_profiles so creators can delete their own profiles
CREATE POLICY "Users can delete seed profiles they created"
ON pending_family_profiles
FOR DELETE
USING (auth.uid() = created_by);

-- Delete the stuck Wayland Peterson pending profile
DELETE FROM pending_family_profiles
WHERE first_name = 'Wayland' 
  AND last_name = 'Peterson'
  AND status = 'pending';

COMMENT ON POLICY "Users can delete seed profiles they created" ON pending_family_profiles IS 'Allows family unit owners to delete pending profiles they created';
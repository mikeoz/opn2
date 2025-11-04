-- Update get_family_member_count to include claimed pending profiles
CREATE OR REPLACE FUNCTION public.get_family_member_count(family_trust_anchor_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (
    -- Count active organization memberships
    (SELECT COUNT(*)::integer
     FROM organization_memberships
     WHERE organization_user_id = family_trust_anchor_id
       AND is_family_unit = true
       AND status = 'active')
    +
    -- Count claimed pending profiles (minors without accounts)
    (SELECT COUNT(*)::integer
     FROM pending_family_profiles pfp
     JOIN family_units fu ON fu.id = pfp.family_unit_id
     WHERE fu.trust_anchor_user_id = family_trust_anchor_id
       AND pfp.status = 'claimed')
  )::integer
$function$;

-- Create index for better performance on pending_family_profiles queries
CREATE INDEX IF NOT EXISTS idx_pending_profiles_family_status 
ON pending_family_profiles(family_unit_id, status) 
WHERE status = 'claimed';

COMMENT ON FUNCTION public.get_family_member_count IS 'Returns total count of family members including both active memberships and claimed pending profiles (minors without accounts)';
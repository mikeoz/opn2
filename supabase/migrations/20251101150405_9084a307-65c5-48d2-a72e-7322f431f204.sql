
-- Create atomic transaction function for accepting family invitations
CREATE OR REPLACE FUNCTION public.accept_family_invitation_transaction(
  p_invitation_id UUID,
  p_user_id UUID,
  p_trust_anchor_user_id UUID,
  p_relationship_role TEXT,
  p_invited_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_membership_id UUID;
  v_result JSONB;
BEGIN
  -- Update invitation status to accepted
  UPDATE family_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_invitation_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitation not found or already processed'
    );
  END IF;
  
  -- Check for existing membership to avoid duplicates
  IF EXISTS (
    SELECT 1 
    FROM organization_memberships 
    WHERE individual_user_id = p_user_id 
      AND organization_user_id = p_trust_anchor_user_id
      AND is_family_unit = true
      AND status = 'active'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already a member of this family'
    );
  END IF;
  
  -- Create organization membership
  INSERT INTO organization_memberships (
    individual_user_id,
    organization_user_id,
    relationship_label,
    permissions,
    is_family_unit,
    membership_type,
    status,
    created_by
  ) VALUES (
    p_user_id,
    p_trust_anchor_user_id,
    p_relationship_role,
    jsonb_build_object('family_member', true),
    true,
    'member',
    'active',
    p_invited_by
  )
  RETURNING id INTO v_membership_id;
  
  -- Build success response
  v_result := jsonb_build_object(
    'success', true,
    'membership_id', v_membership_id,
    'message', 'Family invitation accepted successfully'
  );
  
  RETURN v_result;
END;
$$;
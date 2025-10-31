-- Phase 1: Enable real-time updates for family invitation reciprocity
-- This allows both inviter and invitee to see real-time updates when invitations are accepted

-- Enable real-time for family_invitations table
ALTER TABLE family_invitations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE family_invitations;

-- Enable real-time for organization_memberships table
ALTER TABLE organization_memberships REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_memberships;
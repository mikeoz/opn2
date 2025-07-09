-- Fix foreign key constraints for organization_memberships table
ALTER TABLE organization_memberships 
ADD CONSTRAINT organization_memberships_individual_user_id_fkey 
FOREIGN KEY (individual_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE organization_memberships 
ADD CONSTRAINT organization_memberships_organization_user_id_fkey 
FOREIGN KEY (organization_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE organization_memberships 
ADD CONSTRAINT organization_memberships_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
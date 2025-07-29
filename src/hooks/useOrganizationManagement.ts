
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type OrganizationMember = {
  id: string;
  individual_user_id: string;
  membership_type: string;
  status: string;
  joined_at: string | null;
  expires_at: string | null;
  permissions: any;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  user_roles: {
    role: string;
  }[];
};

type InviteAdminData = {
  email: string;
  firstName: string;
  lastName: string;
  membershipType: 'admin' | 'member';
  permissions?: any;
};

export const useOrganizationManagement = () => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMembers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          individual_user_id,
          membership_type,
          status,
          joined_at,
          expires_at,
          permissions,
          individual_user:profiles!organization_memberships_individual_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Fetch user roles for each member
      const membersWithRoles = await Promise.all(
        (data || []).map(async (member: any) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', member.individual_user_id);

          return {
            id: member.id,
            individual_user_id: member.individual_user_id,
            membership_type: member.membership_type,
            status: member.status,
            joined_at: member.joined_at,
            expires_at: member.expires_at,
            permissions: member.permissions,
            profile: member.individual_user,
            user_roles: roles || []
          };
        })
      );

      setMembers(membersWithRoles);
    } catch (error: any) {
      console.error('Error fetching organization members:', error);
      toast({
        title: "Error",
        description: "Failed to load organization members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteAdmin = async (inviteData: InviteAdminData) => {
    if (!user) return false;

    setInviteLoading(true);
    try {
      // Check if user exists by email
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email)
        .limit(1);

      if (profileError) throw profileError;

      let targetUserId: string;

      if (existingProfiles && existingProfiles.length > 0) {
        // User exists, use their ID
        targetUserId = existingProfiles[0].id;
      } else {
        toast({
          title: "User not found",
          description: "The user must register first before being added to the organization",
          variant: "destructive",
        });
        return false;
      }

      // Check if membership already exists
      const { data: existingMembership } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('organization_user_id', user.id)
        .eq('individual_user_id', targetUserId)
        .limit(1);

      if (existingMembership && existingMembership.length > 0) {
        toast({
          title: "Already a member",
          description: "This user is already a member of your organization",
          variant: "destructive",
        });
        return false;
      }

      // Create organization membership
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert({
          organization_user_id: user.id,
          individual_user_id: targetUserId,
          membership_type: inviteData.membershipType,
          status: 'active',
          created_by: user.id,
          permissions: inviteData.permissions || {}
        });

      if (membershipError) throw membershipError;

      // If inviting as admin, grant admin role using secure function
      if (inviteData.membershipType === 'admin') {
        const { error: roleError } = await supabase.rpc('assign_admin_role', {
          target_user_id: targetUserId
        });

        if (roleError) {
          console.error('Error assigning admin role:', roleError);
          // Continue with membership creation even if role assignment fails
        }
      }

      toast({
        title: "Success",
        description: `${inviteData.firstName} ${inviteData.lastName} has been added to your organization`,
      });

      await fetchMembers(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error inviting admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
      return false;
    } finally {
      setInviteLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newMembershipType: 'admin' | 'member') => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return false;

      // Update membership type
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .update({ membership_type: newMembershipType })
        .eq('id', memberId);

      if (membershipError) throw membershipError;

      // Handle admin role using secure functions
      if (newMembershipType === 'admin') {
        // Grant admin role using secure function
        const { error: roleError } = await supabase.rpc('assign_admin_role', {
          target_user_id: member.individual_user_id
        });

        if (roleError) {
          console.error('Error assigning admin role:', roleError);
          throw roleError;
        }
      } else {
        // Remove admin role using secure function
        const { error: roleError } = await supabase.rpc('revoke_admin_role', {
          target_user_id: member.individual_user_id
        });

        if (roleError) {
          console.error('Error revoking admin role:', roleError);
          throw roleError;
        }
      }

      toast({
        title: "Success",
        description: `Member role updated to ${newMembershipType}`,
      });

      await fetchMembers(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return false;

      // Remove organization membership
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', memberId);

      if (membershipError) throw membershipError;

      // Remove admin role if they had it using secure function
      if (member.user_roles.some(role => role.role === 'admin')) {
        const { error: roleError } = await supabase.rpc('revoke_admin_role', {
          target_user_id: member.individual_user_id
        });
        
        if (roleError) {
          console.error('Error revoking admin role during member removal:', roleError);
          // Continue with removal even if role revocation fails
        }
      }
      
      toast({
        title: "Success",
        description: "Member removed from organization",
      });

      await fetchMembers(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  return {
    members,
    loading,
    inviteLoading,
    fetchMembers,
    inviteAdmin,
    updateMemberRole,
    removeMember
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OrganizationMembership {
  id: string;
  individual_user_id: string;
  organization_user_id: string;
  membership_type: string;
  status: string;
  permissions: Record<string, any>;
  joined_at: string;
  expires_at?: string;
  created_by?: string;
  // Joined data
  individual_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  organization_profile?: {
    organization_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const useOrganizationMemberships = () => {
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchMemberships = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get memberships first
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('*')
        .order('joined_at', { ascending: false });

      if (membershipError) throw membershipError;

      // Get all profile IDs we need
      const profileIds = new Set<string>();
      membershipData?.forEach(membership => {
        profileIds.add(membership.individual_user_id);
        profileIds.add(membership.organization_user_id);
      });

      // Get profiles - using the new unified field structure
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, organization_name')
        .in('id', Array.from(profileIds));

      if (profileError) throw profileError;

      // Create profile lookup
      const profileLookup = new Map(profileData?.map(p => [p.id, p]) || []);

      // Combine data
      const enrichedMemberships = membershipData?.map(membership => ({
        ...membership,
        permissions: membership.permissions as Record<string, any> || {},
        individual_profile: profileLookup.get(membership.individual_user_id),
        organization_profile: profileLookup.get(membership.organization_user_id)
      })) || [];

      setMemberships(enrichedMemberships);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast.error('Failed to load memberships');
    } finally {
      setLoading(false);
    }
  };

  const createMembership = async (
    individualUserId: string,
    organizationUserId: string,
    membershipType: string = 'member',
    permissions: Record<string, any> = {}
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('organization_memberships')
        .insert({
          individual_user_id: individualUserId,
          organization_user_id: organizationUserId,
          membership_type: membershipType,
          permissions,
          created_by: user.id,
        });

      if (error) throw error;
      
      toast.success('Membership created successfully');
      await fetchMemberships();
      return true;
    } catch (error) {
      console.error('Error creating membership:', error);
      toast.error('Failed to create membership');
      return false;
    }
  };

  const updateMembershipStatus = async (membershipId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ status })
        .eq('id', membershipId);

      if (error) throw error;
      
      toast.success('Membership status updated');
      await fetchMemberships();
      return true;
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error('Failed to update membership status');
      return false;
    }
  };

  const deleteMembership = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      toast.success('Membership removed');
      await fetchMemberships();
      return true;
    } catch (error) {
      console.error('Error deleting membership:', error);
      toast.error('Failed to remove membership');
      return false;
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [user]);

  return {
    memberships,
    loading,
    createMembership,
    updateMembershipStatus,
    deleteMembership,
    refetch: fetchMemberships
  };
};

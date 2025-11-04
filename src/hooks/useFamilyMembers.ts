import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyMember {
  id: string;
  name: string;
  firstName: string;
  lastName?: string;
  email?: string;
  relationshipLabel: string;
  joinedAt?: string;
  memberType: 'full' | 'pending' | 'minor';
  isMinor: boolean;
  canTransferOwnership: boolean;
  profileType: 'membership' | 'pending';
  generation?: number;
}

export const useFamilyMembers = (familyUnitId?: string) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchMembers = async () => {
    if (!user || !familyUnitId) return;

    try {
      setLoading(true);

      // Fetch active memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          individual_user_id,
          relationship_label,
          joined_at,
          family_generation,
          is_minor,
          profiles:individual_user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_user_id', familyUnitId)
        .eq('is_family_unit', true)
        .eq('status', 'active');

      if (membershipError) throw membershipError;

      // Fetch claimed pending profiles (minors without accounts)
      const { data: pendingProfiles, error: pendingError } = await supabase
        .from('pending_family_profiles')
        .select('*')
        .eq('family_unit_id', familyUnitId)
        .eq('status', 'claimed')
        .eq('created_by', user.id);

      if (pendingError) throw pendingError;

      // Combine and format the results
      const fullMembers: FamilyMember[] = (memberships || []).map((m: any) => ({
        id: m.id,
        name: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim(),
        firstName: m.profiles?.first_name || '',
        lastName: m.profiles?.last_name,
        email: m.profiles?.email,
        relationshipLabel: m.relationship_label || 'Family Member',
        joinedAt: m.joined_at,
        memberType: m.is_minor ? 'minor' : 'full',
        isMinor: m.is_minor || false,
        canTransferOwnership: false,
        profileType: 'membership',
        generation: m.family_generation
      }));

      const pendingMembers: FamilyMember[] = (pendingProfiles || []).map((p: any) => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        firstName: p.first_name || '',
        lastName: p.last_name,
        email: p.seed_data?.has_email ? p.email : undefined,
        relationshipLabel: p.relationship_label || 'Family Member',
        joinedAt: p.created_at,
        memberType: 'minor',
        isMinor: true,
        canTransferOwnership: true,
        profileType: 'pending',
        generation: p.generation_level
      }));

      setMembers([...fullMembers, ...pendingMembers]);
    } catch (error: any) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const transferOwnership = async (pendingProfileId: string, newOwnerEmail: string): Promise<boolean> => {
    try {
      // This will create an invitation for the minor to claim their account
      const { error } = await supabase.functions.invoke('email-profile-claim-invitation', {
        body: {
          profileId: pendingProfileId,
          newOwnerEmail,
          transferType: 'ownership_transfer'
        }
      });

      if (error) throw error;

      toast.success('Ownership transfer invitation sent', {
        description: 'The recipient will receive an email to claim this account.'
      });

      return true;
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      toast.error('Failed to send transfer invitation');
      return false;
    }
  };

  useEffect(() => {
    if (!user || !familyUnitId) return;

    fetchMembers();

    // Set up real-time subscriptions
    const channelId = `family-members-${familyUnitId}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_memberships',
          filter: `organization_user_id=eq.${familyUnitId}`
        },
        () => {
          console.log('Family memberships changed, refreshing...');
          fetchMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_family_profiles',
          filter: `family_unit_id=eq.${familyUnitId}`
        },
        () => {
          console.log('Pending profiles changed, refreshing...');
          fetchMembers();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, familyUnitId]);

  return {
    members,
    loading,
    transferOwnership,
    refetch: fetchMembers
  };
};

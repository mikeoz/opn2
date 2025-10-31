import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PendingFamilyProfile {
  id: string;
  created_by: string;
  family_unit_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  relationship_label: string;
  generation_level: number;
  member_type: 'minor' | 'adult';
  seed_data: Record<string, any>;
  invitation_token: string;
  status: 'pending' | 'claimed' | 'expired' | 'declined';
  claimed_by?: string;
  claimed_at?: string;
  sent_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSeedProfileData {
  familyUnitId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  relationshipLabel: string;
  generationLevel: number;
  memberType: 'minor' | 'adult';
  seedData?: Record<string, any>;
}

export const usePendingFamilyProfiles = (familyUnitId?: string) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PendingFamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const instanceIdRef = useRef<string>('');

  if (!instanceIdRef.current) {
    try {
      instanceIdRef.current =
        typeof crypto !== 'undefined' && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } catch {
      instanceIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  const fetchProfiles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('pending_family_profiles')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (familyUnitId) {
        query = query.eq('family_unit_id', familyUnitId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles((data as PendingFamilyProfile[]) || []);
    } catch (error: any) {
      console.error('Error fetching pending profiles:', error);
      toast.error('Failed to load pending profiles');
    } finally {
      setLoading(false);
    }
  };

  const createSeedProfile = async (profileData: CreateSeedProfileData): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      // Check if email already exists in profiles (skip for minors with placeholder emails)
      if (!profileData.email.includes('@pending.opn2.com')) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('email', profileData.email)
          .single();

        if (existingProfile) {
          toast.error('This email is already associated with an Opn2 account. Use "Invite Existing Member" instead.');
          return null;
        }
      }

      const { data, error } = await supabase
        .from('pending_family_profiles')
        .insert({
          created_by: user.id,
          family_unit_id: profileData.familyUnitId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          relationship_label: profileData.relationshipLabel,
          generation_level: profileData.generationLevel,
          member_type: profileData.memberType,
          seed_data: profileData.seedData || {}
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        profileData.memberType === 'minor' 
          ? 'Minor child profile created. You retain control until ownership transfer.'
          : 'Adult child profile created successfully.'
      );
      
      await fetchProfiles();
      return data.id;
    } catch (error: any) {
      console.error('Error creating seed profile:', error);
      toast.error('Failed to create profile');
      return null;
    }
  };

  const sendInvitation = async (profileId: string): Promise<boolean> => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) {
        toast.error('Profile not found');
        return false;
      }

      const { error } = await supabase.functions.invoke('email-profile-claim-invitation', {
        body: {
          profileId: profile.id,
          inviteeEmail: profile.email,
          inviteeName: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          familyUnitId: profile.family_unit_id,
          invitationToken: profile.invitation_token
        }
      });

      if (error) throw error;

      // Update sent_at timestamp
      await supabase
        .from('pending_family_profiles')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', profileId);

      toast.success('Invitation sent successfully');
      await fetchProfiles();
      return true;
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
      return false;
    }
  };

  const upgradeToAdult = async (profileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pending_family_profiles')
        .update({ member_type: 'adult' })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Profile upgraded to adult. You can now send an invitation.');
      await fetchProfiles();
      return true;
    } catch (error: any) {
      console.error('Error upgrading profile:', error);
      toast.error('Failed to upgrade profile');
      return false;
    }
  };

  const deleteProfile = async (profileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pending_family_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Profile deleted');
      await fetchProfiles();
      return true;
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
      return false;
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchProfiles();

    // Clean up any existing channel first
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing pending profiles channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `pending-profiles-${user.id}-${familyUnitId || 'all'}-${instanceIdRef.current}`;
    console.log('Setting up pending profiles subscription:', channelName);

    // Set up real-time subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_family_profiles',
          filter: familyUnitId ? `family_unit_id=eq.${familyUnitId}` : undefined
        },
        () => {
          console.log('Pending profiles updated, refreshing...');
          fetchProfiles();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up pending profiles subscription:', channelName);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, familyUnitId]);

  return {
    profiles,
    loading,
    createSeedProfile,
    sendInvitation,
    upgradeToAdult,
    deleteProfile,
    refetch: fetchProfiles
  };
};

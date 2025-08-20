import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyInvitation {
  id: string;
  family_unit_id: string;
  invited_by: string;
  invitee_email: string;
  invitee_name?: string;
  relationship_role: string;
  personal_message?: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  sent_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationData {
  familyUnitId: string;
  inviteeEmail: string;
  inviteeName?: string;
  relationshipRole: string;
  personalMessage?: string;
}

export const useFamilyInvitations = (familyUnitId?: string) => {
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user || !familyUnitId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('family_unit_id', familyUnitId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as FamilyInvitation[]);
    } catch (error) {
      console.error('Error fetching family invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (invitationData: CreateInvitationData): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to send invitations');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-family-invitation', {
        body: invitationData,
      });

      if (error) throw error;

      toast.success('Family invitation sent successfully!');
      
      // Refresh invitations list
      setTimeout(() => fetchInvitations(), 1000);
      
      return true;
    } catch (error: any) {
      console.error('Error sending family invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      fetchInvitations(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
      return false;
    }
  };

  const resendInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      // Get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Send the invitation again using the same data
      const success = await sendInvitation({
        familyUnitId: invitation.family_unit_id,
        inviteeEmail: invitation.invitee_email,
        inviteeName: invitation.invitee_name || undefined,
        relationshipRole: invitation.relationship_role,
        personalMessage: invitation.personal_message || undefined,
      });

      if (success) {
        // Update the sent_at timestamp for the existing invitation
        await supabase
          .from('family_invitations')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', invitationId);
      }

      return success;
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error(error.message || 'Failed to resend invitation');
      return false;
    }
  };

  // Set up real-time subscription for invitations
  useEffect(() => {
    if (!familyUnitId || !user) return;

    fetchInvitations();

    const channelName = `family-invitations-${familyUnitId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_invitations',
          filter: `family_unit_id=eq.${familyUnitId}`
        },
        () => {
          console.log('Family invitations updated, refreshing...');
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyUnitId, user?.id]);

  return {
    invitations,
    loading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    refetch: fetchInvitations,
  };
};
import { useState, useEffect, useRef } from 'react';
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

  const checkExistingInvitation = async (inviteeEmail: string, familyUnitId: string): Promise<FamilyInvitation | null> => {
    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('family_unit_id', familyUnitId)
        .eq('invitee_email', inviteeEmail)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data as FamilyInvitation || null;
    } catch (error) {
      console.error('Error checking existing invitation:', error);
      return null;
    }
  };

  const sendInvitation = async (invitationData: CreateInvitationData): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to send invitations');
      return false;
    }

    // Check for existing pending invitation
    const existingInvitation = await checkExistingInvitation(invitationData.inviteeEmail, invitationData.familyUnitId);
    if (existingInvitation) {
      toast.error(`An invitation is already pending for ${invitationData.inviteeEmail}. Please wait for them to respond or cancel the existing invitation.`);
      return false;
    }

    try {
      console.log('Creating family invitation:', invitationData);
      
      // Step 1: Insert invitation record directly (RLS handles authorization)
      const { data: invitation, error: insertError } = await supabase
        .from('family_invitations')
        .insert({
          family_unit_id: invitationData.familyUnitId,
          invited_by: user.id,
          invitee_email: invitationData.inviteeEmail,
          invitee_name: invitationData.inviteeName,
          relationship_role: invitationData.relationshipRole,
          personal_message: invitationData.personalMessage,
        })
        .select('invitation_token')
        .single();

      if (insertError) {
        console.error('Error creating invitation:', insertError);
        throw new Error(`Failed to create invitation: ${insertError.message}`);
      }

      // Step 2: Send email using public function with token
      const { error: emailError } = await supabase.functions.invoke('email-family-invitation', {
        body: { 
          invitationToken: invitation.invitation_token,
          origin: window.location.origin 
        }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail completely - invitation was created successfully
        toast.warning('Invitation created but email failed to send. You can resend it later.');
      } else {
        console.log('Family invitation email sent successfully');
        toast.success('Family invitation sent successfully!');
      }

      // Refresh invitations list
      setTimeout(() => fetchInvitations(), 1000);
      return true;
      
    } catch (error: any) {
      console.error('Error in sendInvitation:', error);
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

      // Resend email using the existing token
      const { error: emailError } = await supabase.functions.invoke('email-family-invitation', {
        body: { 
          invitationToken: invitation.invitation_token,
          origin: window.location.origin 
        }
      });

      if (emailError) {
        console.error('Error resending invitation email:', emailError);
        throw new Error('Failed to resend invitation email');
      }

      toast.success('Invitation resent successfully!');
      
      // Update the sent_at timestamp
      await supabase
        .from('family_invitations')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', invitationId);

      return true;
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

    // Clean up any existing channel first
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing family invitations channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `family-invitations-${familyUnitId}-${instanceIdRef.current}`;
    console.log('Setting up family invitations subscription:', channelName);

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

    // Store reference
    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up family invitations subscription:', channelName);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [familyUnitId, user?.id]);

  return {
    invitations,
    loading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    checkExistingInvitation,
    refetch: fetchInvitations,
  };
};
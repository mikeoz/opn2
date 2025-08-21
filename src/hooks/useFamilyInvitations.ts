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
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
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

    try {
      // Check for existing invitation
      const existingInvitation = await checkExistingInvitation(invitationData.inviteeEmail, invitationData.familyUnitId);
      
      let invitation: { invitation_token: string };
      
      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          toast.error(`An invitation is already pending for ${invitationData.inviteeEmail}. Use "Resend" or "Cancel" to manage it.`);
          return false;
        }
        
        // Reactivate cancelled/expired invitation
        console.log('Reactivating existing invitation:', existingInvitation.id);
        const { data: updatedInvitation, error: updateError } = await supabase
          .from('family_invitations')
          .update({
            status: 'pending',
            relationship_role: invitationData.relationshipRole,
            personal_message: invitationData.personalMessage,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            sent_at: null,
            accepted_at: null
          })
          .eq('id', existingInvitation.id)
          .select('invitation_token')
          .single();
        
        if (updateError) {
          console.error('Error updating invitation:', updateError);
          throw new Error(`Failed to update invitation: ${updateError.message}`);
        }
        
        invitation = updatedInvitation;
      } else {
        // Create new invitation
        console.log('Creating family invitation:', invitationData);
        const { data: newInvitation, error: insertError } = await supabase
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
        
        invitation = newInvitation;
      }

      // Step 2: Send email using public function with token (with dev fallback)
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke('email-family-invitation', {
          body: { 
            invitationToken: invitation.invitation_token,
            origin: window.location.origin 
          }
        });

        if (emailError) {
          throw emailError;
        }

        console.log('Family invitation email sent successfully');
        
        // Handle development vs production mode
        if (emailResponse?.developmentMode) {
          toast.success('✅ Invitation created! (Development mode - no real email sent)', {
            description: 'Use the invitation link shown in console to test signup.',
          });
          
          // Log invitation URL for easy access in development
          if (emailResponse.invitationUrl) {
            console.log('🔗 Invitation URL for testing:', emailResponse.invitationUrl);
          }
        } else {
          toast.success('Family invitation sent successfully!');
        }
      } catch (emailErr) {
        console.warn('Email function unreachable, using dev fallback:', emailErr);
        const invitationUrl = `${window.location.origin}/register?invitation=${invitation.invitation_token}`;
        // Try to mark as sent for consistency
        try {
          await supabase
            .from('family_invitations')
            .update({ sent_at: new Date().toISOString() })
            .eq('invitation_token', invitation.invitation_token);
        } catch (e) {
          console.warn('Failed to update sent_at in fallback:', e);
        }
        toast.success('✅ Invitation created! (Dev fallback - no email sent)', {
          description: 'Open the invite link from console to proceed with signup.'
        });
        console.log('🔗 Invitation URL for testing:', invitationUrl);
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

      // Resend email using the existing token (with dev fallback)
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke('email-family-invitation', {
          body: { 
            invitationToken: invitation.invitation_token,
            origin: window.location.origin 
          }
        });

        if (emailError) {
          throw new Error('Failed to resend invitation email');
        }

        // Handle development vs production mode
        if (emailResponse?.developmentMode) {
          toast.success('✅ Invitation resent! (Development mode)', {
            description: 'Use the invitation link shown in console to test.',
          });
          
          // Log invitation URL for easy access in development
          if (emailResponse.invitationUrl) {
            console.log('🔗 Invitation URL for testing:', emailResponse.invitationUrl);
          }
        } else {
          toast.success('Invitation resent successfully!');
        }
      } catch (emailErr) {
        console.warn('Email function unreachable, using dev fallback:', emailErr);
        const invitationUrl = `${window.location.origin}/register?invitation=${invitation.invitation_token}`;
        try {
          await supabase
            .from('family_invitations')
            .update({ sent_at: new Date().toISOString() })
            .eq('invitation_token', invitation.invitation_token);
        } catch (e) {
          console.warn('Failed to update sent_at in fallback:', e);
        }
        toast.success('✅ Invitation resent! (Dev fallback - no email sent)', {
          description: 'Open the invite link from console to proceed.'
        });
        console.log('🔗 Invitation URL for testing:', invitationUrl);
      }

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
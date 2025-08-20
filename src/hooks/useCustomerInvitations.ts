import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomerInvitation {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired';
  invitation_data: Record<string, any>;
  invitation_token?: string;
  sent_at?: string;
  accepted_at?: string;
  expires_at?: string;
  created_at: string;
  bulk_import_job_id: string;
}

export interface InvitationStats {
  total: number;
  sent: number;
  accepted: number;
  expired: number;
  pending: number;
  conversionRate: number;
}

export const useCustomerInvitations = () => {
  const [invitations, setInvitations] = useState<CustomerInvitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    sent: 0,
    accepted: 0,
    expired: 0,
    pending: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invitationData = (data || []) as CustomerInvitation[];
      setInvitations(invitationData);
      
      // Calculate stats
      const total = invitationData.length;
      const sent = invitationData.filter(inv => inv.status === 'sent').length;
      const accepted = invitationData.filter(inv => inv.status === 'accepted').length;
      const expired = invitationData.filter(inv => inv.status === 'expired').length;
      const pending = invitationData.filter(inv => inv.status === 'pending').length;
      const conversionRate = sent > 0 ? (accepted / sent) * 100 : 0;

      setStats({
        total,
        sent,
        accepted,
        expired,
        pending,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (invitationData: {
    recipientEmail: string;
    recipientName?: string;
    merchantName: string;
    customMessage?: string;
    invitationType: 'customer_onboarding' | 'card_share' | 'loyalty_program';
    additionalData?: Record<string, any>;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-customer-invitation', {
        body: invitationData
      });

      if (error) throw error;

      toast.success('Invitation sent successfully!');
      await fetchInvitations(); // Refresh the list
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const { error } = await supabase.functions.invoke('send-customer-invitation', {
        body: {
          recipientEmail: invitation.recipient_email,
          recipientName: invitation.recipient_name,
          merchantName: invitation.invitation_data.merchantName,
          customMessage: invitation.invitation_data.customMessage,
          invitationType: invitation.invitation_data.type,
          additionalData: invitation.invitation_data
        }
      });

      if (error) throw error;

      toast.success('Invitation resent successfully!');
      await fetchInvitations();
      return true;
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation: ' + error.message);
      return false;
    }
  };

  const markInvitationAsAccepted = async (invitationToken: string) => {
    try {
      const { error } = await supabase
        .from('card_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('invitation_token', invitationToken);

      if (error) throw error;

      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error marking invitation as accepted:', error);
      return false;
    }
  };

  const getInvitationByToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('card_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (error) throw error;
      return data as CustomerInvitation;
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  return {
    invitations,
    stats,
    loading,
    sendInvitation,
    resendInvitation,
    markInvitationAsAccepted,
    getInvitationByToken,
    refetch: fetchInvitations
  };
};
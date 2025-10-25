import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyOwnershipTransfer {
  id: string;
  family_unit_id: string;
  current_owner: string;
  proposed_owner_email: string;
  proposed_owner_id?: string;
  transfer_token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  sent_at?: string;
  responded_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InitiateTransferData {
  familyUnitId: string;
  proposedOwnerEmail: string;
  message?: string;
}

export const useFamilyOwnershipTransfers = (familyUnitId?: string) => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<FamilyOwnershipTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('family_ownership_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (familyUnitId) {
        query = query.eq('family_unit_id', familyUnitId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransfers((data as FamilyOwnershipTransfer[]) || []);
    } catch (error: any) {
      console.error('Error fetching ownership transfers:', error);
      toast.error('Failed to load ownership transfers');
    } finally {
      setLoading(false);
    }
  };

  const initiateTransfer = async (transferData: InitiateTransferData): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    try {
      // Check if proposed owner exists
      const { data: proposedOwner } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', transferData.proposedOwnerEmail)
        .single();

      const { error } = await supabase
        .from('family_ownership_transfers')
        .insert({
          family_unit_id: transferData.familyUnitId,
          current_owner: user.id,
          proposed_owner_email: transferData.proposedOwnerEmail,
          proposed_owner_id: proposedOwner?.id,
          message: transferData.message,
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('transfer-family-ownership', {
        body: {
          familyUnitId: transferData.familyUnitId,
          proposedOwnerEmail: transferData.proposedOwnerEmail,
          message: transferData.message
        }
      });

      if (emailError) {
        console.error('Error sending transfer email:', emailError);
        toast.warning('Transfer created but email notification failed');
      } else {
        toast.success('Ownership transfer request sent');
      }

      await fetchTransfers();
      return true;
    } catch (error: any) {
      console.error('Error initiating transfer:', error);
      toast.error('Failed to initiate transfer');
      return false;
    }
  };

  const respondToTransfer = async (
    transferId: string, 
    response: 'accepted' | 'declined'
  ): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    try {
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) {
        toast.error('Transfer not found');
        return false;
      }

      // Update transfer status
      const { error: updateError } = await supabase
        .from('family_ownership_transfers')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (updateError) throw updateError;

      // If accepted, update family unit ownership
      if (response === 'accepted') {
        const { error: ownershipError } = await supabase
          .from('family_units')
          .update({ trust_anchor_user_id: user.id })
          .eq('id', transfer.family_unit_id);

        if (ownershipError) throw ownershipError;

        toast.success('You are now the owner of this family unit');
      } else {
        toast.success('Transfer declined');
      }

      await fetchTransfers();
      return true;
    } catch (error: any) {
      console.error('Error responding to transfer:', error);
      toast.error('Failed to respond to transfer');
      return false;
    }
  };

  const cancelTransfer = async (transferId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_ownership_transfers')
        .update({ status: 'expired' })
        .eq('id', transferId);

      if (error) throw error;

      toast.success('Transfer cancelled');
      await fetchTransfers();
      return true;
    } catch (error: any) {
      console.error('Error cancelling transfer:', error);
      toast.error('Failed to cancel transfer');
      return false;
    }
  };

  useEffect(() => {
    fetchTransfers();

    // Set up real-time subscription
    const channel = supabase
      .channel('ownership_transfers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_ownership_transfers',
          filter: familyUnitId ? `family_unit_id=eq.${familyUnitId}` : undefined
        },
        () => {
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, familyUnitId]);

  return {
    transfers,
    loading,
    initiateTransfer,
    respondToTransfer,
    cancelTransfer,
    refetch: fetchTransfers
  };
};

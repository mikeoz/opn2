import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RelationshipCard {
  id: string;
  card_id: string;
  from_user_id: string;
  to_user_id?: string;
  to_user_email?: string;
  relationship_label_from: string;
  relationship_label_to: string;
  status: 'invited' | 'accepted' | 'modified' | 'rejected' | 'terminated';
  confidence?: {
    indicator_type: 'self' | 'third_party' | 'hybrid';
    verified_by?: string;
    timestamp?: string;
  };
  network_rules?: string;
  shared_attributes?: string[];
  metadata: Record<string, any>;
  invitation_token?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  modified_at?: string;
  reciprocal_card_id?: string;
  from_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  to_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface CreateRelationshipInvitation {
  to_user_email: string;
  relationship_label_from: string;
  relationship_label_to: string;
  metadata?: Record<string, any>;
  shared_attributes?: string[];
  network_rules?: string;
}

export const useRelationshipCards = () => {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('relationship_cards')
        .select(`
          *,
          from_profile:profiles!relationship_cards_from_user_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          to_profile:profiles!relationship_cards_to_user_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRelationships((data || []) as any as RelationshipCard[]);
    } catch (error: any) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (invitation: CreateRelationshipInvitation): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if relationship already exists
      const { data: existing } = await supabase
        .from('relationship_cards')
        .select('id')
        .eq('from_user_id', user.id)
        .eq('to_user_email', invitation.to_user_email)
        .in('status', ['invited', 'accepted', 'modified'])
        .single();

      if (existing) {
        toast.error('An active relationship with this person already exists');
        return false;
      }

      const { data, error } = await supabase
        .from('relationship_cards')
        .insert({
          from_user_id: user.id,
          to_user_email: invitation.to_user_email,
          relationship_label_from: invitation.relationship_label_from,
          relationship_label_to: invitation.relationship_label_to,
          metadata: invitation.metadata || {},
          shared_attributes: invitation.shared_attributes || [],
          network_rules: invitation.network_rules,
          status: 'invited',
          confidence: {
            indicator_type: 'self',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      await supabase.functions.invoke('send-relationship-invitation', {
        body: { 
          relationshipCardId: data.id,
          toEmail: invitation.to_user_email,
          fromUserId: user.id
        }
      });

      toast.success('Relationship invitation sent!');
      fetchRelationships();
      return true;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to send invitation');
      return false;
    }
  };

  const respondToInvitation = async (
    cardId: string,
    response: 'accepted' | 'rejected',
    modifiedLabelTo?: string
  ): Promise<boolean> => {
    try {
      if (response === 'rejected') {
        const { error } = await supabase
          .from('relationship_cards')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', cardId);

        if (error) throw error;
        toast.success('Invitation declined');
      } else {
        // Use the database function to accept invitation
        const card = relationships.find(r => r.id === cardId);
        if (!card?.invitation_token) {
          toast.error('Invalid invitation');
          return false;
        }

        const { error } = await supabase.rpc('accept_relationship_invitation', {
          p_invitation_token: card.invitation_token,
          p_modified_label_to: modifiedLabelTo || null
        });

        if (error) throw error;
        toast.success(modifiedLabelTo ? 'Invitation accepted with modifications' : 'Invitation accepted!');
      }

      fetchRelationships();
      return true;
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
      return false;
    }
  };

  const terminateRelationship = async (cardId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('relationship_cards')
        .update({ 
          status: 'terminated',
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (error) throw error;

      toast.success('Relationship terminated');
      fetchRelationships();
      return true;
    } catch (error: any) {
      console.error('Error terminating relationship:', error);
      toast.error('Failed to terminate relationship');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchRelationships();

      // Set up real-time subscription
      const channel = supabase
        .channel('relationship_cards_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'relationship_cards',
            filter: `from_user_id=eq.${user.id}`
          },
          () => {
            fetchRelationships();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'relationship_cards',
            filter: `to_user_id=eq.${user.id}`
          },
          () => {
            fetchRelationships();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    relationships,
    loading,
    createInvitation,
    respondToInvitation,
    terminateRelationship,
    refetch: fetchRelationships
  };
};

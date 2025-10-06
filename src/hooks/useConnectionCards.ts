import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SharedCard {
  id: string;
  card_code: string;
  card_type: string;
  template_name?: string;
  shared_at: string;
  relationship_type: string;
  permissions: any;
}

export interface ConnectionWithCards {
  connectionId: string;
  userId: string;
  name: string;
  avatar_url?: string;
  relationship_type: string;
  cards: SharedCard[];
  totalCards: number;
}

export const useConnectionCards = () => {
  const [connectionsWithCards, setConnectionsWithCards] = useState<ConnectionWithCards[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchConnectionCards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all card relationships where current user shared cards
      const { data: relationships, error } = await supabase
        .from('card_relationships')
        .select(`
          id,
          card_id,
          shared_with_user_id,
          relationship_type,
          shared_at,
          permissions,
          user_cards!inner (
            id,
            card_code,
            card_type,
            card_templates (
              name
            )
          )
        `)
        .eq('created_by', user.id)
        .not('shared_with_user_id', 'is', null)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, ConnectionWithCards>();

      for (const rel of relationships || []) {
        const userId = rel.shared_with_user_id;
        
        if (!userMap.has(userId)) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', userId)
            .single();

          userMap.set(userId, {
            connectionId: rel.id,
            userId: userId,
            name: profile 
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
              : 'Unknown User',
            avatar_url: profile?.avatar_url,
            relationship_type: rel.relationship_type,
            cards: [],
            totalCards: 0
          });
        }

        const connection = userMap.get(userId)!;
        connection.cards.push({
          id: rel.card_id,
          card_code: rel.user_cards?.card_code || '',
          card_type: rel.user_cards?.card_type || '',
          template_name: rel.user_cards?.card_templates?.name,
          shared_at: rel.shared_at,
          relationship_type: rel.relationship_type,
          permissions: rel.permissions
        });
        connection.totalCards = connection.cards.length;
      }

      setConnectionsWithCards(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error fetching connection cards:', error);
      toast.error('Failed to load connections');
      setConnectionsWithCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionCards();
  }, [user]);

  return {
    connectionsWithCards,
    loading,
    refetch: fetchConnectionCards,
    hasConnections: connectionsWithCards.length > 0
  };
};

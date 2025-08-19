import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ActivityItem {
  id: string;
  action: string;
  time: string;
  type: 'share' | 'receive' | 'create' | 'update' | 'connect' | 'scan';
  details?: Record<string, any>;
  created_at: string;
}

export const useRecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query relationship_interactions for recent activity
      const { data: interactions, error } = await supabase
        .from('relationship_interactions')
        .select(`
          id,
          interaction_type,
          interaction_data,
          created_at,
          created_by
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform interaction data to activity format
      const activityData: ActivityItem[] = (interactions || []).map(interaction => ({
        id: interaction.id,
        action: formatActivityAction(interaction.interaction_type, interaction.interaction_data),
        time: formatTimeAgo(interaction.created_at),
        type: mapInteractionToActivityType(interaction.interaction_type),
        details: (interaction.interaction_data as Record<string, any>) || {},
        created_at: interaction.created_at
      }));

      setActivities(activityData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load recent activity');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityAction = (type: string, data: any): string => {
    switch (type) {
      case 'card_shared':
        return `Contact Card shared with ${data?.recipient || 'someone'}`;
      case 'card_received':
        return `New participant card received from ${data?.sender || 'someone'}`;
      case 'card_created':
        return `${data?.card_type || 'Card'} created`;
      case 'card_updated':
        return `Updated ${data?.card_type || 'card'} information`;
      case 'location_checkin':
        return `Connected at ${data?.location || 'location'}`;
      case 'qr_scan':
        return `Scanned QR code at ${data?.merchant || 'merchant'}`;
      default:
        return `${type.replace('_', ' ')} activity`;
    }
  };

  const mapInteractionToActivityType = (interactionType: string): ActivityItem['type'] => {
    switch (interactionType) {
      case 'card_shared': return 'share';
      case 'card_received': return 'receive';
      case 'card_created': return 'create';
      case 'card_updated': return 'update';
      case 'location_checkin': return 'connect';
      case 'qr_scan': return 'scan';
      default: return 'update';
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
    hasActivity: activities.length > 0
  };
};
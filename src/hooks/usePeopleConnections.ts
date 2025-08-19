import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PersonConnection {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  lastInteraction: string;
  relationship_type: string;
  avatar_url?: string;
  connection_strength: 'strong' | 'medium' | 'weak';
}

export const usePeopleConnections = () => {
  const [connections, setConnections] = useState<PersonConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query card_relationships to find people user has shared cards with
      const { data: relationships, error } = await supabase
        .from('card_relationships')
        .select(`
          id,
          shared_with_user_id,
          relationship_type,
          shared_at,
          permissions
        `)
        .eq('created_by', user.id)
        .not('shared_with_user_id', 'is', null);

      if (error) throw error;

      // Get profile information for connected users
      const userIds = relationships?.map(r => r.shared_with_user_id).filter(Boolean) || [];
      
      if (userIds.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Transform to PersonConnection format
      const connectionData: PersonConnection[] = (relationships || []).map(rel => {
        const profile = profiles?.find(p => p.id === rel.shared_with_user_id);
        return {
          id: rel.id,
          name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
          status: 'offline' as const, // Default status, could be enhanced with real presence
          lastInteraction: formatTimeAgo(rel.shared_at),
          relationship_type: rel.relationship_type || 'connection',
          avatar_url: profile?.avatar_url,
          connection_strength: determineConnectionStrength(rel.permissions, rel.shared_at)
        };
      });

      setConnections(connectionData);
    } catch (error) {
      console.error('Error fetching people connections:', error);
      toast.error('Failed to load people connections');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const determineConnectionStrength = (permissions: any, sharedAt: string): PersonConnection['connection_strength'] => {
    const daysSinceConnection = Math.floor((Date.now() - new Date(sharedAt).getTime()) / (1000 * 60 * 60 * 24));
    const permissionCount = Object.keys(permissions || {}).length;

    if (daysSinceConnection < 7 && permissionCount > 2) return 'strong';
    if (daysSinceConnection < 30 || permissionCount > 1) return 'medium';
    return 'weak';
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
    fetchConnections();
  }, [user]);

  return {
    connections,
    loading,
    refetch: fetchConnections,
    hasConnections: connections.length > 0
  };
};
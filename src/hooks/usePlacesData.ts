import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlaceData {
  id: string;
  name: string;
  type: 'business' | 'public' | 'office' | 'social';
  visits: string;
  lastVisit: string;
  provider_id?: string;
  location_data?: Record<string, any>;
  visit_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
}

export const usePlacesData = () => {
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPlaces = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query user_provider_relationships to find places user interacts with
      const { data: relationships, error } = await supabase
        .from('user_provider_relationships')
        .select(`
          id,
          provider_id,
          relationship_type,
          created_at,
          access_permissions
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!relationships || relationships.length === 0) {
        setPlaces([]);
        setLoading(false);
        return;
      }

      // Get provider information for places
      const providerIds = relationships.map(r => r.provider_id);
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('id, name, provider_type, contact_info')
        .in('id', providerIds);

      if (providersError) throw providersError;

      // Transform to PlaceData format
      const placesData: PlaceData[] = relationships.map(rel => {
        const provider = providers?.find(p => p.id === rel.provider_id);
        return {
          id: rel.id,
          name: provider?.name || 'Unknown Location',
          type: mapProviderTypeToPlaceType(provider?.provider_type),
          visits: calculateVisitFrequency(rel.created_at),
          lastVisit: formatTimeAgo(rel.created_at),
          provider_id: rel.provider_id,
          location_data: (provider?.contact_info as Record<string, any>) || {},
          visit_frequency: determineVisitFrequency(rel.created_at, rel.access_permissions)
        };
      });

      setPlaces(placesData);
    } catch (error) {
      console.error('Error fetching places data:', error);
      toast.error('Failed to load places data');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const mapProviderTypeToPlaceType = (providerType?: string): PlaceData['type'] => {
    switch (providerType) {
      case 'business': return 'business';
      case 'office': return 'office';
      case 'social': return 'social';
      default: return 'public';
    }
  };

  const calculateVisitFrequency = (firstVisit: string): string => {
    const daysSinceFirst = Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceFirst < 7) return 'New';
    if (daysSinceFirst < 30) return 'Recent';
    return 'Established';
  };

  const determineVisitFrequency = (createdAt: string, permissions: any): PlaceData['visit_frequency'] => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const permissionLevel = Object.keys(permissions || {}).length;

    if (permissionLevel > 3 && daysSinceCreated < 7) return 'daily';
    if (permissionLevel > 2 || daysSinceCreated < 30) return 'weekly';
    if (daysSinceCreated < 90) return 'monthly';
    return 'rarely';
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
    fetchPlaces();
  }, [user]);

  return {
    places,
    loading,
    refetch: fetchPlaces,
    hasPlaces: places.length > 0
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomerData {
  id: string;
  user_id: string;
  relationship_type: string;
  status: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  last_interaction?: string;
  interaction_count?: number;
}

export const useMerchantCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCustomers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get the user's provider/merchant ID
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerError || !provider) {
        setCustomers([]);
        return;
      }

      // Get customer relationships for this merchant
      const { data: relationships, error } = await supabase
        .from('user_provider_relationships')
        .select(`
          id,
          user_id,
          relationship_type,
          status,
          created_at
        `)
        .eq('provider_id', provider.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!relationships || relationships.length === 0) {
        setCustomers([]);
        return;
      }

      // Get profile information for each customer
      const userIds = relationships.map(rel => rel.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      // Get interaction counts and last interaction for each customer
      const { data: interactions } = await supabase
        .from('relationship_interactions')
        .select('relationship_id, created_at')
        .in('relationship_id', relationships.map(rel => rel.id))
        .order('created_at', { ascending: false });

      // Combine the data
      const customerData: CustomerData[] = relationships.map(rel => {
        const profile = profiles?.find(p => p.id === rel.user_id);
        const customerInteractions = interactions?.filter(int => int.relationship_id === rel.id) || [];
        const lastInteraction = customerInteractions.length > 0 ? customerInteractions[0].created_at : null;

        return {
          id: rel.id,
          user_id: rel.user_id,
          relationship_type: rel.relationship_type,
          status: rel.status,
          created_at: rel.created_at,
          profile,
          last_interaction: lastInteraction,
          interaction_count: customerInteractions.length
        };
      });

      setCustomers(customerData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
      setCustomers([]);
    } finally {
      setLoading(false);
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
    fetchCustomers();
  }, [user]);

  return {
    customers,
    loading,
    refetch: fetchCustomers,
    totalCustomers: customers.length,
    recentCustomers: customers.slice(0, 5),
    formatTimeAgo
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyConnection {
  id: string;
  parent_family_unit_id: string;
  child_family_unit_id: string;
  connection_type: 'hierarchical' | 'sibling' | 'extended';
  initiated_by: string;
  approved_by?: string;
  invitation_token: string;
  personal_message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  connection_direction: 'invitation' | 'request';
  expires_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  parent_family?: {
    family_label: string;
    trust_anchor_user_id: string;
  };
  child_family?: {
    family_label: string;
    trust_anchor_user_id: string;
  };
  initiated_profile?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface CreateConnectionData {
  targetFamilyUnitId: string;
  connectionDirection: 'invitation' | 'request';
  connectionType?: string;
  personalMessage?: string;
}

export interface FamilyTreeData {
  currentUnit: any;
  parentConnection?: FamilyConnection;
  childConnections: FamilyConnection[];
  pendingConnections: FamilyConnection[];
}

export const useFamilyConnections = (familyUnitId?: string) => {
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [familyTreeData, setFamilyTreeData] = useState<FamilyTreeData | null>(null);
  const { user } = useAuth();

  const fetchConnections = async () => {
    if (!user || !familyUnitId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_unit_connections')
        .select(`
          *,
          parent_family:family_units!parent_family_unit_id(family_label, trust_anchor_user_id),
          child_family:family_units!child_family_unit_id(family_label, trust_anchor_user_id),
          initiated_profile:profiles!initiated_by(first_name, last_name)
        `)
        .or(`parent_family_unit_id.eq.${familyUnitId},child_family_unit_id.eq.${familyUnitId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data || []) as FamilyConnection[]);
      
      // Build family tree data
      buildFamilyTreeData(data || [], familyUnitId);
    } catch (error) {
      console.error('Error fetching family connections:', error);
      toast.error('Failed to load family connections');
    } finally {
      setLoading(false);
    }
  };

  const buildFamilyTreeData = async (connectionsData: any[], currentFamilyUnitId: string) => {
    try {
      // Get current family unit details
      const { data: currentUnit, error: unitError } = await supabase
        .from('family_units')
        .select('*')
        .eq('id', currentFamilyUnitId)
        .single();

      if (unitError) throw unitError;

      // Find parent connection (where this unit is the child)
      const parentConnection = connectionsData.find(
        conn => conn.child_family_unit_id === currentFamilyUnitId && conn.status === 'approved'
      );

      // Find child connections (where this unit is the parent)
      const childConnections = connectionsData.filter(
        conn => conn.parent_family_unit_id === currentFamilyUnitId && conn.status === 'approved'
      );

      // Find pending connections
      const pendingConnections = connectionsData.filter(
        conn => (conn.parent_family_unit_id === currentFamilyUnitId || conn.child_family_unit_id === currentFamilyUnitId) 
               && conn.status === 'pending'
      );

      setFamilyTreeData({
        currentUnit,
        parentConnection,
        childConnections,
        pendingConnections,
      });
    } catch (error) {
      console.error('Error building family tree data:', error);
    }
  };

  const sendConnection = async (connectionData: CreateConnectionData): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to create connections');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-family-connection', {
        body: connectionData,
      });

      if (error) throw error;

      const actionType = connectionData.connectionDirection === 'invitation' ? 'invitation' : 'request';
      toast.success(`Family connection ${actionType} sent successfully!`);
      
      // Refresh connections list
      setTimeout(() => fetchConnections(), 1000);
      
      return true;
    } catch (error: any) {
      console.error('Error sending family connection:', error);
      toast.error(error.message || 'Failed to send connection');
      return false;
    }
  };

  const respondToConnection = async (
    connectionId: string, 
    response: 'approved' | 'rejected'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_unit_connections')
        .update({ 
          status: response,
          approved_by: user?.id,
          approved_at: response === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success(`Connection ${response} successfully`);
      fetchConnections(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error responding to connection:', error);
      toast.error('Failed to respond to connection');
      return false;
    }
  };

  const cancelConnection = async (connectionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_unit_connections')
        .update({ status: 'cancelled' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connection cancelled');
      fetchConnections(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error cancelling connection:', error);
      toast.error('Failed to cancel connection');
      return false;
    }
  };

  const searchFamilyUnits = async (searchTerm: string): Promise<any[]> => {
    if (!searchTerm.trim() || !user) return [];
    
    try {
      const { data, error } = await supabase
        .from('family_units')
        .select(`
          id, 
          family_label, 
          trust_anchor_user_id,
          profiles!trust_anchor_user_id(first_name, last_name, email)
        `)
        .neq('trust_anchor_user_id', user.id) // Exclude current user's family
        .ilike('family_label', `%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching family units:', error);
      return [];
    }
  };

  // Set up real-time subscription for connections
  useEffect(() => {
    if (!familyUnitId || !user) return;

    fetchConnections();

    const channelName = `family-connections-${familyUnitId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_unit_connections',
        },
        (payload) => {
          console.log('Family connections updated, refreshing...');
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyUnitId, user?.id]);

  return {
    connections,
    familyTreeData,
    loading,
    sendConnection,
    respondToConnection,
    cancelConnection,
    searchFamilyUnits,
    refetch: fetchConnections,
  };
};
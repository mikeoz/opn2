import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FamilyUnit {
  id: string;
  family_label: string;
  trust_anchor_user_id: string;
  parent_family_unit_id?: string;
  generation_level: number;
  family_metadata: any; // Supabase Json type
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Joined data
  trust_anchor_profile?: {
    first_name?: string;
    last_name?: string;
    birth_name?: string;
    display_preferences?: any; // Supabase Json type
  };
  parent_family?: {
    family_label: string;
    generation_level: number;
  };
  member_count?: number;
}

export interface FamilyMember {
  id: string;
  individual_user_id: string;
  relationship_label: string;
  family_generation: number;
  permissions: any; // Supabase Json type
  joined_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    birth_name?: string;
    email?: string;
  };
}

export const useFamilyUnits = () => {
  const [familyUnits, setFamilyUnits] = useState<FamilyUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  // Unique channel instance ID to avoid duplicate subscribe() on shared channels
  const channelInstanceIdRef = useRef<string>('');
  if (!channelInstanceIdRef.current) {
    try {
      channelInstanceIdRef.current =
        typeof crypto !== 'undefined' && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } catch {
      channelInstanceIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  const fetchFamilyUnits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get family units where user is trust anchor or member
      const { data: unitsData, error: unitsError } = await supabase
        .from('family_units')
        .select(`
          *
        `)
        .eq('is_active', true)
        .order('generation_level', { ascending: true });

      if (unitsError) throw unitsError;

      // Get member counts for each family unit
      const unitIds = unitsData?.map(unit => unit.trust_anchor_user_id) || [];
      const memberCountPromises = unitIds.map(async (trustAnchorId) => {
        const { count, error } = await supabase
          .from('organization_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_user_id', trustAnchorId)
          .eq('is_family_unit', true)
          .eq('status', 'active');
        
        return { trustAnchorId, count: count || 0 };
      });

      const memberCounts = await Promise.all(memberCountPromises);

      // Combine data and normalize to expected format
      const enrichedUnits = (unitsData as any)?.map((unit: any) => ({
        ...unit,
        trust_anchor_profile: null, // We'll fetch profile separately if needed
        parent_family: null, // We'll fetch parent separately if needed  
        member_count: memberCounts.find(mc => mc.trustAnchorId === unit.trust_anchor_user_id)?.count || 0
      })) || [];

      setFamilyUnits(enrichedUnits as FamilyUnit[]);
    } catch (error) {
      console.error('Error fetching family units:', error);
      toast.error('Failed to load family units');
    } finally {
      setLoading(false);
    }
  };

  const createFamilyUnit = async (
    familyLabel: string,
    parentFamilyUnitId?: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('family_units')
        .insert({
          family_label: familyLabel,
          trust_anchor_user_id: user.id,
          parent_family_unit_id: parentFamilyUnitId,
          family_metadata: metadata
        })
        .select('*')
        .single();

      if (error) throw error;
      
      toast.success('Family unit created successfully');
      
      // Fallback: if real-time doesn't work, manually add the unit after a short delay
      setTimeout(() => {
        setFamilyUnits(prev => {
          // Check if already exists (real-time might have worked)
          if (prev.some(unit => unit.id === data.id)) {
            console.log('Unit already added by real-time, skipping fallback');
            return prev;
          }
          console.log('Real-time failed, adding unit via fallback');
          return [...prev, {
            ...data,
            trust_anchor_profile: null,
            parent_family: null,
            member_count: 0
          }];
        });
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error creating family unit:', error);
      toast.error('Failed to create family unit');
      return false;
    }
  };

  const updateFamilyUnit = async (
    unitId: string,
    updates: Partial<Pick<FamilyUnit, 'family_label' | 'family_metadata'>>
  ) => {
    try {
      const { error } = await supabase
        .from('family_units')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId);

      if (error) throw error;
      
      toast.success('Family unit updated');
      // No need to manually refetch - real-time will handle it
      return true;
    } catch (error) {
      console.error('Error updating family unit:', error);
      toast.error('Failed to update family unit');
      return false;
    }
  };

  const deactivateFamilyUnit = async (unitId: string) => {
    try {
      const { error } = await supabase
        .from('family_units')
        .update({ is_active: false })
        .eq('id', unitId);

      if (error) throw error;
      
      toast.success('Family unit deactivated');
      // No need to manually refetch - real-time will handle it
      return true;
    } catch (error) {
      console.error('Error deactivating family unit:', error);
      toast.error('Failed to deactivate family unit');
      return false;
    }
  };

  const fetchFamilyMembers = async (familyUnitId: string): Promise<FamilyMember[]> => {
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          individual_user_id,
          relationship_label,
          family_generation,
          permissions,
          joined_at,
          profile:profiles!individual_user_id(
            first_name,
            last_name,
            birth_name,
            email
          )
        `)
        .eq('organization_user_id', familyUnitId)
        .eq('is_family_unit', true)
        .eq('status', 'active')
        .order('family_generation', { ascending: true });

      if (error) throw error;
      return (data as FamilyMember[]) || [];
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
      return [];
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchFamilyUnits();

    // Set up real-time subscription with debugging
    const channelName = `family-units-${user.id}-${channelInstanceIdRef.current}`;
    console.log('Setting up real-time subscription:', channelName, '(per-instance)');
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_units'
        },
        (payload) => {
          console.log('🔥 Family units real-time update received:', payload);
          console.log('Event type:', payload.eventType);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            const newUnit = payload.new as any;
            console.log('Processing INSERT for unit:', newUnit.id);
            
            setFamilyUnits(prev => {
              console.log('Current family units:', prev.length);
              // Check if already exists to avoid duplicates
              if (prev.some(unit => unit.id === newUnit.id)) {
                console.log('Unit already exists, skipping');
                return prev;
              }
              const updatedUnits = [...prev, {
                ...newUnit,
                trust_anchor_profile: null,
                parent_family: null,
                member_count: 0
              }];
              console.log('Added new unit, total units:', updatedUnits.length);
              return updatedUnits;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedUnit = payload.new as any;
            console.log('Processing UPDATE for unit:', updatedUnit.id);
            
            setFamilyUnits(prev => prev.map(unit => 
              unit.id === updatedUnit.id 
                ? { ...unit, ...updatedUnit }
                : unit
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedUnit = payload.old as any;
            console.log('Processing DELETE for unit:', deletedUnit.id);
            
            setFamilyUnits(prev => prev.filter(unit => unit.id !== deletedUnit.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up realtime subscription:', channelName);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    familyUnits,
    loading,
    createFamilyUnit,
    updateFamilyUnit,
    deactivateFamilyUnit,
    fetchFamilyMembers,
    refetch: fetchFamilyUnits
  };
};
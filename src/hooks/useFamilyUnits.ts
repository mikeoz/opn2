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
  // User relationship flags
  isOwner?: boolean;
  isMember?: boolean;
  membershipDetails?: {
    relationship_label?: string;
    family_generation?: number;
    joined_at?: string;
  };
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
  const channelRef = useRef<any>(null);
  
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
    
    console.log('🔍 [FamilyUnits] Starting fetch for user:', user.id, user.email);
    
    setLoading(true);
    try {
      // Get family units where user is trust anchor or member (RLS handles this)
      const { data: unitsData, error: unitsError } = await supabase
        .from('family_units')
        .select(`
          *,
          trust_anchor_profile:profiles!trust_anchor_user_id(
            first_name,
            last_name,
            birth_name
          )
        `)
        .eq('is_active', true)
        .order('generation_level', { ascending: true });
      
      console.log('📊 [FamilyUnits] Fetched family units:', {
        count: unitsData?.length || 0,
        error: unitsError?.message,
        units: unitsData?.map(u => ({
          id: u.id,
          label: (u as any).family_label,
          trustAnchor: (u as any).trust_anchor_user_id,
          isCurrentUserTrustAnchor: (u as any).trust_anchor_user_id === user.id
        }))
      });

      if (unitsError) throw unitsError;

      // Get member counts and user's membership details for each family unit
      const unitIds = unitsData?.map(unit => unit.trust_anchor_user_id) || [];
      
      const enrichmentPromises = unitIds.map(async (trustAnchorId) => {
        // Get member count - count only active organization_memberships
        // This excludes the trust anchor themselves and only counts members
        const { count, error: countError } = await supabase
          .from('organization_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_user_id', trustAnchorId)
          .eq('is_family_unit', true)
          .eq('status', 'active');
        
        console.log(`📊 [FamilyUnits] Member count for family ${trustAnchorId}:`, { 
          count, 
          countError: countError?.message,
          query: `organization_user_id=${trustAnchorId}, is_family_unit=true, status=active`
        });
        
        // Check if current user is a member of this family (but NOT the trust anchor)
        const isCurrentUserTrustAnchor = trustAnchorId === user.id;
        
        console.log(`🔍 [FamilyUnits] Checking membership for family ${trustAnchorId}:`, {
          trustAnchorId,
          currentUserId: user.id,
          isCurrentUserTrustAnchor,
          willQueryMembership: true
        });
        
        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('relationship_label, family_generation, joined_at')
          .eq('organization_user_id', trustAnchorId)
          .eq('individual_user_id', user.id)
          .eq('is_family_unit', true)
          .eq('status', 'active')
          .maybeSingle();
        
        console.log(`📊 [FamilyUnits] Membership query result for ${trustAnchorId}:`, {
          hasMembership: !!membershipData,
          membershipData,
          error: membershipError?.message,
          errorCode: membershipError?.code,
          query: `organization_user_id=${trustAnchorId}, individual_user_id=${user.id}, is_family_unit=true, status=active`
        });
        
        return { 
          trustAnchorId, 
          count: (count || 0) + 1, // Add 1 to include the trust anchor in the total member count
          membership: membershipData
        };
      });

      const enrichmentData = await Promise.all(enrichmentPromises);

      // Combine data and normalize to expected format
      const enrichedUnits = (unitsData as any)?.map((unit: any) => {
        const enrichment = enrichmentData.find(e => e.trustAnchorId === unit.trust_anchor_user_id);
        const isOwner = unit.trust_anchor_user_id === user.id;
        const isMember = !!enrichment?.membership;
        
        const enrichedUnit = {
          ...unit,
          member_count: enrichment?.count || 0,
          isOwner,
          isMember,
          membershipDetails: enrichment?.membership || null
        };
        
        console.log(`🏠 [FamilyUnits] Enriched unit "${unit.family_label}":`, {
          id: unit.id,
          trustAnchor: unit.trust_anchor_user_id,
          memberCount: enrichedUnit.member_count,
          isOwner: enrichedUnit.isOwner,
          isMember: enrichedUnit.isMember,
          hasMembershipData: !!enrichedUnit.membershipDetails
        });
        
        return enrichedUnit;
      }) || [];

      console.log('✅ [FamilyUnits] Final enriched units:', {
        totalCount: enrichedUnits.length,
        ownedCount: enrichedUnits.filter((u: any) => u.isOwner).length,
        memberCount: enrichedUnits.filter((u: any) => u.isMember && !u.isOwner).length,
        units: enrichedUnits.map((u: any) => ({
          label: u.family_label,
          isOwner: u.isOwner,
          isMember: u.isMember
        }))
      });

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
      
      // Notify other hook instances to refetch
      try {
        window.dispatchEvent(new CustomEvent('family-units:refetch'));
      } catch (e) {
        console.warn('Dispatch refetch event failed:', e);
      }
      
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
            member_count: 0,
            isOwner: true, // User just created it
            isMember: false,
            membershipDetails: null
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
      // Notify listeners to refetch in case realtime misses
      try {
        window.dispatchEvent(new CustomEvent('family-units:refetch'));
      } catch {}
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
      try {
        window.dispatchEvent(new CustomEvent('family-units:refetch'));
      } catch {}
      // No need to manually refetch - real-time will handle it
      return true;
    } catch (error) {
      console.error('Error deactivating family unit:', error);
      toast.error('Failed to deactivate family unit');
      return false;
    }
  };

  const fetchFamilyMembers = async (trustAnchorUserId: string): Promise<FamilyMember[]> => {
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
        .eq('organization_user_id', trustAnchorUserId)
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

    // Listen for manual refetch events from other components
    const onRefetch = () => {
      console.log('🔄 family-units:refetch event received');
      fetchFamilyUnits();
    };
    
    // Listen for family membership updates (from invitation acceptance)
    const onMembershipUpdate = () => {
      console.log('🔄 family-membership-updated event received');
      fetchFamilyUnits();
    };
    
    try {
      window.addEventListener('family-units:refetch', onRefetch);
      window.addEventListener('family-membership-updated', onMembershipUpdate);
    } catch (e) {
      console.warn('Failed to add refetch listener', e);
    }

    // Clean up any existing channel first
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing channel before creating new one');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

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
              
              // Determine if user is owner or member
              const isOwner = newUnit.trust_anchor_user_id === user.id;
              
              const updatedUnits = [...prev, {
                ...newUnit,
                trust_anchor_profile: null,
                parent_family: null,
                member_count: 0,
                isOwner,
                isMember: false, // Will be updated by refetch if needed
                membershipDetails: null
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_memberships',
          filter: `individual_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔥 Membership change detected (as member):', payload.eventType);
          // Refetch to get updated membership details and family units
          fetchFamilyUnits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_memberships',
          filter: `organization_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔥 Membership change detected (as owner):', payload.eventType);
          // Someone joined or left a family you own, refetch to update counts
          fetchFamilyUnits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_invitations',
          filter: `invitee_email=eq.${user.email}`
        },
        (payload) => {
          console.log('🔥 Invitation status changed:', payload);
          const newStatus = (payload.new as any)?.status;
          if (newStatus === 'accepted') {
            // Invitation was accepted, refetch family units
            console.log('Invitation accepted, refetching family units...');
            fetchFamilyUnits();
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Store the channel reference
    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up realtime subscription:', channelName);
      try {
        window.removeEventListener('family-units:refetch', onRefetch);
        window.removeEventListener('family-membership-updated', onMembershipUpdate);
      } catch {}
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
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
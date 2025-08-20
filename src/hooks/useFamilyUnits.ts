import { useState, useEffect } from 'react';
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

  const fetchFamilyUnits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get family units where user is trust anchor or member
      const { data: unitsData, error: unitsError } = await supabase
        .from('family_units')
        .select(`
          *,
          trust_anchor_profile:profiles!trust_anchor_user_id(
            first_name,
            last_name,
            birth_name,
            display_preferences
          ),
          parent_family:family_units!parent_family_unit_id(
            family_label,
            generation_level
          )
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

      // Combine data
      const enrichedUnits = unitsData?.map(unit => ({
        ...unit,
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
      const { error } = await supabase
        .from('family_units')
        .insert({
          family_label: familyLabel,
          trust_anchor_user_id: user.id,
          parent_family_unit_id: parentFamilyUnitId,
          family_metadata: metadata
        });

      if (error) throw error;
      
      toast.success('Family unit created successfully');
      await fetchFamilyUnits();
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
      await fetchFamilyUnits();
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
      await fetchFamilyUnits();
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
    fetchFamilyUnits();
  }, [user]);

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
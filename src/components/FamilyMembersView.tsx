import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, UserPlus } from 'lucide-react';
import { FamilyUnit, FamilyMember, useFamilyUnits } from '@/hooks/useFamilyUnits';

interface FamilyMembersViewProps {
  familyUnits: FamilyUnit[];
}

export const FamilyMembersView: React.FC<FamilyMembersViewProps> = ({
  familyUnits
}) => {
  const [allMembers, setAllMembers] = useState<(FamilyMember & { familyUnit: FamilyUnit })[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<(FamilyMember & { familyUnit: FamilyUnit })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { fetchFamilyMembers } = useFamilyUnits();

  useEffect(() => {
    let isMounted = true;
    const loadAllMembers = async () => {
      console.log('[AllMembers] Loading members for', familyUnits.length, 'family units');
      setLoading(true);
      const timeout = setTimeout(() => {
        if (isMounted) {
          console.warn('[AllMembers] Load timed out - showing partial/no results');
          setLoading(false);
        }
      }, 10000);
      try {
        const memberPromises = familyUnits.map(async (unit) => {
          try {
            const members = await fetchFamilyMembers(unit.id);
            console.log('[AllMembers] Loaded', members.length, 'members for unit', unit.id);
            return members.map(member => ({ ...member, familyUnit: unit }));
          } catch (e) {
            console.error('[AllMembers] Error loading unit members', unit.id, e);
            return [] as (FamilyMember & { familyUnit: FamilyUnit })[];
          }
        });

        const memberArrays = await Promise.all(memberPromises);
        const flatMembers = memberArrays.flat();
        
        if (!isMounted) return;
        setAllMembers(flatMembers);
        setFilteredMembers(flatMembers);
        console.log('[AllMembers] Total members loaded:', flatMembers.length);
      } catch (error) {
        console.error('Error loading all members:', error);
      } finally {
        clearTimeout(timeout);
        if (isMounted) setLoading(false);
      }
    };

    if (familyUnits.length > 0) {
      loadAllMembers();
    } else {
      setAllMembers([]);
      setFilteredMembers([]);
    }

    return () => { isMounted = false; };
  }, [familyUnits, fetchFamilyMembers]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(allMembers);
      return;
    }

    const filtered = allMembers.filter(member => {
      const profile = member.profile;
      const searchLower = searchTerm.toLowerCase();
      
      return (
        profile?.first_name?.toLowerCase().includes(searchLower) ||
        profile?.last_name?.toLowerCase().includes(searchLower) ||
        profile?.birth_name?.toLowerCase().includes(searchLower) ||
        profile?.email?.toLowerCase().includes(searchLower) ||
        member.relationship_label?.toLowerCase().includes(searchLower) ||
        member.familyUnit.family_label.toLowerCase().includes(searchLower)
      );
    });

    setFilteredMembers(filtered);
  }, [searchTerm, allMembers]);

  const getDisplayName = (member: FamilyMember) => {
    const profile = member.profile;
    if (!profile) return 'Unknown';
    
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (profile.birth_name && profile.birth_name !== profile.last_name) {
      return `${profile.first_name} (${profile.birth_name}) ${profile.last_name}`;
    }
    return name || 'Unknown';
  };

  const groupedMembers = filteredMembers.reduce((acc, member) => {
    const unitId = member.familyUnit.id;
    if (!acc[unitId]) {
      acc[unitId] = {
        familyUnit: member.familyUnit,
        members: []
      };
    }
    acc[unitId].members.push(member);
    return acc;
  }, {} as Record<string, { familyUnit: FamilyUnit; members: FamilyMember[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredMembers.length} member(s)
        </Badge>
      </div>

      {Object.keys(groupedMembers).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Family Members Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No members match your search criteria.' : 'Add members to your family units to see them here.'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedMembers).map(({ familyUnit, members }) => (
            <Card key={familyUnit.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {familyUnit.family_label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Gen {familyUnit.generation_level}</Badge>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{getDisplayName(member)}</h4>
                        <Badge variant="outline" className="text-xs">
                          {member.relationship_label}
                        </Badge>
                      </div>
                      
                      {member.profile?.email && (
                        <p className="text-sm text-muted-foreground">
                          {member.profile.email}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { FamilyUnit, FamilyMember, useFamilyUnits } from '@/hooks/useFamilyUnits';

interface FamilyMembersViewProps {
  familyUnits: FamilyUnit[];
}

export const FamilyMembersView: React.FC<FamilyMembersViewProps> = ({
  familyUnits
}) => {
  const [allMembers, setAllMembers] = useState<(FamilyMember & { familyUnit: FamilyUnit })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const { fetchFamilyMembers } = useFamilyUnits();
  const ITEMS_PER_PAGE = 20;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        const memberPromises = familyUnits.slice(0, 10).map(async (unit) => { // Limit to 10 units for performance
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
    }

    return () => { isMounted = false; };
  }, [familyUnits, fetchFamilyMembers]);

  // Filter and paginate members
  const filteredMembers = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return allMembers;

    const searchLower = debouncedSearchTerm.toLowerCase();
    return allMembers.filter(member => {
      const profile = member.profile;
      return (
        profile?.first_name?.toLowerCase().includes(searchLower) ||
        profile?.last_name?.toLowerCase().includes(searchLower) ||
        profile?.birth_name?.toLowerCase().includes(searchLower) ||
        profile?.email?.toLowerCase().includes(searchLower) ||
        member.relationship_label?.toLowerCase().includes(searchLower) ||
        member.familyUnit.family_label.toLowerCase().includes(searchLower)
      );
    });
  }, [allMembers, debouncedSearchTerm]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const groupedMembers = useMemo(() => {
    return paginatedMembers.reduce((acc, member) => {
      const unitId = member.familyUnit.id;
      if (!acc[unitId]) {
        acc[unitId] = { familyUnit: member.familyUnit, members: [] };
      }
      acc[unitId].members.push(member);
      return acc;
    }, {} as Record<string, { familyUnit: FamilyUnit; members: FamilyMember[] }>);
  }, [paginatedMembers]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const getDisplayName = (member: FamilyMember) => {
    const profile = member.profile;
    if (!profile) return 'Unknown';
    
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (profile.birth_name && profile.birth_name !== profile.last_name) {
      return `${profile.first_name} (${profile.birth_name}) ${profile.last_name}`;
    }
    return name || 'Unknown';
  };

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
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search family members..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredMembers.length} member(s)
          </Badge>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
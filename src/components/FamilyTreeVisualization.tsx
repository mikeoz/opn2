import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TreePine, Users, Crown, ChevronRight, Plus } from 'lucide-react';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface FamilyTreeVisualizationProps {
  familyUnits: FamilyUnit[];
  onSelectFamily?: (familyId: string) => void;
  selectedFamilyId?: string;
  onCreateFamily?: () => void;
}

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({
  familyUnits,
  onSelectFamily,
  selectedFamilyId,
  onCreateFamily
}) => {
  // Separate owned vs member families
  const ownedFamilies = familyUnits.filter(f => f.isOwner);
  const memberFamilies = familyUnits.filter(f => f.isMember && !f.isOwner);
  
  // Group family units by generation level
  const familyByGeneration = familyUnits.reduce((acc, family) => {
    const generation = family.generation_level;
    if (!acc[generation]) {
      acc[generation] = [];
    }
    acc[generation].push(family);
    return acc;
  }, {} as Record<number, FamilyUnit[]>);

  const generations = Object.keys(familyByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  const getDisplayName = (family: FamilyUnit): string => {
    const profile = family.trust_anchor_profile;
    if (profile?.display_preferences?.name_format === 'birth' && profile?.birth_name) {
      return profile.birth_name;
    }
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return family.family_label;
  };

  const getGenerationLabel = (generation: number): string => {
    switch (generation) {
      case 1:
        return 'First Generation (Founders)';
      case 2:
        return 'Second Generation';
      case 3:
        return 'Third Generation';
      case 4:
        return 'Fourth Generation';
      default:
        return `Generation ${generation}`;
    }
  };

  const handleFamilyClick = (familyId: string) => {
    if (onSelectFamily) {
      onSelectFamily(familyId);
    }
  };

  if (familyUnits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No family units created yet.</p>
            <p className="text-sm">Create your first family unit to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prompt to create own family if user only has memberships */}
      {ownedFamilies.length === 0 && memberFamilies.length > 0 && onCreateFamily && (
        <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TreePine className="h-10 w-10 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2">Create Your Own Family Unit</h3>
            <p className="text-muted-foreground text-center text-sm mb-4 max-w-md">
              You're currently a member of other family units. Start your own family tree to manage your family relationships and invite others!
            </p>
            <Button size="sm" onClick={onCreateFamily}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your Family Unit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Member of families - Compact View */}
      {memberFamilies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              Member Of
            </Badge>
          </div>
          <div className="space-y-3">
            {memberFamilies.map(family => (
              <Card 
                key={family.id} 
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleFamilyClick(family.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        Member of {family.family_label}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Led by {getDisplayName(family)}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {family.member_count || 0} members
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Gen {family.generation_level}
                        </Badge>
                        {family.membershipDetails?.relationship_label && (
                          <span className="text-muted-foreground">
                            ({family.membershipDetails.relationship_label})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4"
                    >
                      More Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Families you own - Tree View */}
      {ownedFamilies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Your Family Tree
              </CardTitle>
              <Badge variant="default" className="text-sm">
                {ownedFamilies.length} {ownedFamilies.length === 1 ? 'Family' : 'Families'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generations.map((generation, index) => {
                const ownedInGeneration = familyByGeneration[generation].filter(f => f.isOwner);
                if (ownedInGeneration.length === 0) return null;
                
                return (
                  <div key={generation} className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="font-medium">
                        {getGenerationLabel(generation)}
                      </Badge>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {ownedInGeneration.map((family) => (
                  <div
                    key={family.id}
                    className={`
                      relative p-4 border rounded-lg transition-all cursor-pointer
                      ${selectedFamilyId === family.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                    onClick={() => handleFamilyClick(family.id)}
                  >
                    {/* Connection line to parent */}
                    {family.parent_family_unit_id && index > 0 && (
                      <div 
                        className="absolute -top-6 left-1/2 w-px h-6 bg-muted-foreground"
                        style={{ transform: 'translateX(-50%)' }}
                      />
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm leading-tight">
                            {family.family_label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Led by {getDisplayName(family)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{family.member_count || 0} members</span>
                        </div>
                        
                        {family.parent_family && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TreePine className="h-3 w-3" />
                            <span>Child of {family.parent_family.family_label}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          Gen {family.generation_level}
                        </Badge>
                        
                        {family.trust_anchor_profile?.display_preferences?.show_birth_name && (
                          <Badge variant="outline" className="text-xs">
                            Birth Name
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Crown className="h-2 w-2" />
                          Trust Anchor
                        </Badge>
                      </div>
                      
                      {family.family_metadata && Object.keys(family.family_metadata as object).length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            {(family.family_metadata as any)?.description || 'Additional family information available'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                      ))}
                    </div>
                    
                    {/* Connection lines between generations */}
                    {index < generations.length - 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="w-px h-6 bg-muted-foreground/50"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {ownedFamilies.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Total Families: {ownedFamilies.length}</span>
                    <span>Generations: {generations.length}</span>
                    <span>Total Members: {ownedFamilies.reduce((sum, f) => sum + (f.member_count || 0), 0)}</span>
                  </div>
                  {selectedFamilyId && (
                    <Badge variant="outline" className="text-xs">
                      Family Selected
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;
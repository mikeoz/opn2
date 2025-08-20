import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine, Users, Crown, ChevronRight } from 'lucide-react';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface FamilyTreeVisualizationProps {
  familyUnits: FamilyUnit[];
  onSelectFamily?: (familyId: string) => void;
  selectedFamilyId?: string;
}

const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({
  familyUnits,
  onSelectFamily,
  selectedFamilyId
}) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreePine className="h-5 w-5" />
          Family Tree
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {generations.map((generation, index) => (
            <div key={generation} className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="font-medium">
                  {getGenerationLabel(generation)}
                </Badge>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {familyByGeneration[generation].map((family) => (
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
          ))}
        </div>
        
        {familyUnits.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Total Families: {familyUnits.length}</span>
                <span>Generations: {generations.length}</span>
                <span>Total Members: {familyUnits.reduce((sum, f) => sum + (f.member_count || 0), 0)}</span>
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
  );
};

export default FamilyTreeVisualization;
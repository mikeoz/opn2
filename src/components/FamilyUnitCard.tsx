import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Crown, ChevronRight } from 'lucide-react';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface FamilyUnitCardProps {
  familyUnit: FamilyUnit;
  onSelect: () => void;
  isSelected: boolean;
}

export const FamilyUnitCard: React.FC<FamilyUnitCardProps> = ({
  familyUnit,
  onSelect,
  isSelected
}) => {
  const getDisplayName = () => {
    if (!familyUnit.trust_anchor_profile) {
      return familyUnit.family_label;
    }
    
    const profile = familyUnit.trust_anchor_profile;
    const preferences = profile.display_preferences || {};
    
    if (preferences.show_birth_name && profile.birth_name) {
      return `${profile.first_name} (${profile.birth_name}) ${profile.last_name}`;
    }
    
    return `${profile.first_name} ${profile.last_name}`;
  };

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`} onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            {familyUnit.family_label}
          </CardTitle>
          <Badge variant="secondary">Gen {familyUnit.generation_level}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Trust Anchor</p>
          <p className="font-medium">{getDisplayName()}</p>
        </div>

        {familyUnit.parent_family && (
          <div>
            <p className="text-sm text-muted-foreground">Parent Family</p>
            <p className="text-sm">{familyUnit.parent_family.family_label}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {familyUnit.member_count || 0} members
          </div>
          
          <Button variant="ghost" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
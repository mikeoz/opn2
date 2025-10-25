import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, Users, Crown, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface FamilyUnitCardProps {
  familyUnit: FamilyUnit;
  onSelect: () => void;
  isSelected: boolean;
  onEdit?: (familyUnit: FamilyUnit) => void;
  onDelete?: (familyUnit: FamilyUnit) => void;
}

export const FamilyUnitCard: React.FC<FamilyUnitCardProps> = ({
  familyUnit,
  onSelect,
  isSelected,
  onEdit,
  onDelete
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Gen {familyUnit.generation_level}</Badge>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(familyUnit);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Family Unit</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{familyUnit.family_label}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(familyUnit)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
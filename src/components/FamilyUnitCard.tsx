import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, Users, Crown, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FamilyUnit } from '@/hooks/useFamilyUnits';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const isOwner = user?.id === familyUnit.trust_anchor_user_id;

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
    <TooltipProvider>
      <Card className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`} onClick={onSelect}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {isOwner ? (
                <Crown className="h-4 w-4 text-amber-500" />
              ) : (
                <Users className="h-4 w-4 text-blue-500" />
              )}
              {familyUnit.family_label}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Gen {familyUnit.generation_level}</Badge>
              {isOwner && (onEdit || onDelete) && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>More options</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(familyUnit); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Family Unit
                      </DropdownMenuItem>
                    )}
                    {isOwner && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTransferDialogOpen(true); }}>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer Ownership
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Family Unit
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{familyUnit.family_label}" and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => { e.stopPropagation(); onDelete(familyUnit); }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
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

          {!isOwner && familyUnit.membershipDetails && (
            <div>
              <p className="text-sm text-muted-foreground">Your Role</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {familyUnit.membershipDetails.relationship_label || 'Member'}
                </Badge>
                {familyUnit.membershipDetails.joined_at && (
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(familyUnit.membershipDetails.joined_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

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
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View family details</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <TransferOwnershipDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        familyUnitId={familyUnit.id}
        familyUnitLabel={familyUnit.family_label}
      />
    </TooltipProvider>
  );
};
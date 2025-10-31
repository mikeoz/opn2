import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Users, Edit, Trash2, Mail, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits, FamilyMember } from '@/hooks/useFamilyUnits';
import { SeedProfileDialog } from './SeedProfileDialog';

interface FamilyMemberManagerProps {
  familyUnitId: string;
  familyUnitLabel: string;
  generationLevel: number;
  trustAnchorUserId: string;
  isOwner?: boolean;
}

const FamilyMemberManager: React.FC<FamilyMemberManagerProps> = ({
  familyUnitId,
  familyUnitLabel,
  generationLevel,
  trustAnchorUserId,
  isOwner = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchFamilyMembers } = useFamilyUnits();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    loadMembers();
  }, [trustAnchorUserId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const familyMembers = await fetchFamilyMembers(trustAnchorUserId);
      setMembers(familyMembers);
    } catch (error) {
      console.error('Error loading family members:', error);
      toast({
        title: "Error loading members",
        description: "Failed to load family members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: `${memberName} has been removed from ${familyUnitLabel}.`,
      });

      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error removing member",
        description: "Failed to remove family member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = (member: FamilyMember): string => {
    const profile = member.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.email || 'Unknown Member';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading family members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members ({members.length})
            </CardTitle>
            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="md:h-9" onClick={() => setSeedDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 md:mr-2" />
                    <span className="hidden sm:inline">Add Member</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">Add Member</TooltipContent>
              </Tooltip>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No family members yet.</p>
              {isOwner && <p className="text-sm">Add members to get started!</p>}
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{getDisplayName(member)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {member.relationship_label || 'Member'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Gen {member.family_generation}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isOwner && member.individual_user_id !== user?.id && (
                  <div className="flex gap-1 md:gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 md:h-8 md:w-8"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit member</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.id, getDisplayName(member))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove member</TooltipContent>
                    </Tooltip>
                  </div>
                )}
                
                {member.individual_user_id === user?.id && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    You
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      </Card>

      <SeedProfileDialog
        open={seedDialogOpen}
        onOpenChange={setSeedDialogOpen}
        familyUnitId={familyUnitId}
        familyUnitLabel={familyUnitLabel}
        generationLevel={generationLevel}
      />
    </TooltipProvider>
  );
};

export default FamilyMemberManager;
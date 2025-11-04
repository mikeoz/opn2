import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Users, Edit, Trash2, Mail, Crown, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits, FamilyMember } from '@/hooks/useFamilyUnits';
import { useFamilyInvitations } from '@/hooks/useFamilyInvitations';
import { usePendingFamilyProfiles } from '@/hooks/usePendingFamilyProfiles';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
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
  const { invitations, loading: invitationsLoading, cancelInvitation, resendInvitation } = useFamilyInvitations(familyUnitId);
  const { profiles: pendingProfiles, loading: profilesLoading, deleteProfile } = usePendingFamilyProfiles(familyUnitId);
  const { members: unifiedMembers, loading: membersLoading, transferOwnership } = useFamilyMembers(familyUnitId);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
  const [transferEmail, setTransferEmail] = useState('');

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

  const pendingInvitations = invitations.filter(inv => {
    const isExpired = new Date(inv.expires_at) < new Date();
    return inv.status === 'pending' && !isExpired;
  });

  const handleDeleteInvitation = async (invitationId: string, name: string) => {
    try {
      await cancelInvitation(invitationId);
      toast({
        title: "Invitation deleted",
        description: `Invitation for ${name} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error deleting invitation",
        description: "Failed to delete invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (invitationId: string, name: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: "Invitation resent",
        description: `Invitation reminder sent to ${name}.`,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error resending invitation",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePendingProfile = async (profileId: string, name: string) => {
    try {
      await deleteProfile(profileId);
      toast({
        title: "Profile deleted",
        description: `${name} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting pending profile:', error);
      toast({
        title: "Error deleting profile",
        description: "Failed to delete profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget || !transferEmail) return;

    const success = await transferOwnership(transferTarget.id, transferEmail);
    
    if (success) {
      setTransferDialogOpen(false);
      setTransferTarget(null);
      setTransferEmail('');
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

  // Separate claimed profiles (minors) from pending invitations
  const claimedMinors = pendingProfiles.filter(p => p.status === 'claimed');
  const truePendingProfiles = pendingProfiles.filter(p => p.status !== 'claimed');
  
  const isLoading = loading || invitationsLoading || profilesLoading || membersLoading;
  const totalCount = members.length + pendingInvitations.length + claimedMinors.length + truePendingProfiles.length;

  if (isLoading) {
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
              Family Members ({totalCount})
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
          {totalCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No family members yet.</p>
              {isOwner && <p className="text-sm">Add members to get started!</p>}
            </div>
          ) : (
            <>
              {/* Active Members */}
              {members.map((member) => (
                <div
                  key={`member-${member.id}`}
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
              ))}

              {/* Pending Invitations */}
              {pendingInvitations.map((invitation) => (
                <div
                  key={`invitation-${invitation.id}`}
                  className="flex items-center justify-between p-3 border border-destructive/50 rounded-lg bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="font-medium text-destructive">
                          {invitation.invitee_name || invitation.invitee_email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="destructive" className="text-xs">
                            Pending Invitation
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {invitation.relationship_role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Sent {invitation.sent_at ? new Date(invitation.sent_at).toLocaleDateString() : 'Not sent yet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex gap-1 md:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 md:h-8 md:w-8"
                            onClick={() => handleResendInvitation(invitation.id, invitation.invitee_name || invitation.invitee_email)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Resend invitation</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteInvitation(invitation.id, invitation.invitee_name || invitation.invitee_email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete invitation</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))}

              {/* Claimed Minors (immediately added minor children) */}
              {claimedMinors.map((profile) => (
                <div
                  key={`minor-${profile.id}`}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Minor Child
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {profile.relationship_label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex gap-1 md:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTransferTarget({ 
                                id: profile.id, 
                                name: `${profile.first_name} ${profile.last_name}` 
                              });
                              setTransferDialogOpen(true);
                            }}
                          >
                            Transfer Ownership
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Transfer account ownership</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeletePendingProfile(profile.id, `${profile.first_name} ${profile.last_name}`)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete profile</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))}

              {/* Pending Profiles (not yet claimed) */}
              {truePendingProfiles.map((profile) => (
                <div
                  key={`profile-${profile.id}`}
                  className="flex items-center justify-between p-3 border border-destructive/50 rounded-lg bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="font-medium text-destructive">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="destructive" className="text-xs">
                            Pending Profile
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {profile.relationship_label}
                          </Badge>
                          {profile.email && (
                            <span className="text-xs text-muted-foreground">
                              {profile.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePendingProfile(profile.id, `${profile.first_name} ${profile.last_name}`)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete pending profile</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
            </>
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

      {/* Transfer Ownership Dialog */}
      {transferDialogOpen && transferTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex flex-col space-y-1.5">
              <h2 className="text-lg font-semibold">Transfer Account Ownership</h2>
              <p className="text-sm text-muted-foreground">
                Transfer ownership of {transferTarget.name}'s account. They will receive an invitation to claim and control their account.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="transferEmail" className="text-sm font-medium">
                  Recipient Email Address *
                </label>
                <Input
                  id="transferEmail"
                  type="email"
                  placeholder="Enter their email address"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  They will receive an email invitation to claim this account.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransferDialogOpen(false);
                    setTransferTarget(null);
                    setTransferEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferOwnership}
                  disabled={!transferEmail}
                >
                  Send Transfer Invitation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
};

export default FamilyMemberManager;
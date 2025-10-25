import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserPlus, Users, Edit, Trash2, Mail, Crown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits, FamilyMember } from '@/hooks/useFamilyUnits';

interface FamilyMemberManagerProps {
  familyUnitId: string;
  familyUnitLabel: string;
  isOwner?: boolean;
}

interface AddMemberFormData {
  userEmail: string;
  relationshipLabel: string;
  familyGeneration: number;
  permissions: Record<string, boolean>;
}

const FamilyMemberManager: React.FC<FamilyMemberManagerProps> = ({
  familyUnitId,
  familyUnitLabel,
  isOwner = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchFamilyMembers } = useFamilyUnits();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const form = useForm<AddMemberFormData>({
    defaultValues: {
      userEmail: '',
      relationshipLabel: '',
      familyGeneration: 1,
      permissions: {
        view_family_cards: true,
        edit_family_info: false,
        manage_members: false,
        admin_access: false
      }
    }
  });

  useEffect(() => {
    loadMembers();
  }, [familyUnitId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const familyMembers = await fetchFamilyMembers(familyUnitId);
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

  const handleInviteMember = async (data: AddMemberFormData) => {
    if (!user) return;

    try {
      // First check if user exists
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.userEmail)
        .maybeSingle();

      if (userError) throw userError;

      if (!targetUser) {
        toast({
          title: "User not found",
          description: "No user found with that email address. They need to create an account first.",
          variant: "destructive",
        });
        return;
      }

      // Check if already a member
      const existingMember = members.find(m => m.individual_user_id === targetUser.id);
      if (existingMember) {
        toast({
          title: "Already a member",
          description: "This user is already a member of this family unit.",
          variant: "destructive",
        });
        return;
      }

      // Create organization membership
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert({
          individual_user_id: targetUser.id,
          organization_user_id: familyUnitId,
          membership_type: 'member',
          relationship_label: data.relationshipLabel,
          family_generation: data.familyGeneration,
          permissions: data.permissions,
          is_family_unit: true,
          status: 'active',
          created_by: user.id
        });

      if (membershipError) throw membershipError;

      toast({
        title: "Member added successfully",
        description: `${data.userEmail} has been added to ${familyUnitLabel}.`,
      });

      setInviteDialogOpen(false);
      form.reset();
      loadMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error adding member",
        description: "Failed to add family member. Please try again.",
        variant: "destructive",
      });
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

  const relationshipOptions = [
    'parent', 'child', 'spouse', 'sibling', 
    'grandparent', 'grandchild', 'aunt', 'uncle',
    'cousin', 'niece', 'nephew', 'other'
  ];

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
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="sm" className="md:h-9">
                        <UserPlus className="h-4 w-4 md:mr-2" />
                        <span className="hidden sm:inline">Add Member</span>
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden">Add Member</TooltipContent>
                </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Family Member</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInviteMember)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="userEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter user's email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="relationshipLabel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipOptions.map((relationship) => (
                                <SelectItem key={relationship} value={relationship}>
                                  {relationship.charAt(0).toUpperCase() + relationship.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="familyGeneration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generation Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button 
                        type="submit" 
                        size="sm"
                        className="flex-1 sm:h-10"
                      >
                        Add Member
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:h-10"
                        onClick={() => setInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
    </TooltipProvider>
  );
};

export default FamilyMemberManager;
import React, { useState } from 'react';
import { useOrganizationMemberships } from '@/hooks/useOrganizationMemberships';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationMembershipProps {
  organizationId: string;
}

export const OrganizationMembership: React.FC<OrganizationMembershipProps> = ({ organizationId }) => {
  const { memberships, loading, createMembership, updateMembershipStatus, deleteMembership } = useOrganizationMemberships();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [membershipType, setMembershipType] = useState('member');
  const [isAdding, setIsAdding] = useState(false);

  const organizationMemberships = memberships.filter(m => m.organization_user_id === organizationId);
  const individualMemberships = memberships.filter(m => m.individual_user_id === organizationId);

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsAdding(true);
    try {
      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail.trim())
        .single();

      if (profileError || !profiles) {
        toast.error('User not found with this email address');
        return;
      }

      const success = await createMembership(
        profiles.id,
        organizationId,
        membershipType,
        { role: membershipType }
      );

      if (success) {
        setMemberEmail('');
        setMembershipType('member');
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (membershipId: string, newStatus: string) => {
    await updateMembershipStatus(membershipId, newStatus);
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await deleteMembership(membershipId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading memberships...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Memberships
          </CardTitle>
          <CardDescription>
            Manage individual members and organizational relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Individual Members</h3>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Organization Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Member Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="member@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Membership Type</Label>
                        <Select value={membershipType} onValueChange={setMembershipType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddMember} 
                        disabled={isAdding}
                        className="w-full"
                      >
                        {isAdding ? 'Adding...' : 'Add Member'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-2">
                {organizationMemberships.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No members found. Add members to get started.
                  </p>
                ) : (
                  organizationMemberships.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {membership.individual_profile?.first_name} {membership.individual_profile?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {membership.individual_profile?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {membership.membership_type}
                        </Badge>
                        <Badge className={getStatusColor(membership.status)}>
                          {membership.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(membership.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="organizations" className="space-y-4">
              <h3 className="text-lg font-semibold">Organization Memberships</h3>
              <div className="space-y-2">
                {individualMemberships.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No organization memberships found.
                  </p>
                ) : (
                  individualMemberships.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {membership.organization_profile?.entity_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {membership.organization_profile?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {membership.membership_type}
                        </Badge>
                        <Badge className={getStatusColor(membership.status)}>
                          {membership.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
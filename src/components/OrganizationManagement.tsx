import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Settings, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { useOrganizationManagement } from '@/hooks/useOrganizationManagement';
import { format } from 'date-fns';

const OrganizationManagement = () => {
  const {
    members,
    loading,
    inviteLoading,
    inviteAdmin,
    updateMemberRole,
    removeMember
  } = useOrganizationManagement();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    membershipType: 'member' as 'admin' | 'member'
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await inviteAdmin(inviteForm);
    if (success) {
      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        membershipType: 'member'
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
  };

  const getMemberDisplayName = (member: any) => {
    const { first_name, last_name, email } = member.profile;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return email || 'Unknown User';
  };

  const isAdmin = (member: any) => {
    return member.user_roles.some((role: any) => role.role === 'admin');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading organization members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organization Management
            </CardTitle>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={inviteForm.firstName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={inviteForm.lastName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="membershipType">Role</Label>
                    <Select
                      value={inviteForm.membershipType}
                      onValueChange={(value: 'admin' | 'member') => 
                        setInviteForm(prev => ({ ...prev, membershipType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviteLoading}>
                      {inviteLoading ? 'Inviting...' : 'Send Invite'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No organization members yet.</p>
              <p className="text-sm">Start by inviting your first member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {getMemberDisplayName(member)}
                      </TableCell>
                      <TableCell>{member.profile.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin(member) ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Member
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === 'active' ? 'default' : 'secondary'}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.joined_at 
                          ? format(new Date(member.joined_at), 'MMM d, yyyy')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={isAdmin(member) ? 'admin' : 'member'}
                            onValueChange={(value: 'admin' | 'member') => 
                              handleRoleChange(member.id, value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {getMemberDisplayName(member)} from your organization? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {members.filter(m => isAdmin(m)).length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {members.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationManagement;
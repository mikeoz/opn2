import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Baby, Send, X } from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { format } from 'date-fns';

interface FamilyMembersListProps {
  familyUnitId: string;
  familyLabel: string;
}

export const FamilyMembersList: React.FC<FamilyMembersListProps> = ({
  familyUnitId,
  familyLabel
}) => {
  const { members, loading, transferOwnership } = useFamilyMembers(familyUnitId);
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; profileId?: string; name?: string }>({
    open: false
  });
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);

  const handleTransferOwnership = async () => {
    if (!transferDialog.profileId || !transferEmail) return;

    setTransferring(true);
    const success = await transferOwnership(transferDialog.profileId, transferEmail);
    
    if (success) {
      setTransferDialog({ open: false });
      setTransferEmail('');
    }
    setTransferring(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading Members...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Members
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'member' : 'members'} in {familyLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {member.isMinor && <Baby className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.relationshipLabel}
                      {member.email && ` • ${member.email}`}
                    </div>
                    {member.joinedAt && (
                      <div className="text-xs text-muted-foreground">
                        Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.memberType === 'minor' && (
                    <Badge variant="secondary" className="text-xs">
                      Minor
                    </Badge>
                  )}
                  {member.canTransferOwnership && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTransferDialog({
                          open: true,
                          profileId: member.id,
                          name: member.name
                        })
                      }
                    >
                      Transfer Ownership
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No family members yet. Start by inviting someone!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={transferDialog.open} onOpenChange={(open) => setTransferDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Account Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of {transferDialog.name}'s account to them. They will receive an invitation
              to claim and take control of their account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transferEmail">Recipient Email Address *</Label>
              <Input
                id="transferEmail"
                type="email"
                placeholder="Enter their email address"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                They will receive an email invitation to claim this account.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTransferDialog({ open: false });
                  setTransferEmail('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleTransferOwnership}
                disabled={transferring || !transferEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                {transferring ? 'Sending...' : 'Send Transfer Invitation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

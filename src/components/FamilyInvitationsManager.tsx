import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trash2, 
  UserPlus,
  Calendar,
  Send
} from 'lucide-react';
import { useFamilyInvitations, FamilyInvitation } from '@/hooks/useFamilyInvitations';
import { FamilyInvitationDialog } from './FamilyInvitationDialog';
import { UnifiedFamilyAddDialog } from './UnifiedFamilyAddDialog';

interface FamilyInvitationsManagerProps {
  familyUnitId: string;
  familyUnitLabel: string;
  isOwner?: boolean;
}

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  expired: <XCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InvitationCard: React.FC<{
  invitation: FamilyInvitation;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
  isOwner: boolean;
}> = ({ invitation, onCancel, onResend, isOwner }) => {
  const isExpired = new Date(invitation.expires_at) < new Date();
  const actualStatus = isExpired && invitation.status === 'pending' ? 'expired' : invitation.status;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h4 className="font-medium text-sm sm:text-base break-words">
                {invitation.invitee_name || invitation.invitee_email}
              </h4>
              <Badge className={`${statusColors[actualStatus]} flex items-center gap-1 text-xs shrink-0`}>
                {statusIcons[actualStatus]}
                {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
              </Badge>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
              <p className="flex items-center gap-1 break-all">
                <Mail className="h-3 w-3 shrink-0" /> 
                <span>{invitation.invitee_email}</span>
              </p>
              <p><strong>Relationship:</strong> {invitation.relationship_role}</p>
              <p className="flex items-start gap-1">
                <Calendar className="h-3 w-3 shrink-0 mt-0.5" /> 
                <span>Sent: {invitation.sent_at ? formatDate(invitation.sent_at) : 'Not sent yet'}</span>
              </p>
              <p><strong>Expires:</strong> {formatDate(invitation.expires_at)}</p>
              
              {invitation.personal_message && (
                <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm">
                  <strong>Message:</strong> "{invitation.personal_message}"
                </div>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 sm:flex-col sm:ml-4">
              {actualStatus === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResend(invitation.id)}
                  className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Send className="h-3 w-3" />
                  <span className="sm:inline">Resend</span>
                </Button>
              )}
              
              {(actualStatus === 'pending' || actualStatus === 'expired') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(invitation.id)}
                  className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sm:inline">Cancel</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const FamilyInvitationsManager: React.FC<FamilyInvitationsManagerProps> = ({
  familyUnitId,
  familyUnitLabel,
  isOwner = false,
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { invitations, loading, cancelInvitation, resendInvitation } = useFamilyInvitations(familyUnitId);

  const pendingInvitations = invitations.filter(inv => {
    const isExpired = new Date(inv.expires_at) < new Date();
    return inv.status === 'pending' && !isExpired;
  });

  const expiredInvitations = invitations.filter(inv => {
    const isExpired = new Date(inv.expires_at) < new Date();
    return (inv.status === 'pending' && isExpired) || inv.status === 'expired';
  });

  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
  const cancelledInvitations = invitations.filter(inv => inv.status === 'cancelled');

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
                <UserPlus className="h-5 w-5" />
                Family Invitations
              </CardTitle>
              <CardDescription className="mt-1">
                Manage invitations for the {familyUnitLabel} family unit
              </CardDescription>
            </div>
            
            {isOwner && (
              <Button 
                onClick={() => setShowInviteDialog(true)} 
                variant="default"
                className="w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Family Members
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invitations sent yet</p>
              {isOwner && (
                <p className="text-sm">Click "Add Family Members" to invite individuals or connect with other families</p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  Pending ({pendingInvitations.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="text-xs sm:text-sm">
                  Accepted ({acceptedInvitations.length})
                </TabsTrigger>
                <TabsTrigger value="expired" className="text-xs sm:text-sm">
                  Expired ({expiredInvitations.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
                  Cancelled ({cancelledInvitations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                {pendingInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No pending invitations</p>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onCancel={cancelInvitation}
                      onResend={resendInvitation}
                      isOwner={isOwner}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="accepted" className="mt-4">
                {acceptedInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No accepted invitations</p>
                ) : (
                  acceptedInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onCancel={cancelInvitation}
                      onResend={resendInvitation}
                      isOwner={isOwner}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="expired" className="mt-4">
                {expiredInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No expired invitations</p>
                ) : (
                  expiredInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onCancel={cancelInvitation}
                      onResend={resendInvitation}
                      isOwner={isOwner}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="mt-4">
                {cancelledInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No cancelled invitations</p>
                ) : (
                  cancelledInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onCancel={cancelInvitation}
                      onResend={resendInvitation}
                      isOwner={isOwner}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <UnifiedFamilyAddDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        familyUnitId={familyUnitId}
        familyUnitLabel={familyUnitLabel}
      />
    </div>
  );
};
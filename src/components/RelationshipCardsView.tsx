import React, { useState } from 'react';
import { useRelationshipCards } from '@/hooks/useRelationshipCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { RelationshipInvitationDialog } from './RelationshipInvitationDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const RelationshipCardsView: React.FC = () => {
  const { user } = useAuth();
  const { relationships, loading, respondToInvitation, terminateRelationship } = useRelationshipCards();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [respondingCard, setRespondingCard] = useState<string | null>(null);
  const [modifiedLabel, setModifiedLabel] = useState('');
  const [terminatingCard, setTerminatingCard] = useState<string | null>(null);

  const invitedRelationships = relationships.filter(r => r.status === 'invited');
  const activeRelationships = relationships.filter(r => 
    ['accepted', 'modified'].includes(r.status)
  );
  const terminatedRelationships = relationships.filter(r => r.status === 'terminated');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      invited: { variant: 'secondary', icon: Clock },
      accepted: { variant: 'default', icon: CheckCircle },
      modified: { variant: 'outline', icon: ArrowRightLeft },
      rejected: { variant: 'destructive', icon: XCircle },
      terminated: { variant: 'secondary', icon: XCircle }
    };

    const config = variants[status] || variants.invited;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleAccept = async (cardId: string, withModification: boolean) => {
    if (withModification && modifiedLabel) {
      await respondToInvitation(cardId, 'accepted', modifiedLabel);
    } else {
      await respondToInvitation(cardId, 'accepted');
    }
    setRespondingCard(null);
    setModifiedLabel('');
  };

  const handleTerminate = async (cardId: string) => {
    await terminateRelationship(cardId);
    setTerminatingCard(null);
  };

  const renderRelationshipCard = (relationship: any, isPending: boolean = false) => {
    const isFromMe = relationship.from_user_id === user?.id;
    const otherProfile = isFromMe ? relationship.to_profile : relationship.from_profile;
    const myLabel = isFromMe ? relationship.relationship_label_from : relationship.relationship_label_to;
    const theirLabel = isFromMe ? relationship.relationship_label_to : relationship.relationship_label_from;

    return (
      <Card key={relationship.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">
                {otherProfile?.first_name} {otherProfile?.last_name}
                {!otherProfile && relationship.to_user_email && (
                  <span className="text-muted-foreground"> ({relationship.to_user_email})</span>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                I am their <span className="font-semibold">{myLabel}</span>, 
                they are my <span className="font-semibold">{theirLabel}</span>
              </CardDescription>
              {relationship.metadata?.nickname && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nickname: {relationship.metadata.nickname}
                </p>
              )}
            </div>
            {getStatusBadge(relationship.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Users className="w-4 h-4" />
            <span>
              Confidence: {relationship.confidence?.indicator_type || 'self-asserted'}
            </span>
          </div>

          {isPending && relationship.to_user_id === user?.id && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRespondingCard(relationship.id)}
              >
                Accept / Modify
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respondToInvitation(relationship.id, 'rejected')}
              >
                Decline
              </Button>
            </div>
          )}

          {!isPending && relationship.status !== 'terminated' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setTerminatingCard(relationship.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Terminate Relationship
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading relationships...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relationship Cards</h2>
          <p className="text-muted-foreground">
            Bilateral relationships with mutual labels
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite to Relationship
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeRelationships.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({invitedRelationships.length})
          </TabsTrigger>
          <TabsTrigger value="terminated">
            Terminated ({terminatedRelationships.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeRelationships.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No active relationships yet. Send an invitation to get started!
              </CardContent>
            </Card>
          ) : (
            activeRelationships.map(rel => renderRelationshipCard(rel))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {invitedRelationships.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending invitations
              </CardContent>
            </Card>
          ) : (
            invitedRelationships.map(rel => renderRelationshipCard(rel, true))
          )}
        </TabsContent>

        <TabsContent value="terminated" className="space-y-4 mt-6">
          {terminatedRelationships.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No terminated relationships
              </CardContent>
            </Card>
          ) : (
            terminatedRelationships.map(rel => renderRelationshipCard(rel))
          )}
        </TabsContent>
      </Tabs>

      <RelationshipInvitationDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      <AlertDialog open={!!respondingCard} onOpenChange={() => setRespondingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Relationship Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              You can accept the proposed relationship label or modify it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Modify relationship label (optional)</Label>
            <Input
              placeholder="Enter different label..."
              value={modifiedLabel}
              onChange={(e) => setModifiedLabel(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => respondingCard && handleAccept(respondingCard, false)}>
              Accept as Proposed
            </AlertDialogAction>
            {modifiedLabel && (
              <AlertDialogAction onClick={() => respondingCard && handleAccept(respondingCard, true)}>
                Accept with Modification
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!terminatingCard} onOpenChange={() => setTerminatingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Relationship</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the relationship as terminated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => terminatingCard && handleTerminate(terminatingCard)}
              className="bg-destructive text-destructive-foreground"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

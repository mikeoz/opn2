import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TreePine, 
  Users, 
  ArrowDown, 
  ArrowUp, 
  Check, 
  X, 
  Clock, 
  Plus,
  GitBranch,
  Crown,
  Calendar
} from 'lucide-react';
import { useFamilyConnections, FamilyConnection } from '@/hooks/useFamilyConnections';
import { FamilyConnectionDialog } from './FamilyConnectionDialog';

interface FamilyTreeTabProps {
  familyUnitId: string;
  familyUnitLabel: string;
  isOwner?: boolean;
}

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  approved: <Check className="h-4 w-4" />,
  rejected: <X className="h-4 w-4" />,
  cancelled: <X className="h-4 w-4" />,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ConnectionCard: React.FC<{
  connection: FamilyConnection;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  isOwner: boolean;
  currentFamilyId: string;
}> = ({ connection, onApprove, onReject, onCancel, isOwner, currentFamilyId }) => {
  const isCurrentUnitChild = connection.child_family_unit_id === currentFamilyId;
  const isCurrentUnitParent = connection.parent_family_unit_id === currentFamilyId;
  const otherFamily = isCurrentUnitChild ? connection.parent_family : connection.child_family;
  const isExpired = new Date(connection.expires_at) < new Date();
  const actualStatus = isExpired && connection.status === 'pending' ? 'expired' : connection.status;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{otherFamily?.family_label}</h4>
              <Badge className={`${statusColors[actualStatus]} flex items-center gap-1`}>
                {statusIcons[actualStatus]}
                {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                {isCurrentUnitChild ? (
                  <>
                    <ArrowUp className="h-3 w-3" />
                    <span>Parent family connection</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3" />
                    <span>Child family connection</span>
                  </>
                )}
              </div>
              
              <p><strong>Type:</strong> {connection.connection_direction}</p>
              <p><Calendar className="h-3 w-3 inline mr-1" /> 
                Created: {formatDate(connection.created_at)}
              </p>
              {connection.expires_at && (
                <p><strong>Expires:</strong> {formatDate(connection.expires_at)}</p>
              )}
              
              {connection.personal_message && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Message:</strong> "{connection.personal_message}"
                </div>
              )}
            </div>
          </div>

          {isOwner && connection.status === 'pending' && (
            <div className="flex gap-2 ml-4">
              {/* Show approve/reject for incoming connections (where user can decide) */}
              {((connection.connection_direction === 'invitation' && isCurrentUnitChild) ||
                (connection.connection_direction === 'request' && isCurrentUnitParent)) && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApprove?.(connection.id)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject?.(connection.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                    Decline
                  </Button>
                </>
              )}
              
              {/* Show cancel for outgoing connections */}
              {((connection.connection_direction === 'invitation' && isCurrentUnitParent) ||
                (connection.connection_direction === 'request' && isCurrentUnitChild)) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel?.(connection.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const FamilyTreeTab: React.FC<FamilyTreeTabProps> = ({
  familyUnitId,
  familyUnitLabel,
  isOwner = false,
}) => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { 
    connections, 
    familyTreeData, 
    loading, 
    respondToConnection, 
    cancelConnection 
  } = useFamilyConnections(familyUnitId);

  const handleApprove = async (connectionId: string) => {
    await respondToConnection(connectionId, 'approved');
  };

  const handleReject = async (connectionId: string) => {
    await respondToConnection(connectionId, 'rejected');
  };

  const handleCancel = async (connectionId: string) => {
    await cancelConnection(connectionId);
  };

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

  const pendingConnections = connections.filter(conn => conn.status === 'pending');
  const approvedConnections = connections.filter(conn => conn.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Family Tree Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Family Tree
              </CardTitle>
              <CardDescription>
                Hierarchical connections for {familyUnitLabel}
              </CardDescription>
            </div>
            
            {isOwner && (
              <Button onClick={() => setShowConnectionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Family
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {familyTreeData && (
            <div className="space-y-4">
              {/* Parent Family */}
              {familyTreeData.parentConnection && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Parent Family</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {familyTreeData.parentConnection.parent_family?.family_label}
                  </p>
                </div>
              )}

              {/* Current Family */}
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <span className="font-medium">Your Family</span>
                </div>
                <p className="text-lg font-semibold">{familyUnitLabel}</p>
                <p className="text-sm text-muted-foreground">
                  Generation {familyTreeData.currentUnit?.generation_level || 1}
                </p>
              </div>

              {/* Child Families */}
              {familyTreeData.childConnections.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    <span className="font-medium">Child Families</span>
                  </div>
                  {familyTreeData.childConnections.map((connection) => (
                    <div key={connection.id} className="ml-6 p-3 border rounded-lg">
                      <p className="font-medium">
                        {connection.child_family?.family_label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Connected {formatDate(connection.approved_at || connection.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* No connections message */}
              {!familyTreeData.parentConnection && familyTreeData.childConnections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No family connections yet</p>
                  {isOwner && (
                    <p className="text-sm">Click "Connect Family" to start building your family tree</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Connections
          </CardTitle>
          <CardDescription>
            Manage family unit connections and invitations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({pendingConnections.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedConnections.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingConnections.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No pending connections</p>
              ) : (
                pendingConnections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    isOwner={isOwner}
                    currentFamilyId={familyUnitId}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedConnections.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No approved connections</p>
              ) : (
                approvedConnections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    isOwner={isOwner}
                    currentFamilyId={familyUnitId}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <FamilyConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        currentFamilyUnitId={familyUnitId}
        currentFamilyLabel={familyUnitLabel}
      />
    </div>
  );
};
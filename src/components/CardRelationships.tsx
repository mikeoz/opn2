
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Share2, Users, Building, Calendar } from 'lucide-react';
import { CardRelationship, AccessPermissionType, PERMISSION_LABELS } from '@/utils/permissionUtils';

interface CardRelationshipsProps {
  cardId: string;
}

const CardRelationships: React.FC<CardRelationshipsProps> = ({ cardId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [relationships, setRelationships] = useState<CardRelationship[]>([]);
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchRelationships();
    fetchProviders();
  }, [cardId]);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('card_relationships')
        .select(`
          *,
          providers!card_relationships_shared_with_provider_id_fkey (name)
        `)
        .eq('card_id', cardId);

      if (error) throw error;
      
      // Type cast the data to match our CardRelationship interface
      const typedRelationships: CardRelationship[] = (data || []).map(item => ({
        id: item.id,
        card_id: item.card_id,
        shared_with_user_id: item.shared_with_user_id || undefined,
        shared_with_provider_id: item.shared_with_provider_id || undefined,
        relationship_type: item.relationship_type as CardRelationship['relationship_type'],
        permissions: (item.permissions as any) || {},
        shared_at: item.shared_at,
        expires_at: item.expires_at || undefined,
        created_by: item.created_by
      }));
      
      setRelationships(typedRelationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithProvider = async (providerId: string, permissions: AccessPermissionType[]) => {
    if (!user) return;

    setIsSharing(true);
    try {
      const { error } = await supabase
        .from('card_relationships')
        .insert({
          card_id: cardId,
          shared_with_provider_id: providerId,
          relationship_type: 'shared',
          permissions: { default: permissions },
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Card shared successfully!",
        description: "The card has been shared with the selected provider.",
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error sharing card:', error);
      toast({
        title: "Error sharing card",
        description: "Failed to share the card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareWithUser = async (userEmail: string, permissions: AccessPermissionType[]) => {
    if (!user) return;

    setIsSharing(true);
    try {
      // First, find the user by email
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (userError) throw userError;
      
      if (!targetUser) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('card_relationships')
        .insert({
          card_id: cardId,
          shared_with_user_id: targetUser.id,
          relationship_type: 'member_of',
          permissions: { default: permissions },
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Organization membership granted!",
        description: "The user has been added as a member of this organization.",
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error sharing card with user:', error);
      toast({
        title: "Error adding member",
        description: "Failed to add the user as a member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const revokeRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('card_relationships')
        .update({ relationship_type: 'revoked' })
        .eq('id', relationshipId);

      if (error) throw error;

      toast({
        title: "Access revoked",
        description: "The card sharing relationship has been revoked.",
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error revoking relationship:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading relationships...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Card Relationships
          </CardTitle>
          <div className="flex gap-2">
            <ShareCardDialog 
              providers={providers}
              onShareWithProvider={handleShareWithProvider}
              onShareWithUser={handleShareWithUser}
              isSharing={isSharing}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relationships.length > 0 ? (
            relationships.map((relationship) => (
              <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {relationship.shared_with_user_id ? (
                    <Users className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Building className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {relationship.shared_with_user_id ? 'Organization Member' : 'Provider Relationship'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {relationship.relationship_type === 'member_of' ? 'Member since' : 'Shared on'} {new Date(relationship.shared_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    relationship.relationship_type === 'shared' || relationship.relationship_type === 'member_of' 
                      ? 'default' : 'destructive'
                  }>
                    {relationship.relationship_type.replace('_', ' ')}
                  </Badge>
                  {(relationship.relationship_type === 'shared' || relationship.relationship_type === 'member_of') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeRelationship(relationship.id)}
                    >
                      {relationship.relationship_type === 'member_of' ? 'Remove' : 'Revoke'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No relationships yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ShareCardDialogProps {
  providers: Array<{ id: string; name: string }>;
  onShareWithProvider: (providerId: string, permissions: AccessPermissionType[]) => Promise<void>;
  onShareWithUser: (userEmail: string, permissions: AccessPermissionType[]) => Promise<void>;
  isSharing: boolean;
}

const ShareCardDialog: React.FC<ShareCardDialogProps> = ({ 
  providers, 
  onShareWithProvider, 
  onShareWithUser, 
  isSharing 
}) => {
  const [shareType, setShareType] = useState<'provider' | 'user'>('user');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<AccessPermissionType[]>(['view_basic']);
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    if (shareType === 'provider' && selectedProvider) {
      await onShareWithProvider(selectedProvider, selectedPermissions);
    } else if (shareType === 'user' && userEmail) {
      await onShareWithUser(userEmail, selectedPermissions);
    } else {
      return;
    }
    
    setOpen(false);
    setSelectedProvider('');
    setUserEmail('');
    setSelectedPermissions(['view_basic']);
  };

  const togglePermission = (permission: AccessPermissionType) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Share2 className="h-4 w-4 mr-2" />
          Share Card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Card with Provider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Share with</label>
            <Select value={shareType} onValueChange={(value) => setShareType(value as 'provider' | 'user')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Individual User</SelectItem>
                <SelectItem value="provider">Service Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareType === 'user' ? (
            <div>
              <label className="text-sm font-medium">User Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter user's email address"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Select Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium">Permissions</label>
            <div className="space-y-2 mt-2">
              {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={selectedPermissions.includes(permission as AccessPermissionType)}
                    onCheckedChange={() => togglePermission(permission as AccessPermissionType)}
                  />
                  <label htmlFor={permission} className="text-sm">{label}</label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleShare} 
            disabled={
              (shareType === 'provider' && !selectedProvider) || 
              (shareType === 'user' && !userEmail) || 
              isSharing
            }
            className="w-full"
          >
            {isSharing ? 'Adding...' : `Add ${shareType === 'user' ? 'Member' : 'Share with Provider'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardRelationships;

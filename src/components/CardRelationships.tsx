
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
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
      setRelationships(data || []);
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

  const handleShareCard = async (providerId: string, permissions: AccessPermissionType[]) => {
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

      // Log the interaction
      await supabase
        .from('relationship_interactions')
        .insert({
          relationship_id: '', // Will be updated after we get the relationship
          interaction_type: 'card_shared',
          interaction_data: { card_id: cardId, provider_id: providerId, permissions },
          created_by: user.id
        });

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
          <ShareCardDialog 
            providers={providers}
            onShare={handleShareCard}
            isSharing={isSharing}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relationships.length > 0 ? (
            relationships.map((relationship) => (
              <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Provider Relationship</p>
                    <p className="text-sm text-gray-600">
                      Shared on {new Date(relationship.shared_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={relationship.relationship_type === 'shared' ? 'default' : 'destructive'}>
                    {relationship.relationship_type}
                  </Badge>
                  {relationship.relationship_type === 'shared' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeRelationship(relationship.id)}
                    >
                      Revoke
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
  onShare: (providerId: string, permissions: AccessPermissionType[]) => Promise<void>;
  isSharing: boolean;
}

const ShareCardDialog: React.FC<ShareCardDialogProps> = ({ providers, onShare, isSharing }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<AccessPermissionType[]>(['view_basic']);
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    if (!selectedProvider) return;
    
    await onShare(selectedProvider, selectedPermissions);
    setOpen(false);
    setSelectedProvider('');
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
            disabled={!selectedProvider || isSharing}
            className="w-full"
          >
            {isSharing ? 'Sharing...' : 'Share Card'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardRelationships;

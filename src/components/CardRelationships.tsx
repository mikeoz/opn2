
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits } from '@/hooks/useFamilyUnits';
import { Share2, Users, Building, Calendar, TreePine, UserCheck, Trash2 } from 'lucide-react';
import { CardRelationship, AccessPermissionType, PERMISSION_LABELS } from '@/utils/permissionUtils';
import { useSharingTemplates } from '@/hooks/useSharingTemplates';

interface CardRelationshipsProps {
  cardId: string;
}

const CardRelationships: React.FC<CardRelationshipsProps> = ({ cardId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { familyUnits, fetchFamilyMembers } = useFamilyUnits();
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

  const handleShareWithFamilyUnit = async (familyUnitId: string, permissions: AccessPermissionType[]) => {
    if (!user) return;

    setIsSharing(true);
    try {
      // Get all family members from the family unit
      const familyMembers = await fetchFamilyMembers(familyUnitId);
      const familyUnit = familyUnits.find(fu => fu.id === familyUnitId);
      
      if (familyMembers.length === 0) {
        toast({
          title: "No family members found",
          description: "This family unit has no active members to share with.",
          variant: "destructive",
        });
        return;
      }

      // Create relationships for each family member
      const relationshipsToCreate = familyMembers
        .filter(member => member.individual_user_id !== user.id) // Don't share with yourself
        .map(member => ({
          card_id: cardId,
          shared_with_user_id: member.individual_user_id,
          relationship_type: 'shared',
          permissions: { card: permissions },
          created_by: user.id,
          family_unit_id: familyUnitId,
          relationship_context: `family_${member.relationship_label || 'member'}`
        }));

      if (relationshipsToCreate.length === 0) {
        toast({
          title: "No valid family members",
          description: "No family members available to share with (excluding yourself).",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('card_relationships')
        .insert(relationshipsToCreate);

      if (error) throw error;

      toast({
        title: `Card shared with ${familyUnit?.family_label || 'family'}`,
        description: `Successfully shared with ${relationshipsToCreate.length} family member(s).`,
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error sharing with family:', error);
      toast({
        title: "Error sharing card",
        description: "Failed to share card with family members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
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
          permissions: { card: permissions },
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Card shared with provider",
        description: "Successfully shared card with the selected provider.",
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error sharing with provider:', error);
      toast({
        title: "Error sharing card",
        description: "Failed to share card with provider. Please try again.",
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
          familyUnits={familyUnits}
          onShareWithProvider={handleShareWithProvider}
          onShareWithUser={handleShareWithUser}
          onShareWithFamily={handleShareWithFamilyUnit}
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
  familyUnits: Array<{ id: string; family_label: string; generation_level: number; member_count?: number }>;
  onShareWithProvider: (providerId: string, permissions: AccessPermissionType[]) => Promise<void>;
  onShareWithUser: (userEmail: string, permissions: AccessPermissionType[]) => Promise<void>;
  onShareWithFamily: (familyUnitId: string, permissions: AccessPermissionType[]) => Promise<void>;
  isSharing: boolean;
}

const ShareCardDialog: React.FC<ShareCardDialogProps> = ({ 
  providers, 
  familyUnits,
  onShareWithProvider, 
  onShareWithUser, 
  onShareWithFamily,
  isSharing 
}) => {
  const [shareType, setShareType] = useState<'provider' | 'user' | 'family'>('user');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<AccessPermissionType[]>(['view_basic']);
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { templates } = useSharingTemplates();

  const handleShare = async () => {
    if (shareType === 'provider' && selectedProvider) {
      await onShareWithProvider(selectedProvider, selectedPermissions);
    } else if (shareType === 'user' && userEmail) {
      await onShareWithUser(userEmail, selectedPermissions);
    } else if (shareType === 'family' && selectedFamily) {
      await onShareWithFamily(selectedFamily, selectedPermissions);
    } else {
      return;
    }
    
    setOpen(false);
    setSelectedProvider('');
    setSelectedFamily('');
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

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.template_permissions.cards) {
      setSelectedPermissions(template.template_permissions.cards);
    }
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
          <DialogTitle>Share Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Share with</label>
            <Tabs value={shareType} onValueChange={(value) => setShareType(value as 'provider' | 'user' | 'family')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user">Individual User</TabsTrigger>
                <TabsTrigger value="provider">Service Provider</TabsTrigger>
                <TabsTrigger value="family">Family Unit</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user" className="mt-4">
                <div>
                  <label className="text-sm font-medium">User Email</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter user's email address"
                    className="mt-1"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="provider" className="mt-4">
                <div>
                  <label className="text-sm font-medium">Select Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="mt-1">
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
              </TabsContent>
              
              <TabsContent value="family" className="mt-4">
                <div>
                  <label className="text-sm font-medium">Select Family Unit</label>
                  <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a family unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyUnits.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          <div className="flex items-center gap-2">
                            <TreePine className="h-4 w-4" />
                            {family.family_label} (Gen {family.generation_level})
                            {family.member_count && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                {family.member_count} members
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFamily && (
                    <div className="p-3 bg-muted/50 rounded-lg mt-2">
                      <p className="text-sm text-muted-foreground">
                        <TreePine className="h-4 w-4 inline mr-1" />
                        This will share the card with all active members of the selected family unit.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <label className="text-sm font-medium">Quick Templates</label>
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value);
              applyTemplate(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a permission template" />
              </SelectTrigger>
              <SelectContent>
                {templates.filter(t => t.is_public).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
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
            disabled={
              (shareType === 'provider' && !selectedProvider) || 
              (shareType === 'user' && !userEmail) || 
              (shareType === 'family' && !selectedFamily) ||
              isSharing
            }
            className="w-full"
          >
            {isSharing ? 'Sharing...' : `Share with ${shareType === 'family' ? 'Family' : shareType === 'provider' ? 'Provider' : 'User'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardRelationships;

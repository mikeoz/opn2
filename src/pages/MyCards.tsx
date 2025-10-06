
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Eye, Edit, Trash2, Users, Share2, TreePine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits } from '@/hooks/useFamilyUnits';
import MobileLayout from '@/components/MobileLayout';
import GranularSharingDialog from '@/components/GranularSharingDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplateField {
  id: string;
  field_name: string;
  field_type: 'string' | 'image' | 'document';
  is_required: boolean;
  display_order: number;
}

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'user' | 'access' | 'participant' | 'transaction';
  transaction_code: 'S' | 'N';
  fields: TemplateField[];
}

interface FieldValue {
  template_field_id: string;
  value: string;
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values: FieldValue[];
  family_unit_id?: string;
  family_role?: string;
  generation_level?: number;
  family_unit?: { family_label: string; generation_level: number };
}

const getCardTitle = (card: UserCard): string => {
  const cardLabelField = card.template.fields.find(f => f.field_name.toLowerCase().includes('card label'));
  if (cardLabelField) {
    const fieldValue = card.field_values.find(fv => fv.template_field_id === cardLabelField.id);
    if (fieldValue && fieldValue.value) {
      return fieldValue.value.trim();
    }
  }
  return card.template.name;
};

const MyCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { familyUnits } = useFamilyUnits();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardForSharing, setSelectedCardForSharing] = useState<UserCard | null>(null);
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      return;
    }

    fetchUserCards();
    fetchAvailableTemplates();
  }, [user]);

  const fetchUserCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          id,
          card_code,
          template_id,
          family_unit_id,
          family_role,
          generation_level,
          card_templates!inner (
            id,
            name,
            description,
            type,
            transaction_code,
            template_fields (
              id,
              field_name,
              field_type,
              is_required,
              display_order
            )
          ),
          card_field_values (
            template_field_id,
            value
          ),
          family_units (
            family_label,
            generation_level
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user cards:', error);
        throw error;
      }

      const userCardsWithTemplate = data.map(card => ({
        id: card.id,
        card_code: card.card_code,
        template: {
          ...card.card_templates,
          fields: card.card_templates.template_fields || []
        },
        field_values: card.card_field_values || [],
        family_unit_id: card.family_unit_id,
        family_role: card.family_role,
        generation_level: card.generation_level,
        family_unit: card.family_units
      }));

      setUserCards(userCardsWithTemplate);
    } catch (error) {
      console.error('Error fetching user cards:', error);
      toast({
        title: "Error fetching cards",
        description: "Failed to load your cards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTemplates = async () => {
    try {
      // Fetch admin templates (available to everyone)
      const { data: adminTemplates, error: adminError } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          transaction_code
        `)
        .eq('type', 'admin');

      if (adminError) throw adminError;

      // Fetch standard templates
      const { data: standardTemplates, error: standardError } = await supabase
        .from('standard_card_templates')
        .select('id, name, description')
        .eq('is_active', true);

      if (standardError) throw standardError;

      // Fetch user's own templates
      const { data: userTemplates, error: userError } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          transaction_code
        `)
        .eq('type', 'user')
        .eq('created_by', user.id);

      if (userError) throw userError;

      // Combine all available templates
      const allTemplates = [
        ...(adminTemplates || []).map(template => ({
          ...template,
          fields: [] as TemplateField[]
        })),
        ...(standardTemplates || []).map(template => ({
          ...template,
          type: 'admin' as const,
          transaction_code: 'S' as const,
          fields: [] as TemplateField[]
        })),
        ...(userTemplates || []).map(template => ({
          ...template,
          fields: [] as TemplateField[]
        }))
      ];

      setAvailableTemplates(allTemplates);
    } catch (error) {
      console.error('Error fetching available templates:', error);
      toast({
        title: "Error fetching templates",
        description: "Failed to load available templates. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting card:', error);
        throw error;
      }

      toast({
        title: "Card deleted",
        description: "The card has been successfully deleted.",
      });

      fetchUserCards(); // Refresh card list
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error deleting card",
        description: "Failed to delete the card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGranularShare = async (selectedComponents: Record<string, string[]>) => {
    setIsSharing(true);
    try {
      // Here you would implement the actual sharing logic
      console.log('Sharing selected components:', selectedComponents);
      
      toast({
        title: "Card shared successfully",
        description: "Selected information has been shared.",
      });
      
      setSelectedCardForSharing(null);
    } catch (error) {
      console.error('Error sharing card:', error);
      toast({
        title: "Error sharing card",
        description: "Failed to share the selected information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Group cards by family unit or show all together
  const groupedCards = groupByFamily 
    ? userCards.reduce((groups, card) => {
        const key = card.family_unit_id 
          ? `${card.family_unit?.family_label || 'Unknown Family'} (Gen ${card.family_unit?.generation_level || card.generation_level || 1})`
          : 'Personal Cards';
        if (!groups[key]) groups[key] = [];
        groups[key].push(card);
        return groups;
      }, {} as Record<string, UserCard[]>)
    : { 'All Cards': userCards };

  const renderCard = (card: UserCard) => (
    <div
      key={card.id}
      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{getCardTitle(card)}</h3>
          {card.family_role && (
            <Badge variant="outline" className="text-xs">
              {card.family_role}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{card.template.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            Code: {card.card_code}
          </p>
          {card.family_unit_id && (
            <Badge variant="secondary" className="text-xs">
              <TreePine className="h-3 w-3 mr-1" />
              Family Card
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/cards/view/${card.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/cards/edit/${card.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => setSelectedCardForSharing(card)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteCard(card.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">My Cards</h1>
          <p className="text-muted-foreground">Manage your personal and professional cards</p>
          {userCards.some(card => card.family_unit_id) && (
            <div className="mt-2 flex items-center gap-2">
              <TreePine className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                You have {userCards.filter(card => card.family_unit_id).length} family cards
              </span>
            </div>
          )}
        </div>

        {/* User Cards List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Your Cards ({userCards.length})
              </CardTitle>
              {userCards.some(card => card.family_unit_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupByFamily(!groupByFamily)}
                  className="flex items-center gap-2"
                >
                  <TreePine className="h-4 w-4" />
                  {groupByFamily ? 'Show All' : 'Group by Family'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading your cards...</div>
              </div>
            ) : userCards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't created any cards yet.</p>
                <p className="text-sm">Use the templates above to get started!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedCards).map(([groupName, cards], index) => (
                  <div key={groupName}>
                    {groupByFamily && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <TreePine className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium text-muted-foreground">{groupName}</h3>
                          <Badge variant="secondary">{cards.length}</Badge>
                        </div>
                        {index > 0 && <Separator className="mb-4" />}
                      </>
                    )}
                    <div className="space-y-3">
                      {cards.map(renderCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Templates */}
        {availableTemplates.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" />
                Add New Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{template.name}</h3>
                        {template.type === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            {template.name === 'Organization' ? 'Organization' : 'Admin'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className={`ml-4 ${template.name === 'Organization' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      <Link to={`/cards/create/${template.id}`}>
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCardForSharing && (
          <GranularSharingDialog
            open={!!selectedCardForSharing}
            onOpenChange={(open) => !open && setSelectedCardForSharing(null)}
            card={{
              id: selectedCardForSharing.id,
              template: {
                name: selectedCardForSharing.template.name,
                fields: selectedCardForSharing.template.fields.map(field => ({
                  id: field.id,
                  field_name: field.field_name,
                  field_type: field.field_type
                }))
              },
              field_values: selectedCardForSharing.field_values.map(fv => {
                const field = selectedCardForSharing.template.fields.find(f => f.id === fv.template_field_id);
                return {
                  template_field_id: fv.template_field_id,
                  value: fv.value,
                  field_name: field?.field_name || '',
                  field_type: field?.field_type || 'string'
                };
              })
            }}
            onShare={handleGranularShare}
            isSharing={isSharing}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default MyCards;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Users, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MobileLayout from '@/components/MobileLayout';
import CardRelationships from '@/components/CardRelationships';
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
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardForSharing, setSelectedCardForSharing] = useState<string | null>(null);

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
        field_values: card.card_field_values || []
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
      // Fetch user templates
      const { data: userTemplates, error: userError } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          transaction_code
        `)
        .eq('type', 'user');

      if (userError) throw userError;

      // Check if user is admin and fetch admin templates if so
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin');
      let adminTemplates = [];

      if (isAdmin) {
        const { data: adminTemplateData, error: adminError } = await supabase
          .from('card_templates')
          .select(`
            id,
            name,
            description,
            type,
            transaction_code
          `)
          .eq('type', 'admin');

        if (!adminError) {
          adminTemplates = adminTemplateData || [];
        }
      }

      // Combine templates with fields array to match CardTemplate interface
      const allTemplates = [...(userTemplates || []), ...adminTemplates].map(template => ({
        ...template,
        fields: [] as TemplateField[]
      }));

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

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">My Cards</h1>
          <p className="text-muted-foreground">Manage your personal and professional cards</p>
        </div>

        {/* Available Templates */}
        {availableTemplates.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" />
                Create New Card
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

        {/* User Cards List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Cards ({userCards.length})
            </CardTitle>
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
              <div className="space-y-3">
                {userCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{getCardTitle(card)}</h3>
                      <p className="text-sm text-muted-foreground">{card.template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Code: {card.card_code}
                      </p>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Share Card: {getCardTitle(card)}</DialogTitle>
                          </DialogHeader>
                          <CardRelationships cardId={card.id} />
                        </DialogContent>
                      </Dialog>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MyCards;

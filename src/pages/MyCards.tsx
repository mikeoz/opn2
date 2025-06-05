import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Share2, Eye, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/components/ui/use-toast';

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'user';
  transaction_code: 'S' | 'N';
  created_by: string | null;
  fields?: Array<{
    id: string;
    field_name: string;
    field_type: 'string' | 'image' | 'document';
    is_required: boolean;
    display_order: number;
  }>;
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values?: Array<{
    template_field_id: string;
    value: string;
    field_name: string;
  }>;
}

const MyCards = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [adminTemplates, setAdminTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCards = async () => {
    if (!user) return;

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
            created_by
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cardsWithTemplates = data?.map(card => ({
        id: card.id,
        card_code: card.card_code,
        template: card.card_templates as CardTemplate,
        field_values: [] // Initialize as empty array
      })) || [];

      // Fetch field values for all cards to get Card Label and Service Name
      const cardsWithFieldValues = await Promise.all(
        cardsWithTemplates.map(async (card) => {
          const { data: fieldValues, error: valuesError } = await supabase
            .from('card_field_values')
            .select(`
              template_field_id,
              value,
              template_fields!inner (
                field_name
              )
            `)
            .eq('user_card_id', card.id);

          if (!valuesError && fieldValues) {
            card.field_values = fieldValues.map(fv => ({
              template_field_id: fv.template_field_id,
              value: fv.value || '',
              field_name: fv.template_fields.field_name
            }));
          }
          return card;
        })
      );

      setUserCards(cardsWithFieldValues);
    } catch (error) {
      console.error('Error fetching user cards:', error);
      toast({
        title: "Error loading cards",
        description: "Failed to load your cards. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAdminTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          transaction_code,
          created_by,
          template_fields (
            id,
            field_name,
            field_type,
            is_required,
            display_order
          )
        `)
        .eq('type', 'admin')
        .order('name');

      if (error) throw error;

      setAdminTemplates(data || []);
    } catch (error) {
      console.error('Error fetching admin templates:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserCards(),
        fetchAdminTemplates()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const addCardFromTemplate = async (templateId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_cards')
        .insert({
          user_id: user.id,
          template_id: templateId,
          card_code: await generateCardCode()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Card added successfully!",
        description: "The card has been added to your collection.",
      });

      fetchUserCards(); // Refresh the list
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: "Error adding card",
        description: "Failed to add the card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateCardCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_card_code');
    if (error) throw error;
    return data;
  };

  const getCardTitle = (card: UserCard) => {
    console.log('Getting card title for card:', card.id);
    console.log('Field values:', card.field_values);
    
    // First priority: Card Label field
    if (card.field_values) {
      const cardLabelValue = card.field_values.find(fv => 
        fv.field_name && fv.field_name.toLowerCase().includes('card label')
      );
      console.log('Card Label value found:', cardLabelValue);
      if (cardLabelValue && cardLabelValue.value && cardLabelValue.value.trim()) {
        return cardLabelValue.value.trim();
      }
      
      // Second priority: For Social Media Profile, use Service Name
      if (card.template.name === 'Social Media Profile') {
        const serviceNameValue = card.field_values.find(fv => 
          fv.field_name && fv.field_name.toLowerCase().includes('service name')
        );
        console.log('Service Name value found:', serviceNameValue);
        if (serviceNameValue && serviceNameValue.value && serviceNameValue.value.trim()) {
          return serviceNameValue.value.trim();
        }
      }
    }
    
    // Fallback: Use template name
    console.log('Using fallback template name:', card.template.name);
    return card.template.name;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Loading your cards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My CARDs</h1>
            <p className="text-gray-600">Manage your information cards</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/cards/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Card
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild>
                <Link to="/admin/cards">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Templates
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Available AdminCARDs Section */}
        {adminTemplates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available AdminCARDs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge variant="default">Admin</Badge>
                        <Badge variant={template.transaction_code === 'S' ? 'default' : 'destructive'}>
                          {template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {template.fields?.map((field) => (
                        <div key={field.id} className="flex justify-between text-sm">
                          <span className="font-medium">{field.field_name}</span>
                          <span className="text-gray-500 capitalize">{field.field_type}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      asChild
                      className="w-full"
                      size="sm"
                    >
                      <Link to={`/cards/create/${template.id}`}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create Card
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Cards Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Cards</h2>
          {userCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCards.map((card) => (
                <Card key={card.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{getCardTitle(card)}</CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge variant={card.template.type === 'admin' ? 'default' : 'secondary'}>
                          {card.template.type === 'admin' ? 'Admin' : 'Custom'}
                        </Badge>
                        <Badge variant={card.template.transaction_code === 'S' ? 'default' : 'destructive'}>
                          {card.template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to={`/cards/view/${card.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {card.template.transaction_code === 'S' && (
                        <Button size="sm" className="flex-1" asChild>
                          <Link to={`/cards/share/${card.id}`}>
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating cards from the available templates above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCards;

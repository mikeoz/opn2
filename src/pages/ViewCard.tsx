
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Image, Upload, Edit, Share2 } from 'lucide-react';
import { getCardTitle } from '@/utils/cardUtils';
import CardRelationships from '@/components/CardRelationships';
import BrandedCardDisplay from '@/components/BrandedCardDisplay';
import GranularSharingDialog from '@/components/GranularSharingDialog';

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
  type: 'admin' | 'user';
  transaction_code: 'S' | 'N';
  fields: TemplateField[];
}

interface FieldValue {
  template_field_id: string;
  value: string;
  field_name: string;
  field_type: string;
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values: FieldValue[];
}

const ViewCard = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [card, setCard] = useState<UserCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGranularSharing, setShowGranularSharing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    if (!cardId) {
      console.log('No card ID provided');
      toast({
        title: "Missing card ID",
        description: "No card specified for viewing.",
        variant: "destructive",
      });
      navigate('/cards');
      return;
    }

    console.log('Fetching card with ID:', cardId);
    fetchCard(cardId);
  }, [cardId, user, navigate, toast]);

  const fetchCard = async (cardId: string) => {
    try {
      console.log('Starting card fetch for ID:', cardId);
      
      // Fetch the user card with template
      const { data: cardData, error: cardError } = await supabase
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
          )
        `)
        .eq('id', cardId)
        .eq('user_id', user!.id)
        .maybeSingle();

      console.log('Card data query result:', { cardData, cardError });

      if (cardError) {
        console.error('Database error fetching card:', cardError);
        throw new Error(`Database error: ${cardError.message}`);
      }

      if (!cardData) {
        console.log('Card not found or access denied');
        throw new Error('Card not found or access denied');
      }

      // Fetch field values
      const { data: fieldValues, error: valuesError } = await supabase
        .from('card_field_values')
        .select(`
          template_field_id,
          value,
          template_fields!inner (
            field_name,
            field_type
          )
        `)
        .eq('user_card_id', cardId);

      console.log('Field values query result:', { fieldValues, valuesError });

      if (valuesError) {
        console.warn('Error fetching field values:', valuesError);
      }

      const template = cardData.card_templates as CardTemplate & {
        template_fields: TemplateField[];
      };

      setCard({
        id: cardData.id,
        card_code: cardData.card_code,
        template: {
          ...template,
          fields: template.template_fields || []
        },
        field_values: fieldValues?.map(fv => ({
          template_field_id: fv.template_field_id,
          value: fv.value || '',
          field_name: fv.template_fields.field_name,
          field_type: fv.template_fields.field_type
        })) || []
      });
    } catch (error) {
      console.error('Error fetching card:', error);
      toast({
        title: "Error loading card",
        description: "Failed to load the card. Please try again.",
        variant: "destructive",
      });
      navigate('/cards');
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (fieldId: string) => {
    const fieldValue = card?.field_values.find(fv => fv.template_field_id === fieldId);
    return fieldValue?.value || '';
  };

  const handleEdit = () => {
    navigate(`/cards/edit/${cardId}`);
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
      
      setShowGranularSharing(false);
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

  const renderFieldValue = (field: TemplateField) => {
    const value = getFieldValue(field.id);
    
    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center gap-2">
          {field.field_type === 'string' && <FileText className="h-4 w-4 text-gray-500" />}
          {field.field_type === 'image' && <Image className="h-4 w-4 text-gray-500" />}
          {field.field_type === 'document' && <Upload className="h-4 w-4 text-gray-500" />}
          <span className="font-medium text-gray-700">{field.field_name}:</span>
        </div>
        <div className="pl-6">
          {field.field_type === 'string' ? (
            <p className="text-gray-900">{value || 'Not provided'}</p>
          ) : (
            <div className="text-gray-600">
              {value ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {value}
                </a>
              ) : (
                'Not provided'
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Loading card...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Card not found</div>
      </div>
    );
  }

  const sortedFields = card.template.fields.sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/cards')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cards
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGranularSharing(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Card
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Card
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BrandedCardDisplay 
              card={card} 
              cardType={card.template.name}
            />
          </div>

          <div>
            {card.template.transaction_code === 'S' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Card Relationships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-4">
                    Relationships will be shown here once sharing is implemented
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {card && (
          <GranularSharingDialog
            open={showGranularSharing}
            onOpenChange={setShowGranularSharing}
            card={card}
            onShare={handleGranularShare}
            isSharing={isSharing}
          />
        )}
      </div>
    </div>
  );
};

export default ViewCard;

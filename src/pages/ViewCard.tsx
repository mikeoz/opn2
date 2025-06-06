import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Image, Upload, Edit } from 'lucide-react';
import { getCardTitle } from '@/utils/cardUtils';
import CardRelationships from '@/components/CardRelationships';

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!cardId) {
      toast({
        title: "Missing card ID",
        description: "No card specified for viewing.",
        variant: "destructive",
      });
      navigate('/cards');
      return;
    }

    fetchCard(cardId);
  }, [cardId, user, navigate, toast]);

  const fetchCard = async (cardId: string) => {
    try {
      console.log('Fetching card with ID:', cardId);
      
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

      if (cardError || !cardData) {
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
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Card
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{getCardTitle(card)}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Card Type: {card.template.name}</p>
                    {card.template.description && (
                      <p className="text-gray-600 mt-1">{card.template.description}</p>
                    )}
                  </div>
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
                <div className="space-y-6">
                  {sortedFields.map(renderFieldValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {card.template.transaction_code === 'S' && (
              <CardRelationships cardId={card.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCard;

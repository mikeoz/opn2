
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CardForm from '@/components/CardForm';

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
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values: FieldValue[];
}

const EditCard = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [card, setCard] = useState<UserCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cardId && user) {
      fetchCard(cardId);
    }
  }, [cardId, user]);

  const fetchCard = async (cardId: string) => {
    try {
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
        .single();

      if (cardError) throw cardError;

      // Fetch field values
      const { data: fieldValues, error: valuesError } = await supabase
        .from('card_field_values')
        .select('template_field_id, value')
        .eq('user_card_id', cardId);

      if (valuesError) throw valuesError;

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
        field_values: fieldValues || []
      });
    } catch (error) {
      console.error('Error fetching card:', error);
      toast({
        title: "Error loading card",
        description: "Failed to load the card for editing. Please try again.",
        variant: "destructive",
      });
      navigate('/cards');
    } finally {
      setLoading(false);
    }
  };

  const getCardTitle = () => {
    if (!card) return '';
    
    console.log('EditCard - Getting card title for card:', card.id);
    console.log('EditCard - Field values:', card.field_values);
    console.log('EditCard - Template name:', card.template.name);
    
    // First priority: Look for Card Label field value
    if (card.field_values && card.field_values.length > 0) {
      const cardLabelValue = card.field_values.find(fv => {
        // Find the field in template that matches this field value
        const templateField = card.template.fields.find(f => f.id === fv.template_field_id);
        return templateField && templateField.field_name.toLowerCase().includes('card label');
      });
      console.log('EditCard - Card Label value found:', cardLabelValue);
      
      if (cardLabelValue && cardLabelValue.value && cardLabelValue.value.trim()) {
        console.log('EditCard - Using Card Label value:', cardLabelValue.value.trim());
        return cardLabelValue.value.trim();
      }
      
      // Second priority: For Social Media Profile, use Service Name
      if (card.template.name === 'Social Media Profile') {
        const serviceNameValue = card.field_values.find(fv => {
          const templateField = card.template.fields.find(f => f.id === fv.template_field_id);
          return templateField && templateField.field_name.toLowerCase().includes('service name');
        });
        console.log('EditCard - Service Name value found:', serviceNameValue);
        if (serviceNameValue && serviceNameValue.value && serviceNameValue.value.trim()) {
          console.log('EditCard - Using Service Name value:', serviceNameValue.value.trim());
          return serviceNameValue.value.trim();
        }
      }
    }
    
    // Fallback: Use template name
    console.log('EditCard - Using fallback template name:', card.template.name);
    return card.template.name;
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!card) return;

    try {
      // Update or insert field values
      for (const field of card.template.fields) {
        const fieldKey = `field_${field.id}`;
        const value = formData[fieldKey] || '';

        // Check if field value exists
        const existingValue = card.field_values.find(fv => fv.template_field_id === field.id);

        if (existingValue) {
          // Update existing value
          const { error } = await supabase
            .from('card_field_values')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('user_card_id', card.id)
            .eq('template_field_id', field.id);

          if (error) throw error;
        } else {
          // Insert new value
          const { error } = await supabase
            .from('card_field_values')
            .insert({
              user_card_id: card.id,
              template_field_id: field.id,
              value
            });

          if (error) throw error;
        }
      }

      // Show success message with appropriate title
      const cardTitle = getCardTitle();
      const displayTitle = cardTitle !== card.template.name ? cardTitle : card.template.name;

      toast({
        title: "Card updated successfully!",
        description: `Your "${displayTitle}" card has been updated.`,
      });

      navigate(`/cards/view/${card.id}`);
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
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

  // Convert field values to initial values format
  const initialValues = card.field_values.reduce((acc, fv) => {
    acc[fv.template_field_id] = fv.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Card</h1>
          <p className="text-gray-600">Editing: {getCardTitle()}</p>
          <p className="text-sm text-gray-500">Card Type: {card.template.name}</p>
        </div>

        <CardForm
          template={card.template}
          onSubmit={handleSubmit}
          initialValues={initialValues}
          isEditing={true}
        />
      </div>
    </div>
  );
};

export default EditCard;

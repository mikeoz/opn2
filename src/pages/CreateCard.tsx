
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
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

const CreateCard = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<CardTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else {
      // If no templateId, redirect to cards page
      navigate('/cards');
    }
  }, [templateId, navigate]);

  const fetchTemplate = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select(`
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
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;

      setTemplate({
        ...data,
        fields: data.template_fields || []
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error loading template",
        description: "Failed to load the card template. Please try again.",
        variant: "destructive",
      });
      navigate('/cards');
    } finally {
      setLoading(false);
    }
  };

  const generateCardCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_card_code');
    if (error) throw error;
    return data;
  };

  const handleCreateCard = async (formData: Record<string, any>) => {
    if (!user || !template) return;

    try {
      // Create the user card first
      const cardCode = await generateCardCode();
      const { data: userCard, error: cardError } = await supabase
        .from('user_cards')
        .insert({
          user_id: user.id,
          template_id: template.id,
          card_code: cardCode
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Save field values
      const fieldValues = template.fields.map(field => ({
        user_card_id: userCard.id,
        template_field_id: field.id,
        value: formData[`field_${field.id}`] || ''
      }));

      if (fieldValues.length > 0) {
        const { error: valuesError } = await supabase
          .from('card_field_values')
          .insert(fieldValues);

        if (valuesError) throw valuesError;
      }

      // Show success message with the card label if provided
      const cardLabelField = template.fields.find(f => f.field_name.toLowerCase().includes('card label'));
      const cardLabel = cardLabelField ? formData[`field_${cardLabelField.id}`] : '';
      const displayName = cardLabel && cardLabel.trim() ? cardLabel.trim() : template.name;

      toast({
        title: "Card created successfully!",
        description: `Your "${displayName}" card has been created.`,
      });

      navigate('/cards');
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Template not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Card</h1>
          <p className="text-gray-600">Creating: {template.name}</p>
        </div>

        <CardForm
          template={template}
          onSubmit={handleCreateCard}
          isEditing={false}
        />
      </div>
    </div>
  );
};

export default CreateCard;

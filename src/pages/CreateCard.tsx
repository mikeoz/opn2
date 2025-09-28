
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CardForm from '@/components/CardForm';
import { createCardFromStandardTemplate } from '@/utils/standardTemplateUtils';

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

const CreateCard = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<CardTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    if (!templateId) {
      console.log('No template ID provided');
      toast({
        title: "Missing template ID",
        description: "No template specified for card creation.",
        variant: "destructive",
      });
      navigate('/cards');
      return;
    }

    console.log('Fetching template with ID:', templateId);
    fetchTemplate(templateId);
  }, [templateId, user, navigate, toast]);

  const fetchTemplate = async (templateId: string) => {
    try {
      console.log('Starting template fetch for ID:', templateId);
      
      // First try to get it as a regular card template
      const { data: regularTemplate, error: regularError } = await supabase
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
        .maybeSingle();

      console.log('Regular template query result:', { regularTemplate, regularError });

      if (!regularError && regularTemplate) {
        console.log('Found regular template, setting up...');
        setTemplate({
          ...regularTemplate,
          fields: regularTemplate.template_fields || []
        });
        setLoading(false);
        return;
      }

      console.log('Regular template not found, checking standard templates...');
      
      // If not found, check if it's a standard template and create a card template from it
      const { data: standardTemplate, error: standardError } = await supabase
        .from('standard_card_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      console.log('Standard template query result:', { standardTemplate, standardError });

      if (standardError || !standardTemplate) {
        console.log('Template not found in either table');
        throw new Error('Template not found in either regular or standard templates');
      }

      console.log('Found standard template, creating card template...');
      // Create a card template from the standard template
      const newTemplateId = await createCardFromStandardTemplate(templateId, user!.id);
      console.log('Created new template ID:', newTemplateId);
      
      // Now fetch the newly created template
      const { data: newTemplate, error: newError } = await supabase
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
        .eq('id', newTemplateId)
        .single();

      console.log('New template query result:', { newTemplate, newError });

      if (newError) {
        console.error('Error fetching newly created template:', newError);
        throw newError;
      }

      setTemplate({
        ...newTemplate,
        fields: newTemplate.template_fields || []
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
      const cardCode = await generateCardCode();
      const familyContext = formData.familyContext;
      
      const { data: userCard, error: cardError } = await supabase
        .from('user_cards')
        .insert({
          user_id: user.id,
          template_id: template.id,
          card_code: cardCode,
          family_unit_id: familyContext?.familyUnitId || null,
          family_role: familyContext?.familyRole || null,
          generation_level: familyContext?.generationLevel || 1
        })
        .select()
        .single();

      if (cardError) throw cardError;

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
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Card</h1>
          <p className="text-gray-600">Creating: {template.name}</p>
        </div>

        <div className="pb-8">
          <CardForm
            template={template}
            onSubmit={handleCreateCard}
            isEditing={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateCard;

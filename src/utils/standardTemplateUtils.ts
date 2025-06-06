
import { supabase } from '@/integrations/supabase/client';

export interface StandardCardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: {
    fields: Array<{
      name: string;
      type: 'string' | 'image' | 'document';
      required: boolean;
      order: number;
    }>;
  };
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchStandardTemplates = async (): Promise<StandardCardTemplate[]> => {
  const { data, error } = await supabase
    .from('standard_card_templates')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(template => ({
    ...template,
    template_data: template.template_data as StandardCardTemplate['template_data']
  }));
};

export const getTemplatesByCategory = (templates: StandardCardTemplate[]) => {
  return templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, StandardCardTemplate[]>);
};

export const createCardFromStandardTemplate = async (
  templateId: string,
  userId: string
): Promise<string> => {
  // Get the standard template
  const { data: standardTemplate, error: templateError } = await supabase
    .from('standard_card_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  // Create a new card template based on the standard template
  const { data: cardTemplate, error: cardTemplateError } = await supabase
    .from('card_templates')
    .insert({
      name: standardTemplate.name,
      description: standardTemplate.description,
      type: 'user',
      transaction_code: 'S',
      created_by: userId
    })
    .select()
    .single();

  if (cardTemplateError) throw cardTemplateError;

  // Create template fields
  const templateData = standardTemplate.template_data as StandardCardTemplate['template_data'];
  const fields = templateData.fields.map((field: any) => ({
    template_id: cardTemplate.id,
    field_name: field.name,
    field_type: field.type,
    is_required: field.required,
    display_order: field.order
  }));

  const { error: fieldsError } = await supabase
    .from('template_fields')
    .insert(fields);

  if (fieldsError) throw fieldsError;

  return cardTemplate.id;
};

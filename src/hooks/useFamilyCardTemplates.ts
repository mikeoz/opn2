import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FamilyCardTemplate {
  id: string;
  template_name: string;
  relationship_context: string;
  generation_applicable: string[];
  template_fields: any; // Supabase Json type
  display_config: any; // Supabase Json type
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ParsedTemplateField {
  name: string;
  type: string;
  required: boolean;
}

export const useFamilyCardTemplates = () => {
  const [templates, setTemplates] = useState<FamilyCardTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_card_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data as FamilyCardTemplate[] || []);
    } catch (error) {
      console.error('Error fetching family card templates:', error);
      toast.error('Failed to load family card templates');
    } finally {
      setLoading(false);
    }
  };

  const getTemplatesForContext = (context: string, generation?: string) => {
    return templates.filter(template => {
      const contextMatch = template.relationship_context === context || 
                          template.relationship_context === 'general_family';
      const generationMatch = template.generation_applicable.includes('all') ||
                             (generation && template.generation_applicable.includes(generation));
      return contextMatch && generationMatch;
    });
  };

  const getTemplateById = (templateId: string) => {
    return templates.find(template => template.id === templateId);
  };

  const parseTemplateFields = (template: FamilyCardTemplate): ParsedTemplateField[] => {
    try {
      return Array.isArray(template.template_fields) 
        ? template.template_fields as ParsedTemplateField[]
        : JSON.parse(template.template_fields as string);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    getTemplatesForContext,
    getTemplateById,
    parseTemplateFields,
    refetch: fetchTemplates
  };
};
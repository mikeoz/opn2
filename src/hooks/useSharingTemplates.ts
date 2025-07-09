import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SharingTemplate {
  id: string;
  name: string;
  description?: string;
  template_permissions: Record<string, any>;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useSharingTemplates = () => {
  const [templates, setTemplates] = useState<SharingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sharing_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates((data || []).map(item => ({
        ...item,
        template_permissions: item.template_permissions as Record<string, any> || {}
      })));
    } catch (error) {
      console.error('Error fetching sharing templates:', error);
      toast.error('Failed to load sharing templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (
    name: string,
    description: string,
    templatePermissions: Record<string, any>,
    isPublic: boolean = false
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('sharing_templates')
        .insert({
          name,
          description,
          template_permissions: templatePermissions,
          is_public: isPublic,
          created_by: user.id,
        });

      if (error) throw error;
      
      toast.success('Sharing template created successfully');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create sharing template');
      return false;
    }
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<SharingTemplate>
  ) => {
    try {
      const { error } = await supabase
        .from('sharing_templates')
        .update(updates)
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Template updated successfully');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      return false;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('sharing_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Template deleted successfully');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      return false;
    }
  };

  const getTemplateById = (templateId: string) => {
    return templates.find(template => template.id === templateId);
  };

  const getPublicTemplates = () => {
    return templates.filter(template => template.is_public);
  };

  const getUserTemplates = () => {
    return templates.filter(template => template.created_by === user?.id);
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    getPublicTemplates,
    getUserTemplates,
    refetch: fetchTemplates
  };
};
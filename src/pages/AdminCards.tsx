import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import StandardTemplateLibrary from '@/components/StandardTemplateLibrary';
import MobileLayout from '@/components/MobileLayout';

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
  template_fields: TemplateField[];
  field_count?: number;
}

const AdminCards = () => {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    if (!isAdmin && !roleLoading) {
      console.log('User is not an admin, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    console.log('Fetching admin card templates');
    fetchTemplates();
  }, [user, isAdmin, roleLoading, navigate]);

  const fetchTemplates = async () => {
    setLoading(true);
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
            id
          )
        `)
        .eq('type', 'admin');

      if (error) throw error;

      const templatesWithFieldCount = data.map(template => ({
        ...template,
        field_count: template.template_fields.length
      }));

      setTemplates(templatesWithFieldCount);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load the card templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('card_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "The card template has been successfully deleted.",
      });

      fetchTemplates(); // Refresh templates
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error deleting template",
        description: "Failed to delete the card template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateCreated = () => {
    setShowTemplateLibrary(false);
    fetchTemplates();
  };

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Card Management</h1>
          <p className="text-muted-foreground">Manage card templates and system configuration</p>
        </div>

        {/* Create Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Create New Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowTemplateLibrary(true)}
              className="w-full bg-accent hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Admin Template
            </Button>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Active Templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading templates...</div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates created yet.</p>
                <p className="text-sm">Create your first template to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Type: {template.type}</span>
                          <span>Code: {template.transaction_code}</span>
                          <span>Fields: {template.field_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <StandardTemplateLibrary
                onTemplateCreated={handleTemplateCreated}
                onClose={() => setShowTemplateLibrary(false)}
              />
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default AdminCards;

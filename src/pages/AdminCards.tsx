
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
import { BulkImportManager } from '@/components/BulkImportManager';
import OrganizationManagement from '@/components/OrganizationManagement';

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
  const [userProfile, setUserProfile] = useState<any>(null);
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

    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin && !roleLoading) {
      console.log('User is not an admin, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    if (isAdmin && userProfile) {
      console.log('Fetching admin card templates');
      fetchTemplates();
    }
  }, [isAdmin, roleLoading, userProfile, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_type, organization_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load user profile information.",
        variant: "destructive",
      });
    }
  };

  const canCreateTemplates = () => {
    return isAdmin && userProfile?.account_type === 'non_individual';
  };

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
            id,
            field_name,
            field_type,
            is_required,
            display_order
          )
        `)
        .eq('type', 'admin');

      if (error) throw error;

      const templatesWithFieldCount = data.map(template => ({
        ...template,
        template_fields: template.template_fields || [],
        field_count: template.template_fields?.length || 0
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

        {/* Create Template - Only for Non-Individual Admin Users */}
        {canCreateTemplates() && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" />
                Create CARD Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create new card templates that can be shared with other users.
              </p>
              <Button 
                onClick={() => setShowTemplateLibrary(true)}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Admin Template
              </Button>
            </CardContent>
          </Card>
        )}

        {!canCreateTemplates() && isAdmin && userProfile?.account_type === 'individual' && (
          <Card className="mb-6 border-muted">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Template creation is only available for Organization accounts.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Import Manager - Only for Non-Individual Admin Users */}
        {canCreateTemplates() && (
          <div className="mb-6">
            <BulkImportManager />
          </div>
        )}

        {/* Organization Management - Only for Non-Individual Admin Users */}
        {canCreateTemplates() && (
          <div className="mb-6">
            <OrganizationManagement />
          </div>
        )}
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
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Create CARD Template</h2>
                  <Button variant="ghost" onClick={() => setShowTemplateLibrary(false)}>
                    ×
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Template creation interface coming soon</p>
                  <Button 
                    onClick={handleTemplateCreated}
                    className="mt-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default AdminCards;

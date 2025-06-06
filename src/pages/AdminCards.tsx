
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/components/ui/use-toast';

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'user' | 'access' | 'participant' | 'transaction';
  transaction_code: 'S' | 'N';
  created_by: string | null;
  fields: Array<{
    id: string;
    field_name: string;
    field_type: 'string' | 'image' | 'document';
    is_required: boolean;
    display_order: number;
  }>;
}

const AdminCards = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (isAdmin) {
      fetchTemplates();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          transaction_code,
          created_by,
          template_fields (
            id,
            field_name,
            field_type,
            is_required,
            display_order
          )
        `)
        .order('type')
        .order('name');

      if (error) throw error;

      const templatesWithFields = data?.map(template => ({
        ...template,
        fields: template.template_fields?.sort((a, b) => a.display_order - b.display_order) || []
      })) || [];

      setTemplates(templatesWithFields);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load card templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin: Manage Card Templates</h1>
              <p className="text-gray-600">Create and manage adminCARDs and user templates</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/admin/cards/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </Button>
        </div>

        {/* Admin Templates */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AdminCARDs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter(template => template.type === 'admin')
              .map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge variant="default">Admin</Badge>
                        <Badge variant={template.transaction_code === 'S' ? 'default' : 'destructive'}>
                          {template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-sm">Fields:</h4>
                      {template.fields.map((field) => (
                        <div key={field.id} className="flex justify-between text-sm">
                          <span className="font-medium">{field.field_name}</span>
                          <div className="flex gap-2">
                            <span className="text-gray-500 capitalize">{field.field_type}</span>
                            {field.is_required && <span className="text-red-500">*</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* User Templates */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Templates</h2>
          {templates.filter(template => template.type === 'user').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter(template => template.type === 'user')
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">User</Badge>
                          <Badge variant={template.transaction_code === 'S' ? 'default' : 'destructive'}>
                            {template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <h4 className="font-medium text-sm">Fields:</h4>
                        {template.fields.map((field) => (
                          <div key={field.id} className="flex justify-between text-sm">
                            <span className="font-medium">{field.field_name}</span>
                            <div className="flex gap-2">
                              <span className="text-gray-500 capitalize">{field.field_type}</span>
                              {field.is_required && <span className="text-red-500">*</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No user templates yet</h3>
              <p className="text-gray-500">User-created templates will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCards;

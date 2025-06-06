
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Library, Plus, FileText, Image, Upload } from 'lucide-react';
import { StandardCardTemplate, fetchStandardTemplates, getTemplatesByCategory, createCardFromStandardTemplate } from '@/utils/standardTemplateUtils';

const StandardTemplateLibrary: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<StandardCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<StandardCardTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await fetchStandardTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load standard templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: StandardCardTemplate) => {
    if (!user) return;

    setCreating(true);
    try {
      const templateId = await createCardFromStandardTemplate(template.id, user.id);
      
      toast({
        title: "Template created!",
        description: `${template.name} template has been added to your templates.`,
      });

      navigate(`/cards/create/${templateId}`);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const renderFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'string':
        return <FileText className="h-3 w-3" />;
      case 'image':
        return <Image className="h-3 w-3" />;
      case 'document':
        return <Upload className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  if (loading) return <div>Loading standard templates...</div>;

  const categorizedTemplates = getTemplatesByCategory(templates);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Library className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Standard Card Library</h2>
      </div>

      {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold capitalize">{category} Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Fields ({template.template_data.fields.length}):</p>
                      <div className="space-y-1">
                        {template.template_data.fields.slice(0, 3).map((field, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {renderFieldIcon(field.type)}
                            <span className={field.required ? 'font-medium' : ''}>
                              {field.name} {field.required && '*'}
                            </span>
                          </div>
                        ))}
                        {template.template_data.fields.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{template.template_data.fields.length - 3} more fields
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{template.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div>
                              <p className="font-medium mb-2">All Fields:</p>
                              <div className="space-y-2">
                                {template.template_data.fields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      {renderFieldIcon(field.type)}
                                      <span>{field.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {field.type}
                                      </Badge>
                                      {field.required && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCreateFromTemplate(template)}
                        disabled={creating}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {creating ? 'Creating...' : 'Use Template'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Library className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No standard templates available</h3>
          <p className="text-gray-500">Standard card templates will appear here when available.</p>
        </div>
      )}
    </div>
  );
};

export default StandardTemplateLibrary;

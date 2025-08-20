
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Library, Plus, FileText, Image, Upload, Heart, Eye, Download, Filter, Star } from 'lucide-react';
import { StandardCardTemplate, fetchStandardTemplates, getTemplatesByCategory, createCardFromStandardTemplate } from '@/utils/standardTemplateUtils';
import { useTemplateFavorites } from '@/hooks/useTemplateFavorites';
import TemplateCustomizationToggle from '@/components/TemplateCustomizationToggle';

const StandardTemplateLibrary: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorited } = useTemplateFavorites();
  const [templates, setTemplates] = useState<StandardCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<StandardCardTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'catalog' | 'favorites'>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const filteredTemplates = templates.filter(template => {
    if (viewMode === 'favorites' && !isFavorited(template.id)) return false;
    if (categoryFilter !== 'all' && template.category !== categoryFilter) return false;
    return true;
  });

  const categorizedTemplates = getTemplatesByCategory(filteredTemplates);
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const downloadTemplate = (template: StandardCardTemplate) => {
    const csvContent = [
      // Header row
      template.template_data.fields.map(field => field.name).join(','),
      // Example row with placeholder data
      template.template_data.fields.map(field => {
        switch (field.type) {
          case 'string': return `"Example ${field.name}"`;
          case 'image': return '"image_url_here"';
          case 'document': return '"document_url_here"';
          default: return '""';
        }
      }).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dateStamp = new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/\s/g, '').toUpperCase();
    
    a.download = `${template.name.replace(/\s+/g, '')}Template_${dateStamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: `${template.name} template has been downloaded as CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6" />
          <h2 className="text-2xl font-bold">
            {viewMode === 'catalog' ? 'CARD Catalog' : 'My Favorites'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'catalog' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('catalog')}
          >
            <Library className="h-4 w-4 mr-1" />
            Catalog
          </Button>
          <Button
            variant={viewMode === 'favorites' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('favorites')}
          >
            <Heart className="h-4 w-4 mr-1" />
            Favorites
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <Badge variant="secondary">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold capitalize">{category} Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(template.id)}
                          className="p-1 h-auto"
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              isFavorited(template.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-400 hover:text-red-500'
                            }`} 
                          />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <TemplateCustomizationToggle template={template} />
                      </div>
                    </div>
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
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {template.name}
                              <Badge variant="outline">{template.category}</Badge>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <p className="text-sm text-gray-600">{template.description}</p>
                            
                            <TemplateCustomizationToggle template={template} showDetails />
                            
                            <div>
                              <p className="font-medium mb-3">Template Fields ({template.template_data.fields.length}):</p>
                              <div className="space-y-3">
                                {template.template_data.fields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {renderFieldIcon(field.type)}
                                      <div>
                                        <span className="font-medium">{field.name}</span>
                                        <p className="text-xs text-gray-500">Order: {field.order}</p>
                                      </div>
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

                            <div className="flex gap-2 pt-4 border-t">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => downloadTemplate(template)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download CSV
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  handleCreateFromTemplate(template);
                                  setSelectedTemplate(null);
                                }}
                                disabled={creating}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {creating ? 'Creating...' : 'Use Template'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate(template)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      
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

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          {viewMode === 'favorites' ? (
            <>
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite templates</h3>
              <p className="text-gray-500">
                Templates you favorite from the catalog will appear here.
              </p>
            </>
          ) : (
            <>
              <Library className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {categoryFilter === 'all' 
                  ? 'No standard templates available' 
                  : `No ${categoryFilter} templates found`
                }
              </h3>
              <p className="text-gray-500">
                {categoryFilter === 'all'
                  ? 'Standard card templates will appear here when available.'
                  : 'Try selecting a different category or view all templates.'
                }
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StandardTemplateLibrary;

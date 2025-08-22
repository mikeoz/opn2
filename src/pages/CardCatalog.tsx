import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, Plus, Clock, Tag, FileText, Users, Store, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchStandardTemplates, getTemplatesByCategory } from '@/utils/standardTemplateUtils';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/MobileLayout';

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'user' | 'access' | 'participant' | 'transaction' | 'standard' | 'family' | 'merchant';
  category?: string;
  template_fields?: any[];
  template_data?: any;
  version?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

const CardCatalog = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [standardTemplates, setStandardTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);

  useEffect(() => {
    fetchAllTemplates();
  }, []);

  const fetchAllTemplates = async () => {
    try {
      setLoading(true);
      
      // Fetch admin/user templates - simplified query without is_active
      const { data: cardTemplates, error: cardError } = await supabase
        .from('card_templates')
        .select('id, name, description, type, created_at, updated_at')
        .order('type')
        .order('name');

      if (cardError) {
        console.error('Card templates error:', cardError);
      }

      // Fetch standard templates
      const standardTemplateData = await fetchStandardTemplates();

      const formattedCardTemplates = (cardTemplates || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        category: t.type,
        template_fields: [],
        version: '1.0',
        is_active: true,
        created_at: t.created_at,
        updated_at: t.updated_at
      }));

      setTemplates(formattedCardTemplates);
      setStandardTemplates(standardTemplateData || []);

    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (type: string, category?: string) => {
    switch (type) {
      case 'admin': return <Settings className="h-4 w-4" />;
      case 'standard': return <FileText className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'family': return 'bg-purple-100 text-purple-800';
      case 'merchant': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = [...templates, ...standardTemplates.map(t => ({ ...t, type: 'standard' as const }))]
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             template.type === selectedCategory || 
                             template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'admin', label: 'Admin Templates' },
    { value: 'standard', label: 'Standard Templates' },
    { value: 'user', label: 'User Templates' },
    { value: 'family', label: 'Family Templates' },
    { value: 'merchant', label: 'Merchant Templates' }
  ];

  const renderTemplatePreview = (template: CardTemplate) => {
    const fields = template.template_fields || template.template_data?.fields || [];
    
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => setSelectedTemplate(template)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getTemplateIcon(template.type, template.category)}
              <CardTitle className="text-base">{template.name}</CardTitle>
            </div>
            <Badge className={getTemplateTypeColor(template.type)}>
              {template.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {template.description || 'No description available'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {fields.length} fields
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {template.version || 'v1.0'}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedTemplate(template)}>
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            {template.type !== 'admin' && (
              <Button size="sm" asChild className="flex-1">
                <Link to={`/cards/create/${template.id}`}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTemplateDetail = (template: CardTemplate) => {
    const fields = template.template_fields || template.template_data?.fields || [];
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTemplateIcon(template.type, template.category)}
              <div>
                <CardTitle>{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {template.category || template.type} • Version {template.version || '1.0'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">
              {template.description || 'No description available'}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Field Structure ({fields.length} fields)</h3>
            <div className="space-y-2">
              {fields.map((field: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium text-sm">{field.field_name || field.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({field.field_type || field.type})
                    </span>
                  </div>
                  {(field.is_required || field.required) && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Usage Guidelines</h3>
            <p className="text-sm text-muted-foreground">
              This template can be used to create cards for {template.type} purposes. 
              {template.type === 'family' && ' Ideal for family relationship tracking and multi-generational connections.'}
              {template.type === 'merchant' && ' Perfect for merchant profiles and customer engagement.'}
              {template.type === 'standard' && ' A standardized template with predefined field structure.'}
            </p>
          </div>

          {template.type !== 'admin' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button asChild className="flex-1">
                <Link to={`/cards/create/${template.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Card from Template
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="text-center py-8">
            <p>Loading CARD catalog...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CARD Catalog
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Browse and preview all available CARD types in the system
            </p>
          </CardHeader>
        </Card>

        {selectedTemplate ? (
          renderTemplateDetail(selectedTemplate)
        ) : (
          <>
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Template Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Available Templates ({filteredTemplates.length})
                </h2>
              </div>
              
              {filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No templates found matching your criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id}>
                      {renderTemplatePreview(template)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default CardCatalog;
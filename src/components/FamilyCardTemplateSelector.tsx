import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TreePine, Users, Crown, ArrowRight } from 'lucide-react';
import { useFamilyCardTemplates, FamilyCardTemplate } from '@/hooks/useFamilyCardTemplates';

interface FamilyCardTemplateSelectorProps {
  familyUnitId?: string;
  familyRole?: string;
  generationLevel?: string;
  onSelectTemplate: (template: FamilyCardTemplate) => void;
}

const FamilyCardTemplateSelector: React.FC<FamilyCardTemplateSelectorProps> = ({
  familyUnitId,
  familyRole,
  generationLevel,
  onSelectTemplate
}) => {
  const { getTemplatesForContext, parseTemplateFields } = useFamilyCardTemplates();
  
  if (!familyUnitId || !familyRole) {
    return null;
  }

  const contextualTemplates = getTemplatesForContext(familyRole, generationLevel);
  const generalTemplates = getTemplatesForContext('general_family', generationLevel);
  
  const allTemplates = [...contextualTemplates, ...generalTemplates]
    .filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );

  if (allTemplates.length === 0) {
    return null;
  }

  const getTemplateIcon = (context: string) => {
    switch (context) {
      case 'parent':
      case 'grandparent':
        return <Crown className="h-4 w-4" />;
      case 'child':
      case 'grandchild':
        return <Users className="h-4 w-4" />;
      default:
        return <TreePine className="h-4 w-4" />;
    }
  };

  const getContextLabel = (context: string) => {
    return context.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-primary" />
          Family Card Templates
          <Badge variant="secondary" className="text-xs">
            {allTemplates.length} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These templates are specifically designed for your family role and generation level.
          </p>
          
          <div className="grid gap-3 md:grid-cols-2">
            {allTemplates.map((template) => {
              const fields = parseTemplateFields(template);
              return (
                <div
                  key={template.id}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTemplateIcon(template.relationship_context)}
                      <h4 className="font-medium text-sm">{template.template_name}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getContextLabel(template.relationship_context)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Fields: {fields.length}</span>
                      <span>•</span>
                      <span>
                        Generations: {
                          template.generation_applicable.includes('all') 
                            ? 'All' 
                            : template.generation_applicable.join(', ')
                        }
                      </span>
                    </div>
                    
                    {fields.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fields.slice(0, 3).map((field) => (
                          <Badge key={field.name} variant="outline" className="text-xs">
                            {field.name}
                          </Badge>
                        ))}
                        {fields.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{fields.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectTemplate(template)}
                    className="w-full"
                  >
                    Use Template
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyCardTemplateSelector;
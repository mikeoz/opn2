
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, FileText, Image, Building2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useFamilyUnits } from '@/hooks/useFamilyUnits';
import { useFamilyCardTemplates } from '@/hooks/useFamilyCardTemplates';

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
  fields: TemplateField[];
}

interface CardFormProps {
  template: CardTemplate;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, string>;
  isEditing?: boolean;
  familyContext?: {
    familyUnitId?: string;
    familyRole?: string;
    generationLevel?: number;
  };
}

const CardForm: React.FC<CardFormProps> = ({ 
  template, 
  onSubmit, 
  initialValues = {}, 
  isEditing = false,
  familyContext 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();
  const { familyUnits } = useFamilyUnits();
  const { getTemplatesForContext } = useFamilyCardTemplates();
  const form = useForm({
    defaultValues: {
      familyUnitId: familyContext?.familyUnitId || '',
      familyRole: familyContext?.familyRole || '',
      generationLevel: familyContext?.generationLevel || 1,
      ...Object.fromEntries(
        Object.entries(initialValues).map(([key, value]) => [`field_${key}`, value])
      )
    }
  });

  const sortedFields = template.fields?.sort((a, b) => a.display_order - b.display_order) || [];
  const isOrganizationCard = profile?.account_type === 'non_individual';
  
  // Get relevant family card templates if family context is provided
  const familyTemplates = familyContext?.familyUnitId 
    ? getTemplatesForContext(familyContext.familyRole || 'general_family', familyContext.generationLevel?.toString())
    : [];

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Include family context in the form data
      const formDataWithFamily = {
        ...data,
        familyContext: {
          familyUnitId: data.familyUnitId || null,
          familyRole: data.familyRole || null,
          generationLevel: data.generationLevel || 1
        }
      };
      
      await onSubmit(formDataWithFamily);
      toast({
        title: `Card ${isEditing ? 'updated' : 'created'} successfully!`,
        description: `Your ${template.name} card has been ${isEditing ? 'updated' : 'created'}.`,
      });
    } catch (error) {
      console.error('Error submitting card:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} card. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const fieldKey = `field_${field.id}` as any;
    
    return (
      <FormField
        key={field.id}
        control={form.control}
        name={fieldKey}
        rules={{
          required: field.is_required ? `${field.field_name} is required` : false
        }}  
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              {field.field_type === 'string' && <FileText className="h-4 w-4" />}
              {field.field_type === 'image' && <Image className="h-4 w-4" />}
              {field.field_type === 'document' && <Upload className="h-4 w-4" />}
              {field.field_name}
              {field.is_required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              {field.field_type === 'string' ? (
                field.field_name.toLowerCase().includes('description') || 
                field.field_name.toLowerCase().includes('notes') || 
                field.field_name.toLowerCase().includes('comment') ? (
                  <Textarea
                    placeholder={`Enter ${field.field_name.toLowerCase()}`}
                    {...formField}
                  />
                ) : (
                  <Input
                    placeholder={`Enter ${field.field_name.toLowerCase()}`}
                    {...formField}
                  />
                )
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {field.field_type === 'image' ? 'Upload image' : 'Upload document'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    File upload functionality coming soon
                  </p>
                  <Input
                    type="text"
                    placeholder="Enter file URL for now"
                    className="mt-2"
                    {...formField}
                  />
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {/* Organization Logo Preview */}
            {isOrganizationCard && (
              <Avatar className="h-12 w-12 border-2 border-muted">
                <AvatarImage 
                  src={profile?.logo_url} 
                  alt={`${profile?.organization_name} logo`}
                  className="object-contain"
                />
                <AvatarFallback>
                  <Building2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <CardTitle className="text-xl">
                {isEditing ? 'Edit' : 'Create'} {template.name}
                {isOrganizationCard && profile?.organization_name && (
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    for {profile.organization_name}
                  </span>
                )}
              </CardTitle>
              {template.description && (
                <p className="text-muted-foreground mt-1">{template.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={template.type === 'admin' ? 'default' : 'secondary'}>
              {template.type === 'admin' ? 'Admin' : 'Custom'}
            </Badge>
            <Badge variant={template.transaction_code === 'S' ? 'default' : 'destructive'}>
              {template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
            </Badge>
            {isOrganizationCard && (
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Organization
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Family Context Section */}
            {familyUnits.length > 0 && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">Family Context (Optional)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="familyUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select family unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No family unit</SelectItem>
                            {familyUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.family_label} (Gen {unit.generation_level})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="familyRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role in Family</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No specific role</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="grandparent">Grandparent</SelectItem>
                            <SelectItem value="grandchild">Grandchild</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generation Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Family Template Suggestions */}
                {familyTemplates.length > 0 && (
                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-2">
                      Recommended Family Templates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {familyTemplates.slice(0, 3).map((template) => (
                        <Badge key={template.id} variant="outline" className="text-xs">
                          {template.template_name}
                        </Badge>
                      ))}
                      {familyTemplates.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{familyTemplates.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      These templates are optimized for your family role and generation.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Card Fields */}
            {sortedFields.map(renderField)}
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : `${isEditing ? 'Update' : 'Create'} Card`}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CardForm;


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  type: 'admin' | 'user';
  transaction_code: 'S' | 'N';
  fields: TemplateField[];
}

interface CardFormProps {
  template: CardTemplate;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, string>;
  isEditing?: boolean;
}

const CardForm: React.FC<CardFormProps> = ({ 
  template, 
  onSubmit, 
  initialValues = {}, 
  isEditing = false 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm();

  const sortedFields = template.fields?.sort((a, b) => a.display_order - b.display_order) || [];

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
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
    const fieldKey = `field_${field.id}`;
    
    return (
      <FormField
        key={field.id}
        control={form.control}
        name={fieldKey}
        rules={{
          required: field.is_required ? `${field.field_name} is required` : false
        }}
        defaultValue={initialValues[field.id] || ''}
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
          <div>
            <CardTitle className="text-xl">{isEditing ? 'Edit' : 'Create'} {template.name}</CardTitle>
            {template.description && (
              <p className="text-gray-600 mt-1">{template.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={template.type === 'admin' ? 'default' : 'secondary'}>
              {template.type === 'admin' ? 'Admin' : 'Custom'}
            </Badge>
            <Badge variant={template.transaction_code === 'S' ? 'default' : 'destructive'}>
              {template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

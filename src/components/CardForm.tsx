
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
import { Upload, FileText, Image as ImageIcon, Building2, Users, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useFamilyUnits } from '@/hooks/useFamilyUnits';
import { useFamilyCardTemplates } from '@/hooks/useFamilyCardTemplates';
import { PhotoSelector } from '@/components/PhotoSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


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
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [draggingFields, setDraggingFields] = useState<Set<string>>(new Set());
  const [photoSelectorOpen, setPhotoSelectorOpen] = useState(false);
  const [currentImageFieldId, setCurrentImageFieldId] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useAuth();
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

  const uploadFile = async (file: File, fieldId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${fieldId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('card-fields')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('card-fields')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileUpload = async (file: File, fieldId: string) => {
    const fieldKey = `field_${fieldId}`;
    
    setUploadingFields(prev => new Set(prev).add(fieldId));
    
    try {
    const url = await uploadFile(file, fieldId);
      (form.setValue as any)(fieldKey, url);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldId);
        return newSet;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFields(prev => new Set(prev).add(fieldId));
  };

  const handleDragLeave = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
  };

  const handleDrop = async (e: React.DragEvent, fieldId: string, fieldType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    if (fieldType === 'image') {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, GIF, WebP).",
          variant: "destructive"
        });
        return;
      }
    }

    await handleFileUpload(file, fieldId);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await handleFileUpload(file, fieldId);
    e.target.value = ''; // Reset input
  };

  const clearFileField = (fieldId: string) => {
    const fieldKey = `field_${fieldId}`;
    (form.setValue as any)(fieldKey, '');
  };

  const handlePhotoSelect = (photoUrl: string) => {
    if (currentImageFieldId) {
      const fieldKey = `field_${currentImageFieldId}`;
      (form.setValue as any)(fieldKey, photoUrl);
      setCurrentImageFieldId(null);
    }
  };

  const openPhotoSelector = (fieldId: string) => {
    setCurrentImageFieldId(fieldId);
    setPhotoSelectorOpen(true);
  };


  const renderField = (field: TemplateField) => {
    const fieldKey = `field_${field.id}` as any;
    const isUploading = uploadingFields.has(field.id);
    const isDragging = draggingFields.has(field.id);
    
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
              {field.field_type === 'image' && <ImageIcon className="h-4 w-4" />}
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
                <div>
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                      isDragging 
                        ? 'border-primary bg-primary/10 scale-105' 
                        : formField.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-muted-foreground/25 hover:border-primary'
                    }`}
                    onDragOver={(e) => handleDragOver(e, field.id)}
                    onDragLeave={(e) => handleDragLeave(e, field.id)}
                    onDrop={(e) => handleDrop(e, field.id, field.field_type)}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                     ) : formField.value ? (
                      <div className="space-y-3">
                        {field.field_type === 'image' && (
                          <img 
                            src={formField.value} 
                            alt="Uploaded" 
                            className="max-h-40 mx-auto rounded-lg object-contain"
                          />
                        )}
                        <div className="flex items-center justify-center gap-2">
                          <a 
                            href={formField.value} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate max-w-xs"
                          >
                            View {field.field_type}
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearFileField(field.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {field.field_type === 'image' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openPhotoSelector(field.id)}
                            className="w-full"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose Different Photo
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${
                          isDragging ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <p className={`text-sm font-medium transition-colors ${
                          isDragging ? 'text-primary' : 'text-foreground'
                        }`}>
                          {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {field.field_type === 'image' ? 'JPG, PNG, GIF, WebP' : 'PDF, DOC, etc.'} • Max 5MB
                        </p>
                        {field.field_type === 'image' && (
                          <>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                  Or
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openPhotoSelector(field.id)}
                              className="w-full"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Choose from Profile Photos
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      accept={field.field_type === 'image' ? 'image/*' : '*'}
                      onChange={(e) => handleFileInputChange(e, field.id)}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
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
    <Card className="w-full max-w-2xl mx-auto">
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
            
            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-border">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:flex-1 h-12"
                size="lg"
              >
                {isSubmitting ? 'Saving...' : `${isEditing ? 'Update' : 'Create'} Card`}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto h-12"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Photo Selector Dialog */}
      <PhotoSelector
        open={photoSelectorOpen}
        onOpenChange={setPhotoSelectorOpen}
        onSelect={handlePhotoSelect}
        currentPhotoUrl={currentImageFieldId ? form.getValues(`field_${currentImageFieldId}` as any) : undefined}
      />
    </Card>
  );
};

export default CardForm;

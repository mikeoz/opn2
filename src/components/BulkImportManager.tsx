import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Download, FileSpreadsheet, Users, Mail, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  fields: Array<{
    id: string;
    field_name: string;
    field_type: string;
    is_required: boolean;
    display_order: number;
  }>;
}

interface BulkImportJob {
  id: string;
  job_name: string;
  template_selection: any;
  status: string;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  created_at: string;
  file_path: string | null;
}

export const BulkImportManager = () => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available card templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['card-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_templates')
        .select(`
          id,
          name,
          description,
          type,
          template_fields (
            id,
            field_name,
            field_type,
            is_required,
            display_order
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data.map(template => ({
        ...template,
        fields: template.template_fields || []
      })) as CardTemplate[];
    }
  });

  // Fetch bulk import jobs
  const { data: importJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['bulk-import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BulkImportJob[];
    }
  });

  // Real-time listener for bulk import job updates
  useEffect(() => {
    const channel = supabase
      .channel('bulk-import-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bulk_import_jobs'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Invalidate and refetch the jobs query to get updated data
          queryClient.invalidateQueries({ queryKey: ['bulk-import-jobs'] });
          
          // Show toast notification for status changes
          if (payload.new && payload.old) {
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            
            if (newStatus !== oldStatus) {
              const jobName = payload.new.job_name;
              
              if (newStatus === 'processing') {
                toast({ title: `Processing started for "${jobName}"` });
              } else if (newStatus === 'completed') {
                toast({ 
                  title: `✅ Import completed successfully!`,
                  description: `"${jobName}" has finished processing.`
                });
              } else if (newStatus === 'failed') {
                toast({ 
                  title: `❌ Import failed`,
                  description: `"${jobName}" encountered an error.`,
                  variant: "destructive"
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Generate template spreadsheet
  const generateTemplate = () => {
    if (selectedTemplates.length === 0) {
      toast({ title: "Please select at least one card template", variant: "destructive" });
      return;
    }

    const selectedTemplateData = templates?.filter(t => selectedTemplates.includes(t.id));
    if (!selectedTemplateData) return;

    // Create CSV headers
    let csvHeaders = ['email', 'first_name', 'last_name']; // Common person fields
    
    selectedTemplateData.forEach(template => {
      const sortedFields = template.fields.sort((a, b) => a.display_order - b.display_order);
      sortedFields.forEach(field => {
        csvHeaders.push(`${template.name.toLowerCase().replace(/\s+/g, '_')}_${field.field_name.toLowerCase().replace(/\s+/g, '_')}`);
      });
    });

    // Create CSV content with sample data
    const csvContent = [
      csvHeaders.join(','),
      // Sample row with placeholders
      csvHeaders.map(header => {
        if (header === 'email') return 'john.doe@example.com';
        if (header === 'first_name') return 'John';
        if (header === 'last_name') return 'Doe';
        return 'sample_value';
      }).join(',')
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_import_template_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: "Template downloaded successfully!" });
  };

  // Delete bulk import job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('bulk_import_jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-import-jobs'] });
      toast({ title: "Import job deleted successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting import job", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Process bulk import job
  const processJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await supabase.functions.invoke('process-bulk-import', {
        body: { jobId }
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-import-jobs'] });
      toast({ title: "Processing started successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error processing import job", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Create bulk import job
  const createImportJobMutation = useMutation({
    mutationFn: async (jobData: { job_name: string; template_selection: any; file?: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let filePath = null;
      if (jobData.file) {
        const fileExt = jobData.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bulk-imports')
          .upload(fileName, jobData.file);
        
        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .insert({
          job_name: jobData.job_name,
          template_selection: jobData.template_selection,
          file_path: filePath,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-import-jobs'] });
      setJobName('');
      setJobDescription('');
      setSelectedTemplates([]);
      setUploadedFile(null);
      toast({ title: "Import job created successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating import job", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleCreateImportJob = () => {
    if (!jobName.trim()) {
      toast({ title: "Please enter a job name", variant: "destructive" });
      return;
    }
    if (selectedTemplates.length === 0) {
      toast({ title: "Please select at least one template", variant: "destructive" });
      return;
    }

    const templateSelection = {
      template_ids: selectedTemplates,
      templates: templates?.filter(t => selectedTemplates.includes(t.id))
    };

    createImportJobMutation.mutate({
      job_name: jobName,
      template_selection: templateSelection,
      file: uploadedFile || undefined
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800', 
      completed: 'bg-green-100 text-green-800',
      completed_with_errors: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800'
    };
    return <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (templatesLoading || jobsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create New Import Job */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create Bulk Import Job
          </CardTitle>
          <CardDescription>
            Select card templates and upload a CSV file to create multiple cards with invitations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., BBT Q1 2024 Leasehold Cards"
              />
            </div>
            <div>
              <Label htmlFor="jobDescription">Description (Optional)</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Describe this bulk import..."
                rows={3}
              />
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <Label>Select Card Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {templates?.map((template) => (
                <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={template.id}
                    checked={selectedTemplates.includes(template.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTemplates([...selectedTemplates, template.id]);
                      } else {
                        setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={template.id} className="text-sm font-medium cursor-pointer">
                      {template.name}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.fields.length} fields
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Generation */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Download a template spreadsheet with the correct columns for your selected templates.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateTemplate}
                  disabled={selectedTemplates.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div>
            <Label htmlFor="csvFile">Upload CSV File (Optional)</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
            {uploadedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Create Job Button */}
          <Button 
            onClick={handleCreateImportJob}
            disabled={createImportJobMutation.isPending}
            className="w-full"
          >
            {createImportJobMutation.isPending ? 'Creating...' : 'Create Import Job'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Jobs History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Jobs History
          </CardTitle>
          <CardDescription>
            Track the status of your bulk import jobs and manage invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importJobs && importJobs.length > 0 ? (
            <div className="space-y-4">
              {importJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{job.job_name}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                    {job.total_rows && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Progress: {job.processed_rows}/{job.total_rows} processed
                        {job.failed_rows > 0 && <span className="text-red-600 ml-2">({job.failed_rows} failed)</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'pending' && job.file_path && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => processJobMutation.mutate(job.id)}
                        disabled={processJobMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {processJobMutation.isPending ? 'Processing...' : 'Process Now'}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteJobMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          View Invitations
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Invitations for {job.job_name}</DialogTitle>
                          <DialogDescription>
                            Manage card creation invitations for this bulk import job
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">
                            Invitation management coming soon...
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No import jobs created yet. Create your first bulk import job above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
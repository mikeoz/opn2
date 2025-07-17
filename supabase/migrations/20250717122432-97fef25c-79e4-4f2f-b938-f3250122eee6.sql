-- Create storage buckets for bulk imports
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('bulk-imports', 'bulk-imports', false),
  ('import-templates', 'import-templates', true);

-- Create bulk import jobs table
CREATE TABLE public.bulk_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.profiles(id),
  job_name TEXT NOT NULL,
  template_selection JSONB NOT NULL, -- Array of selected card templates
  file_path TEXT, -- Path to uploaded file in storage
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create card invitations table for bulk-created cards
CREATE TABLE public.card_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bulk_import_job_id UUID NOT NULL REFERENCES public.bulk_import_jobs(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.user_cards(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  invitation_data JSONB, -- Store the row data for card creation
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, accepted, failed
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulk_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_import_jobs
CREATE POLICY "Users can view their own import jobs" 
ON public.bulk_import_jobs 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own import jobs" 
ON public.bulk_import_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own import jobs" 
ON public.bulk_import_jobs 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for card_invitations
CREATE POLICY "Users can view invitations for their import jobs" 
ON public.card_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bulk_import_jobs 
    WHERE id = bulk_import_job_id AND created_by = auth.uid()
  )
);

CREATE POLICY "System can manage all card invitations" 
ON public.card_invitations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Storage policies for bulk imports
CREATE POLICY "Users can upload their own import files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'bulk-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own import files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'bulk-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public access to template files
CREATE POLICY "Anyone can view import templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'import-templates');

CREATE POLICY "Admins can manage import templates" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'import-templates' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'import-templates' AND public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_bulk_import_jobs_created_by ON public.bulk_import_jobs(created_by);
CREATE INDEX idx_bulk_import_jobs_status ON public.bulk_import_jobs(status);
CREATE INDEX idx_card_invitations_job_id ON public.card_invitations(bulk_import_job_id);
CREATE INDEX idx_card_invitations_token ON public.card_invitations(invitation_token);
CREATE INDEX idx_card_invitations_status ON public.card_invitations(status);
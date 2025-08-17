-- Enable real-time updates for bulk_import_jobs table
ALTER TABLE public.bulk_import_jobs REPLICA IDENTITY FULL;

-- Add table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_import_jobs;
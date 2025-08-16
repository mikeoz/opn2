-- Add delete policy for bulk import jobs
CREATE POLICY "Users can delete their own import jobs"
ON public.bulk_import_jobs
FOR DELETE
USING (auth.uid() = created_by);
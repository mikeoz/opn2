-- Create storage bucket for card field uploads (images and documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-fields', 'card-fields', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for card-fields bucket
CREATE POLICY "Users can upload their own card field files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'card-fields' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own card field files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'card-fields' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Card field files are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'card-fields');

CREATE POLICY "Users can update their own card field files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'card-fields' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own card field files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'card-fields' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
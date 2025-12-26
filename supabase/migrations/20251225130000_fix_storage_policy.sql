-- Allow authenticated users to upload files to their own folder in insurance-claims bucket
CREATE POLICY "Users can upload claim documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'insurance-claims' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own uploaded files
CREATE POLICY "Users can view own claim documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'insurance-claims' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

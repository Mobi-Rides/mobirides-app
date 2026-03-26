-- Create return-photos storage bucket for rental review image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'return-photos',
  'return-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own booking folder
CREATE POLICY "Authenticated users can upload return photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'return-photos');

-- Allow public read access
CREATE POLICY "Public can view return photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'return-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own return photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'return-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

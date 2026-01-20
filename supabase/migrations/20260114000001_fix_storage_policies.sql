-- Fix Storage Policies for chat-attachments bucket
-- Allows authenticated users to upload files and anyone to read them
-- Uses DROP IF EXISTS to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );

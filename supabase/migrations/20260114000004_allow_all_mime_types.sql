-- Update chat-attachments bucket to allow all file types
-- This removes MIME type restrictions

UPDATE storage.buckets 
SET allowed_mime_types = NULL
WHERE id = 'chat-attachments';

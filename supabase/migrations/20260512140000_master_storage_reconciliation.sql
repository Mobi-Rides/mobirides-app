-- Migration: 20260512140000_master_storage_reconciliation
-- Objective: Resolve missing buckets, unify naming, and apply folder-aware RLS policies.
-- Reference: MOB-123, BUG-054 to BUG-058

-- 1. Ensure all required buckets exist with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('car-documents', 'car-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('chat-attachments', 'chat-attachments', false, 20971520, NULL),
  ('handover-photos', 'handover-photos', false, 10485760, ARRAY['image/jpeg', 'image/png']),
  ('verification-documents', 'verification-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('verification-selfies', 'verification-selfies', false, 5242880, ARRAY['image/jpeg', 'image/png']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png']),
  ('car-images', 'car-images', true, 10485760, ARRAY['image/jpeg', 'image/png']),
  ('insurance-claims', 'insurance-claims', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('return-photos', 'return-photos', false, 10485760, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to ensure clean re-application of folder-aware logic
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname ~ '^(car-documents|chat-attachments|handover-photos|verification-documents|verification-selfies|avatars|car-images|insurance-claims|return-photos)_.*'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 3. Apply Folder-Aware RLS Policies
-- Logic: auth.uid()::text = (storage.foldername(name))[1]

DO $$ 
DECLARE
  bucket_name TEXT;
  buckets TEXT[] := ARRAY[
    'car-documents', 'chat-attachments', 'handover-photos', 
    'verification-documents', 'verification-selfies', 'avatars', 
    'car-images', 'insurance-claims', 'return-photos'
  ];
BEGIN
  FOREACH bucket_name IN ARRAY buckets LOOP
    -- INSERT: Users can upload to their own folder
    EXECUTE format('CREATE POLICY "%s_user_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1])', bucket_name, bucket_name);
    
    -- SELECT: Users can view their own files
    EXECUTE format('CREATE POLICY "%s_user_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1])', bucket_name, bucket_name);
    
    -- UPDATE: Users can update their own files
    EXECUTE format('CREATE POLICY "%s_user_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1])', bucket_name, bucket_name, bucket_name);
    
    -- DELETE: Users can delete their own files
    EXECUTE format('CREATE POLICY "%s_user_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1])', bucket_name, bucket_name);
  END LOOP;
END $$;

-- 4. Special Case: Public Read for certain buckets
-- Some buckets like avatars and car-images should be readable by everyone (even non-authenticated if public=true)
CREATE POLICY "avatars_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "car-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'car-images');

-- 5. Admin Override: Admins can see everything
CREATE POLICY "storage_admin_select_all" ON storage.objects FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin', 'super_admin')
  )
);

-- 6. Cleanup legacy naming references if any
-- (Note: Standardizing on chat-attachments in DB to match frontend implementation)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'message-attachments') THEN
    -- If there's data in the old bucket, you might want to migrate it here.
    -- For now, we just ensure the NEW bucket exists.
    RAISE NOTICE 'Old message-attachments bucket found. Ensure data is migrated to chat-attachments if necessary.';
  END IF;
END $$;

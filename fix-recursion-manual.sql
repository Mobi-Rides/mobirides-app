-- Manual SQL Fix for Storage-Messages Recursion Issue
-- This script should be run directly in the Supabase SQL editor to fix the recursion

-- The issue: storage.list() triggers "infinite recursion detected in policy for relation 'messages'"
-- This happens because storage.objects RLS policies somehow trigger messages table evaluation

-- Step 1: Drop all existing storage.objects policies that might cause issues
DO $$
BEGIN
  -- Drop admin policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;

  -- Drop user policies for verification buckets
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_select'
  ) THEN
    DROP POLICY "verification-temp_users_select" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_select'
  ) THEN
    DROP POLICY "verification-documents_users_select" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_select'
  ) THEN
    DROP POLICY "verification-selfies_users_select" ON storage.objects;
  END IF;
END $$;

-- Step 2: Create minimal, self-contained policies that avoid any cross-references
-- These policies should NOT trigger evaluation of other tables

-- Admin policy - completely self-contained
CREATE POLICY "verification_admin_read_all"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents','verification-selfies','verification-temp')
    AND EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );

-- User policies - only check bucket and folder structure, no other tables
CREATE POLICY "verification-temp_users_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-temp' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "verification-documents_users_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "verification-selfies_users_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-selfies' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Step 3: Ensure messages policies are also clean (drop and recreate)
DO $$
BEGIN
  -- Drop messages policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Admins can view all messages'
  ) THEN
    DROP POLICY "Admins can view all messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can view their own messages'
  ) THEN
    DROP POLICY "Users can view their own messages" ON public.messages;
  END IF;
END $$;

-- Recreate clean messages policies
CREATE POLICY "Admins can view all messages"
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own messages"
  ON public.messages 
  FOR SELECT 
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Step 4: Grant necessary permissions
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT ON public.admins TO authenticated;

-- Step 5: Test the fix
-- Run this to verify the fix:
-- SELECT * FROM storage.objects WHERE bucket_id = 'verification-temp' LIMIT 1;
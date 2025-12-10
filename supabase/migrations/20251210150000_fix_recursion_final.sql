-- Fix Infinite Recursion in Storage and Admins Policies
-- This migration comprehensively fixes the recursion issue by:
-- 1. Cleaning up ALL policies on the 'admins' table and establishing a single, safe SELECT policy.
-- 2. Cleaning up 'storage.objects' policies and replacing the admin policy with an INLINED check that avoids function calls.
-- 3. Cleaning up 'messages' policies ONLY if the table exists.

DO $$
BEGIN
  -- =================================================================
  -- 1. CLEAN UP ADMINS TABLE POLICIES
  -- =================================================================
  
  -- Drop known policies on public.admins
  DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
  DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;
  DROP POLICY IF EXISTS "Only admins can view admin list" ON public.admins;
  DROP POLICY IF EXISTS "Admins can view themselves" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;
  DROP POLICY IF EXISTS "admins_read_policy" ON public.admins;
  DROP POLICY IF EXISTS "admins_write_policy" ON public.admins;
  DROP POLICY IF EXISTS "public_admins_select" ON public.admins;
  
  -- Create ONE safe SELECT policy for admins
  -- This breaks recursion by not checking any other table/function
  CREATE POLICY "admins_read_policy_final" 
  ON public.admins FOR SELECT 
  TO authenticated 
  USING (true);

  -- =================================================================
  -- 2. CLEAN UP STORAGE POLICIES
  -- =================================================================
  
  -- Drop admin read policies on storage.objects
  DROP POLICY IF EXISTS "verification_admin_read_all" ON storage.objects;
  DROP POLICY IF EXISTS "verification_admin_read_all_complex" ON storage.objects;
  DROP POLICY IF EXISTS "verification_admin_read_all_hierarchical" ON storage.objects;
  DROP POLICY IF EXISTS "storage_admin_read" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all verification files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all license verifications" ON storage.objects;

  -- Drop user policies (to be recreated cleanly)
  DROP POLICY IF EXISTS "verification-temp_users_select" ON storage.objects;
  DROP POLICY IF EXISTS "verification-documents_users_select" ON storage.objects;
  DROP POLICY IF EXISTS "verification-selfies_users_select" ON storage.objects;
  
  -- Recreate Admin Policy with INLINED check
  -- This avoids calling public.is_admin(), preventing function-based recursion
  CREATE POLICY "storage_admin_read_final"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
      )
    );

  -- Recreate User Policies (Folder based, no DB lookups)
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

  -- =================================================================
  -- 3. CLEAN UP MESSAGES POLICIES (Conditional)
  -- =================================================================
  
  -- Only attempt this if the messages table actually exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
      DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
      
      CREATE POLICY "Admins can view all messages_final"
      ON public.messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
      );
  END IF;

END $$;

-- Fix recursion by simplifying admins policy and ensuring security definer functions
-- Overrides previous attempts to ensure definitive fix

-- 1. Ensure is_admin is SECURITY DEFINER and simple (Force Replace)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$;

-- 2. Force admins table to be readable by everyone (to break recursion)
-- We drop any restrictive select policies
DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;
DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
DROP POLICY IF EXISTS "public_admins_select" ON public.admins;

CREATE POLICY "Admins are viewable by everyone" 
ON public.admins FOR SELECT 
USING (true);

-- 3. Ensure has_verification_admin_access is safe and SECURITY DEFINER (Force Replace)
CREATE OR REPLACE FUNCTION public.has_verification_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check admins table for super_admin status (bypasses RLS due to SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  ) 
  OR 
  -- Check profiles table for admin roles (bypasses RLS due to SECURITY DEFINER)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin', 'super_admin')
  );
$$;

-- 4. Re-apply storage policies using the safe function
-- Drop potentially recursive policies
DROP POLICY IF EXISTS "verification_admin_read_all_complex" ON storage.objects;
DROP POLICY IF EXISTS "verification_admin_read_all" ON storage.objects;
DROP POLICY IF EXISTS "verification_admin_read_all_hierarchical" ON storage.objects;

-- Create the safe policy
CREATE POLICY "verification_admin_read_all_complex"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
    AND public.has_verification_admin_access()
  );

-- 5. Ensure INSERT policy exists for users (idempotent check)
-- Users need to be able to insert their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their verification files'
  ) THEN
    CREATE POLICY "Users can upload their verification files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
  
  -- Ensure UPDATE policy exists (for upsert)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their verification files'
  ) THEN
    CREATE POLICY "Users can update their verification files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

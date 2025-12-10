-- FIX RECURSION DEFINITIVELY
-- Cause: Function overloading mismatch (is_admin() vs is_admin(uuid)) and persistent recursion in policies

-- 1. Drop ALL variations of admin check functions to ensure no stale/recursive versions remain
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_verification_admin_access() CASCADE;

-- 2. Recreate single, authoritative is_admin() function
-- SECURITY DEFINER: Bypasses RLS on accessed tables (admins, profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admins table
  IF EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Check profiles table (legacy admin role)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3. Recreate is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admins table only for super admin
  IF EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 4. Fix 'admins' table policies
-- Drop ALL potential existing policies
DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;
DROP POLICY IF EXISTS "public_admins_select" ON public.admins;
DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;

-- Create simple, safe policies
CREATE POLICY "Admins are viewable by everyone" 
ON public.admins FOR SELECT 
USING (true);

-- Use the new is_super_admin() which is SECURITY DEFINER
CREATE POLICY "Super admins can manage admins" 
ON public.admins FOR ALL 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 5. Fix Storage Policies
-- Drop old policies referencing old functions
DROP POLICY IF EXISTS "verification_admin_read_all" ON storage.objects;
DROP POLICY IF EXISTS "verification_admin_read_all_complex" ON storage.objects;
DROP POLICY IF EXISTS "verification_admin_read_all_hierarchical" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification files" ON storage.objects;

-- Create safe storage policy
CREATE POLICY "verification_admin_read_all"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND public.is_admin()
);

-- Ensure user upload policies exist
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
END $$;

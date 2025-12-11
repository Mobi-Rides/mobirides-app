-- Comprehensive Recursive-Safe Complex Role Validation Migration
-- Purpose: Fix RLS recursion while preserving multi-table admin/super_admin checks
-- Based on analysis of backup migrations and recent recursion fixes

-- =====================================================
-- ROLLBACK SCRIPT (Save this separately)
-- =====================================================
-- If issues occur, run this to restore simplified policies:
/*
-- Drop complex policies
DROP POLICY IF EXISTS "verification_admin_read_all_complex" ON storage.objects;
DROP POLICY IF EXISTS "verification_admin_read_all_hierarchical" ON storage.objects;

-- Restore simplified policy from fix-recursion-manual.sql
CREATE POLICY "verification_admin_read_all"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents','verification-selfies','verification-temp')
    AND EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );
*/

-- =====================================================
-- STEP 1: Create SECURITY DEFINER Functions
-- =====================================================
-- These functions encapsulate complex role validation to prevent recursion

-- Function 1: Comprehensive admin access check (profiles + admins tables)
CREATE OR REPLACE FUNCTION public.has_verification_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check profiles table for admin/super_admin roles (from user_role enum)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
  ) OR EXISTS (
    -- Check admins table for super_admin status (from admins.is_super_admin)
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  );
$$;

-- Function 2: Profile-based admin check only
CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')  );
$$;

-- Function 3: Admin table super_admin check only  
CREATE OR REPLACE FUNCTION public.is_super_admin_from_admins()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  );
$$;

-- Function 4: Basic admin check (skip if already exists from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE '
      CREATE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
        SELECT EXISTS (
          SELECT 1 FROM public.admins WHERE id = auth.uid()
        );
      $func$;
    ';
  END IF;
END $$;

-- Function 5: Super admin check (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE '
      CREATE FUNCTION public.is_super_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
        SELECT EXISTS (
          SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true
        );
      $func$;
    ';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Grant Execute Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.has_verification_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_from_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- =====================================================
-- STEP 3: Test Functions (Run these manually first)
-- =====================================================
/*
-- Test the functions with current user
SELECT 
  auth.uid() as current_user_id,
  public.has_verification_admin_access() as has_complex_access,
  public.is_profile_admin() as is_profile_admin,
  public.is_super_admin_from_admins() as is_super_admin_from_admins,
  public.is_admin() as is_basic_admin,
  public.is_super_admin() as is_super_admin;

-- Test with specific user (replace with actual UUID)
-- SELECT public.has_verification_admin_access() WHERE auth.uid() = 'your-test-user-id';
*/

-- =====================================================
-- STEP 4: Apply Recursive-Safe Complex Policies
-- =====================================================

-- Drop existing simplified policies (from fix-recursion-manual.sql)
DO $$
BEGIN
  -- Drop admin policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;
  
  -- Drop any existing complex policies we might have created
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all_complex'
  ) THEN
    DROP POLICY "verification_admin_read_all_complex" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all_hierarchical'
  ) THEN
    DROP POLICY "verification_admin_read_all_hierarchical" ON storage.objects;
  END IF;
END $$;

-- Create the recursive-safe complex policy
-- This preserves the original complex validation from 20251126134113_verification_storage_buckets.sql
CREATE POLICY "verification_admin_read_all_complex"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents','verification-selfies','verification-temp')
    AND public.has_verification_admin_access()
  );

-- =====================================================
-- STEP 5: Verify the Fix
-- =====================================================
/*
-- Test storage access (should work without recursion)
SELECT COUNT(*) FROM storage.objects 
WHERE bucket_id IN ('verification-documents','verification-selfies','verification-temp');

-- Test with specific bucket
SELECT name, bucket_id FROM storage.objects 
WHERE bucket_id = 'verification-documents' LIMIT 5;

-- Verify user policies still work
SELECT name FROM storage.objects 
WHERE bucket_id = 'verification-documents' 
AND auth.uid()::text = (storage.foldername(name))[1]
LIMIT 5;
*/

-- =====================================================
-- STEP 6: Integration Verification
-- =====================================================
-- This ensures verificationService.ts line 479 (completeDocumentUpload) works correctly
-- The service should now be able to:
-- 1. Upload files without recursion errors
-- 2. List files for admin review
-- 3. Access storage.objects for verification workflows

DO $$
BEGIN
  RAISE NOTICE 'Recursive-safe complex role validation migration completed successfully.';
  RAISE NOTICE 'All original multi-table checks preserved while preventing recursion.';
  RAISE NOTICE 'verificationService.ts integration at line 479 should now work without issues.';
END $$;
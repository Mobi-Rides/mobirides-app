-- Definitively fix recursion on 'admins' table and 'storage.objects'
-- Problem: 'admins' table likely has recursive policies (checking itself via subqueries)
-- Solution: Replace all 'admins' policies with SECURITY DEFINER function calls

-- 1. Drop potentially recursive policies on 'admins'
DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;

-- 2. Recreate 'admins' policies using SECURITY DEFINER functions (Safe)
-- SELECT: Allow admins to view themselves, and super admins to view all
CREATE POLICY "Admins can view themselves"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_super_admin()
  );

-- INSERT: Only super admins can insert
CREATE POLICY "Super admins can insert admins"
  ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
  );

-- UPDATE: Only super admins can update
CREATE POLICY "Super admins can update admins"
  ON public.admins
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- DELETE: Only super admins can delete
CREATE POLICY "Super admins can delete admins"
  ON public.admins
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- 3. Cleanup storage policies
-- Drop the old recursive policy if it still exists
DROP POLICY IF EXISTS "verification_admin_read_all" ON storage.objects;

-- Ensure the new complex policy exists (idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'verification_admin_read_all_complex'
  ) THEN
    -- Recreate it if missing (copy from previous migration)
    CREATE POLICY "verification_admin_read_all_complex"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id IN ('verification-documents','verification-selfies','verification-temp')
        AND public.has_verification_admin_access()
      );
  END IF;
END $$;

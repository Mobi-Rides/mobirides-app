-- Recursive-Safe Complex Role Validation Solution
-- Purpose: Preserve multi-table role checks while preventing recursion
-- Strategy: Use SECURITY DEFINER functions to encapsulate complex validation

-- 1. Enhanced SECURITY DEFINER function for complex role validation
CREATE OR REPLACE FUNCTION public.has_verification_admin_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check profiles table for admin/super_admin roles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
  ) OR EXISTS (
    -- Check admins table for super_admin status
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  );
$$;

-- 2. Alternative: Separate functions for different admin levels
CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
  );
$$;

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

-- 3. Recursive-safe complex policy using SECURITY DEFINER functions
-- Drop the simplified policy first
DROP POLICY IF EXISTS "Admins can view all verification files" ON storage.objects;

-- Recreate with complex validation preserved
CREATE POLICY "verification_admin_read_all_complex"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents','verification-selfies','verification-temp')
    AND public.has_verification_admin_access()
  );

-- 4. Alternative policy with explicit role hierarchy
DROP POLICY IF EXISTS "verification_admin_read_all_hierarchical" ON storage.objects;

CREATE POLICY "verification_admin_read_all_hierarchical"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification-documents','verification-selfies','verification-temp')
    AND (
      public.is_profile_admin() OR public.is_super_admin_from_admins()
    )
  );

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_verification_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_from_admins() TO authenticated;

-- 6. Test the functions
-- SELECT public.has_verification_admin_access();
-- SELECT public.is_profile_admin();
-- SELECT public.is_super_admin_from_admins();
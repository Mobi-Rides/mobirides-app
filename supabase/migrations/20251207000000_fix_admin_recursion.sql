-- Migration: Fix Infinite Recursion in Admin Policies
-- Source: Production migration 20251207000000 - preserving unique logic
-- Description: 
--   - Redefines public.is_admin() to be strictly SECURITY DEFINER with fixed search_path.
--   - Optimizes is_admin() to avoid unnecessary joins and recursion.
--   - Explicitly replaces 'admins' table policies ensuring no self-reference loops.

-- 1. Redefine is_admin with robust SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  is_super boolean;
  is_admin_role boolean;
BEGIN
  -- Check for admin in admins table (bypasses RLS due to SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid 
  ) INTO is_super;
  
  IF is_super THEN
    RETURN true;
  END IF;

  -- Check for 'admin' role in profiles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'admin'
  ) INTO is_admin_role;
  
  RETURN is_admin_role;
END;
$$;

-- 2. Fix 'admins' table policies to avoid recursion
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
CREATE POLICY "Anyone can view admin list"
  ON public.admins
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
CREATE POLICY "Super admins can create new admins"
  ON public.admins
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
CREATE POLICY "Super admins can update admin records"
  ON public.admins
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
CREATE POLICY "Super admins can delete admin records"
  ON public.admins
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 3. Ensure Storage Admin Policy uses the safe is_admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;

  CREATE POLICY "verification_admin_read_all"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents','verification-selfies','verification-temp')
      AND public.is_admin(auth.uid())
    );
END $$;

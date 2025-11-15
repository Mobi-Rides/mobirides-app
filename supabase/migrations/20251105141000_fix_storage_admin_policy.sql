-- Fix Supabase Storage admin policy to avoid recursive RLS evaluation
-- Context: Uploads to storage.objects failed with 500 and error
--   "infinite recursion detected in policy for relation \"messages\"".
-- Root cause likely from admin policy using subqueries to profiles/admins,
-- which trigger RLS on those tables and indirectly cause recursion via messages policies.
-- Solution: Use SECURITY DEFINER helper is_admin() (no-arg) to avoid reading
--   other RLS-guarded tables inside storage.objects policies.

DO $$
BEGIN
  -- Drop existing admin read-all policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;

  -- Recreate admin read policy using SECURITY DEFINER is_admin()
  CREATE POLICY "verification_admin_read_all"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents','verification-selfies','verification-temp')
      AND public.is_admin() -- no-arg SECURITY DEFINER function
    );
END $$;

-- Note: is_admin() SECURITY DEFINER is created in 20241206000001_remake_verification_policies.sql
-- and returns TRUE when the current auth.uid() has admin/super_admin role.
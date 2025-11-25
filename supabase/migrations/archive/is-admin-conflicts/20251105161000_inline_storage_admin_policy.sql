-- Purpose: Inline admin check in storage.objects policy to avoid function dispatch
-- Context: Upload to storage.objects still reports recursion in messages policies.
--   Although public.is_admin() now reads only public.admins, inlining removes any
--   function-based evaluation during SELECT of RETURNING *.

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

  -- Recreate admin read policy using inline EXISTS on public.admins
  CREATE POLICY "verification_admin_read_all"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents','verification-selfies','verification-temp')
      AND EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
      )
    );
END $$;

COMMENT ON POLICY "verification_admin_read_all" ON storage.objects IS
'Admin read policy inlined to EXISTS(public.admins) to avoid function-based recursion.';
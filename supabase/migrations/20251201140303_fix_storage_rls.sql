-- MOBI-502-1: Fix storage bucket permissions and admin policy recursion
-- Replace admin read policies to use SECURITY DEFINER public.is_admin()
-- and keep per-user folder-based policies intact

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
      AND public.is_admin()
    );
END $$;

-- Ensure per-user policies remain idempotently present (no-op if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_select'
  ) THEN
    CREATE POLICY "verification-documents_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_select'
  ) THEN
    CREATE POLICY "verification-selfies_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_select'
  ) THEN
    CREATE POLICY "verification-temp_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;


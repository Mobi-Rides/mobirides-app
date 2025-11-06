-- Migration: Create Supabase Buckets for Verification Files (with existence pre-check)
-- Source: VERIFY-101: Create Storage Buckets for Verification Documents
-- Description:
--   - Create secure, private buckets for documents, selfies, and temporary uploads.
--   - Apply RLS policies scoped to user-owned folders, admin read-only, and MIME/size restrictions.
--   - Configure 24-hour auto-cleanup for temp bucket using pg_cron.
--   - Idempotent operations: safe to re-run.

-- =====================================================
-- Pre-check: Report existing buckets (acceptance evidence)
-- =====================================================
DO $$
DECLARE
  existing_buckets TEXT;
BEGIN
  SELECT string_agg(id, ',') INTO existing_buckets
  FROM storage.buckets
  WHERE id IN ('verification-documents','verification-selfies','verification-temp');

  IF existing_buckets IS NULL THEN
    RAISE NOTICE 'Verification buckets not found yet.';
  ELSE
    RAISE NOTICE 'Existing verification buckets: %', existing_buckets;
  END IF;
END $$;

-- =====================================================
-- Bucket creation (idempotent)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents','verification-documents', false, 5242880, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-selfies','verification-selfies', false, 5242880, ARRAY['image/jpeg','image/png'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-temp','verification-temp', false, 5242880, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Ensure updates to bucket settings if they already exist (idempotent upserts)
UPDATE storage.buckets SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','application/pdf']
WHERE id = 'verification-documents';

UPDATE storage.buckets SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png']
WHERE id = 'verification-selfies';

UPDATE storage.buckets SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','application/pdf']
WHERE id = 'verification-temp';

-- =====================================================
-- RLS policies on storage.objects (idempotent, per-bucket)
-- Pattern: folder structure /<user_id>/<...> enforced by storage.foldername(name)[1]
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_insert'
  ) THEN
    CREATE POLICY "verification-documents_users_insert"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_select'
  ) THEN
    CREATE POLICY "verification-documents_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_update'
  ) THEN
    CREATE POLICY "verification-documents_users_update"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_delete'
  ) THEN
    CREATE POLICY "verification-documents_users_delete"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_insert'
  ) THEN
    CREATE POLICY "verification-selfies_users_insert"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_select'
  ) THEN
    CREATE POLICY "verification-selfies_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_update'
  ) THEN
    CREATE POLICY "verification-selfies_users_update"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_delete'
  ) THEN
    CREATE POLICY "verification-selfies_users_delete"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'verification-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_insert'
  ) THEN
    CREATE POLICY "verification-temp_users_insert"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_select'
  ) THEN
    CREATE POLICY "verification-temp_users_select"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_update'
  ) THEN
    CREATE POLICY "verification-temp_users_update"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_delete'
  ) THEN
    CREATE POLICY "verification-temp_users_delete"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'verification-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Admin read-only across verification buckets (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all'
  ) THEN
    CREATE POLICY "verification_admin_read_all"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id IN ('verification-documents','verification-selfies','verification-temp') AND (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
          ) OR EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.id = auth.uid() AND a.is_super_admin = true
          )
        )
      );
  END IF;
END $$;

-- =====================================================
-- Auto-cleanup: delete verification-temp objects older than 24 hours
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_verification_temp()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete actual objects older than 24 hours in temporary bucket using storage.delete
  PERFORM storage.delete(
    'verification-temp',
    ARRAY(
      SELECT name FROM storage.objects
      WHERE bucket_id = 'verification-temp'
        AND created_at < now() - interval '24 hours'
    )
  );
END;
$$;

-- Schedule hourly cleanup; idempotent schedule ensuring single job name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.jobs WHERE jobname = 'cleanup_verification_temp_hourly'
  ) THEN
    PERFORM cron.schedule(
      'cleanup_verification_temp_hourly',
      '0 * * * *',
      $$ SELECT public.cleanup_verification_temp(); $$
    );
  END IF;
END $$;

-- =====================================================
-- Notes on CORS
-- =====================================================
-- CORS for Supabase Storage uploads is configured at the platform level.
-- For local CLI, default storage service permits typical dev origins. Validate via frontend upload.
-- In production, set allowed origins/headers in Supabase Studio (Storage settings) to include your app domains.

-- End of migration
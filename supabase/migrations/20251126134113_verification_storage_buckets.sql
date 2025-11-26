-- Migration: Create Supabase Buckets for Verification Files (Fixed - No pg_cron dependency)
-- Source: VERIFY-101: Create Storage Buckets for Verification Documents
-- Description:
--   - Create secure, private buckets for documents, selfies, and temporary uploads.
--   - Apply RLS policies scoped to user-owned folders, admin read-only, and MIME/size restrictions.
--   - Provide cleanup function for temp bucket (manual/external trigger, no pg_cron required).
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
-- Auto-cleanup function for temp files (no pg_cron dependency)
-- =====================================================
-- This function can be called manually or via an external scheduler (e.g., GitHub Actions, Supabase Edge Functions)
-- For production, consider using Supabase Edge Functions with Deno.cron or external schedulers

CREATE OR REPLACE FUNCTION public.cleanup_verification_temp()
RETURNS TABLE(deleted_count INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $CLEANUP$
DECLARE
  files_to_delete TEXT[];
  delete_count INTEGER := 0;
BEGIN
  -- Get list of files older than 24 hours
  SELECT ARRAY_AGG(name) INTO files_to_delete
  FROM storage.objects
  WHERE bucket_id = 'verification-temp'
    AND created_at < now() - interval '24 hours';

  -- If there are files to delete
  IF files_to_delete IS NOT NULL AND array_length(files_to_delete, 1) > 0 THEN
    -- Delete files using storage API
    FOR i IN 1..array_length(files_to_delete, 1) LOOP
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'verification-temp' AND name = files_to_delete[i];
        delete_count := delete_count + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete file %: %', files_to_delete[i], SQLERRM;
      END;
    END LOOP;
  END IF;

  RETURN QUERY SELECT delete_count, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 0, SQLERRM;
END;
$CLEANUP$;

-- Grant execute permission to authenticated users (admins can run cleanup manually)
GRANT EXECUTE ON FUNCTION public.cleanup_verification_temp() TO authenticated;

-- =====================================================
-- Notes on Cleanup Scheduling
-- =====================================================
-- For production deployment:
-- Option 1: Supabase Edge Function with Deno.cron (recommended for Supabase Cloud)
--   - Create an edge function that calls this cleanup_verification_temp() function
--   - Use Deno.cron to schedule it hourly
--
-- Option 2: External scheduler (GitHub Actions, etc.)
--   - Create a scheduled workflow that calls the Supabase RPC endpoint
--   - Example: POST https://your-project.supabase.co/rest/v1/rpc/cleanup_verification_temp
--
-- Option 3: Manual cleanup
--   - Admins can call: SELECT * FROM public.cleanup_verification_temp();
--
-- pg_cron is not used to maintain compatibility with local development and various deployment environments.

-- =====================================================
-- Notes on CORS
-- =====================================================
-- CORS for Supabase Storage uploads is configured at the platform level.
-- For local CLI, default storage service permits typical dev origins. Validate via frontend upload.
-- In production, set allowed origins/headers in Supabase Studio (Storage settings) to include your app domains.
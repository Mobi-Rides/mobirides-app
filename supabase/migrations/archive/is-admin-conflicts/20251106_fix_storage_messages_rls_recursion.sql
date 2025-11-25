-- Migration: Fix RLS recursion triggered when listing storage.objects
-- Scope: Inline policies on storage.objects and public.messages; remove function-based checks

DO $$
BEGIN
  -- STORAGE.OBJECTS
  -- Drop possibly conflicting policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-temp_users_select'
  ) THEN
    DROP POLICY "verification-temp_users_select" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-documents_users_select'
  ) THEN
    DROP POLICY "verification-documents_users_select" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification-selfies_users_select'
  ) THEN
    DROP POLICY "verification-selfies_users_select" ON storage.objects;
  END IF;

  -- Recreate clean, self-contained policies
  -- Admin policy: only create if public.admins exists; otherwise skip admin bypass
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admins'
  ) THEN
    CREATE POLICY "verification_admin_read_all"
      ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id IN ('verification-documents','verification-selfies','verification-temp')
        AND EXISTS (
          SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
      );
  END IF;

  CREATE POLICY "verification-temp_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-temp'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "verification-documents_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "verification-selfies_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-selfies'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- MESSAGES
  -- Drop existing policies to remove function-based checks
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Admins can view all messages'
  ) THEN
    DROP POLICY "Admins can view all messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can view their own messages'
  ) THEN
    DROP POLICY "Users can view their own messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can insert their own messages'
  ) THEN
    DROP POLICY "Users can insert their own messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can update their own messages'
  ) THEN
    DROP POLICY "Users can update their own messages" ON public.messages;
  END IF;

  -- Recreate clean messages policies with inline admin check
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admins'
  ) THEN
    CREATE POLICY "Admins can view all messages"
      ON public.messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
      );
  END IF;

  CREATE POLICY "Users can view their own messages"
    ON public.messages
    FOR SELECT TO authenticated
    USING (
      sender_id = auth.uid() OR receiver_id = auth.uid()
    );

  CREATE POLICY "Users can insert their own messages"
    ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
    );

  CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE TO authenticated
    USING (
      sender_id = auth.uid()
    )
    WITH CHECK (
      sender_id = auth.uid()
    );
END $$;

COMMENT ON POLICY "verification_admin_read_all" ON storage.objects IS 'Admin policy inlined to public.admins EXISTS; avoids function recursion';
COMMENT ON POLICY "verification-temp_users_select" ON storage.objects IS 'User policy checks userId prefix via storage.foldername(name)';
COMMENT ON POLICY "verification-documents_users_select" ON storage.objects IS 'User policy checks userId prefix via storage.foldername(name)';
COMMENT ON POLICY "verification-selfies_users_select" ON storage.objects IS 'User policy checks userId prefix via storage.foldername(name)';
COMMENT ON POLICY "Admins can view all messages" ON public.messages IS 'Admin view policy only references public.admins';
COMMENT ON POLICY "Users can view their own messages" ON public.messages IS 'User view policy only references sender_id/receiver_id';
COMMENT ON POLICY "Users can insert their own messages" ON public.messages IS 'User insert policy only references sender_id';
COMMENT ON POLICY "Users can update their own messages" ON public.messages IS 'User update policy only references sender_id';
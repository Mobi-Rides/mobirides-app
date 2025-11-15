-- Comprehensive RLS Recursion Fix
-- Purpose: Fix all remaining sources of infinite recursion in RLS policies
-- This addresses the issue where storage.list() and direct messages access
-- both trigger "infinite recursion detected in policy for relation 'messages'"

DO $$
BEGIN
  -- ===================================================================
  -- STEP 1: Remove all existing policies that might cause recursion
  -- ===================================================================
  
  -- Drop any remaining messages policies that might reference other tables
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can view their own messages'
  ) THEN
    DROP POLICY "Users can view their own messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can insert their own messages'
  ) THEN
    DROP POLICY "Users can insert their own messages" ON public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can update their own messages'
  ) THEN
    DROP POLICY "Users can update their own messages" ON public.messages;
  END IF;

  -- Drop any storage policies that might reference messages
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can view their own files'
  ) THEN
    DROP POLICY "Users can view their own files" ON storage.objects;
  END IF;

  -- ===================================================================
  -- STEP 2: Recreate messages policies with NO cross-references
  -- ===================================================================
  
  -- Policy 1: Users can view messages they sent or received
  CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

  -- Policy 2: Users can insert messages (they are the sender)
  CREATE POLICY "Users can insert their own messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

  -- Policy 3: Users can update their own messages (limited fields)
  CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() = sender_id
  )
  WITH CHECK (
    auth.uid() = sender_id
  );

  -- Policy 4: Admins can view all messages (already inlined)
  -- This should already exist from previous migration, but ensure it's clean
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Admins can view all messages'
  ) THEN
    CREATE POLICY "Admins can view all messages"
    ON public.messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
      )
    );
  END IF;

  -- ===================================================================
  -- STEP 3: Recreate storage policies with NO cross-references
  -- ===================================================================
  
  -- Policy 1: Users can manage their own verification files
  CREATE POLICY "Users can manage their verification files"
  ON storage.objects FOR ALL
  USING (
    bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy 2: Admins can read all verification files (already inlined)
  -- This should already exist from previous migration
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification_admin_read_all'
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

  -- ===================================================================
  -- STEP 4: Ensure no functions are called in any policies
  -- ===================================================================
  
  -- Check for any remaining function calls and report them
  RAISE NOTICE 'Checking for remaining function calls in policies...';
  
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage')
      AND tablename IN ('messages', 'objects')
      AND (qual ~ '\w+\s*\(' OR with_check ~ '\w+\s*\(')
  LOOP
    RAISE WARNING 'Function call detected in policy: %.% - %',
      policy_record.schemaname, policy_record.tablename, policy_record.policyname;
  END LOOP;

END $$;

-- Add comments to document the fix
COMMENT ON POLICY "Users can view their own messages" ON public.messages IS
'Simplified policy with no cross-table references to prevent recursion.';

COMMENT ON POLICY "Users can insert their own messages" ON public.messages IS
'Simplified policy ensuring users can only insert their own messages.';

COMMENT ON POLICY "Users can update their own messages" ON public.messages IS
'Simplified policy ensuring users can only update their own messages.';

COMMENT ON POLICY "Users can manage their verification files" ON storage.objects IS
'Simplified policy using only auth.uid() and storage.foldername() to prevent recursion.';
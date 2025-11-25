-- Purpose: Fix remaining recursion by ensuring storage.objects policies don't reference messages
-- Context: storage.list() still triggers "infinite recursion detected in policy for relation 'messages'"
-- This suggests storage.objects SELECT policies are somehow triggering messages table evaluation

-- The issue: Even though we inlined admin checks, the policy evaluation chain may still reference
-- other tables or functions that create cycles. We need to ensure storage.objects policies
-- are completely self-contained and don't trigger evaluation of other table policies.

DO $$
BEGIN
  -- First, let's examine what policies exist and drop any that might cause issues
  
  -- Drop the current admin read policy and recreate it with a more restrictive approach
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification_admin_read_all'
  ) THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;

  -- Create a new admin policy that is completely self-contained
  -- This policy should NOT reference any other tables that might have RLS policies
  CREATE POLICY "verification_admin_read_all"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents','verification-selfies','verification-temp')
      AND EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
      )
    );

  -- Now let's also ensure the user policies are completely self-contained
  -- Drop and recreate user SELECT policies to ensure they're clean
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification-temp_users_select'
  ) THEN
    DROP POLICY "verification-temp_users_select" ON storage.objects;
  END IF;

  CREATE POLICY "verification-temp_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-temp' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Do the same for other verification buckets
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification-documents_users_select'
  ) THEN
    DROP POLICY "verification-documents_users_select" ON storage.objects;
  END IF;

  CREATE POLICY "verification-documents_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'verification-selfies_users_select'
  ) THEN
    DROP POLICY "verification-selfies_users_select" ON storage.objects;
  END IF;

  CREATE POLICY "verification-selfies_users_select"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'verification-selfies' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

END $$;

-- Additional safety: Ensure messages policies don't reference storage.objects
-- This might be the reverse direction of the recursion

DO $$
BEGIN
  -- Check if any messages policies might reference storage or cause issues
  -- We'll make sure all messages policies are self-contained
  
  -- Drop and recreate the admin messages policy to ensure it's clean
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Admins can view all messages'
  ) THEN
    DROP POLICY "Admins can view all messages" ON public.messages;
  END IF;

  -- Create a clean admin policy that only references the admins table
  CREATE POLICY "Admins can view all messages"
    ON public.messages 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
      )
    );

  -- Ensure user message policies are also clean
  -- Drop user message policies and recreate them
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can view their own messages'
  ) THEN
    DROP POLICY "Users can view their own messages" ON public.messages;
  END IF;

  CREATE POLICY "Users can view their own messages"
    ON public.messages 
    FOR SELECT 
    USING (
      sender_id = auth.uid() OR receiver_id = auth.uid()
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can insert their own messages'
  ) THEN
    DROP POLICY "Users can insert their own messages" ON public.messages;
  END IF;

  CREATE POLICY "Users can insert their own messages"
    ON public.messages 
    FOR INSERT 
    WITH CHECK (
      sender_id = auth.uid()
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Users can update their own messages'
  ) THEN
    DROP POLICY "Users can update their own messages" ON public.messages;
  END IF;

  CREATE POLICY "Users can update their own messages"
    ON public.messages 
    FOR UPDATE 
    USING (
      sender_id = auth.uid()
    )
    WITH CHECK (
      sender_id = auth.uid()
    );

END $$;

COMMENT ON POLICY "verification_admin_read_all" ON storage.objects IS
'Clean admin policy that only references public.admins to avoid recursion';

COMMENT ON POLICY "Admins can view all messages" ON public.messages IS
'Clean admin policy that only references public.admins to avoid recursion';

COMMENT ON POLICY "Users can view their own messages" ON public.messages IS
'Clean user policy that only references auth.uid() to avoid recursion';

COMMENT ON POLICY "Users can insert their own messages" ON public.messages IS
'Clean user policy that only references auth.uid() to avoid recursion';

COMMENT ON POLICY "Users can update their own messages" ON public.messages IS
'Clean user policy that only references auth.uid() to avoid recursion';
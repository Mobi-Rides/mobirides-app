-- Purpose: Remove remaining recursion by inlining admin check in messages policy
-- Context: Upload to storage.objects still reports
--   "infinite recursion detected in policy for relation \"messages\""
-- Even after simplifying is_admin(), ensure messages admin policy cannot recurse.

DO $$
BEGIN
  -- Drop existing admin view policy on messages, if present
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND policyname = 'Admins can view all messages'
  ) THEN
    DROP POLICY "Admins can view all messages" ON public.messages;
  END IF;

  -- Recreate admin view policy using inline EXISTS on public.admins
  CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );
END $$;

COMMENT ON POLICY "Admins can view all messages" ON public.messages IS
'Admin bypass uses inline EXISTS on public.admins to avoid function-based recursion.';
-- Fix RLS for conversations table
-- Users should be able to see conversations they are participants in.

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 1. Create policy using the existing is_participant function
-- This avoids recursion because is_participant is SECURITY DEFINER and checks the participants table directly.
CREATE POLICY "view_conversations_as_participant"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_participant(id)
);

-- Note: We might need a policy for INSERT if users create conversations directly, 
-- but we are using RPC `create_conversation_secure` which uses SECURITY DEFINER, so INSERT policy is not strictly needed for creation via RPC.
-- However, if we want to allow direct inserts (not recommended), we would add it.
-- For now, SELECT is the critical missing piece.

-- Ensure no conflicting policies exist
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "select_own_conversations" ON public.conversations;

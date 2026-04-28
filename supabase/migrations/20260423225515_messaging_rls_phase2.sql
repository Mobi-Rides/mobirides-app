-- Phase 2: Messaging RLS Remediation (MOB-23)
-- Updated is_conversation_participant and policies for conversations and participants.

-- 1. Update is_conversation_participant (Preserve signature to keep dependencies)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Update Conversations Select Policy
DROP POLICY IF EXISTS conversations_select_policy ON public.conversations;
CREATE POLICY conversations_select_policy ON public.conversations
  FOR SELECT USING (
    (created_by = auth.uid()) 
    OR 
    public.is_conversation_participant(id) 
    OR 
    public.is_admin(auth.uid())
  );

-- 3. Update Conversation Participants Select Policy
DROP POLICY IF EXISTS conversation_participants_select_policy ON public.conversation_participants;
CREATE POLICY conversation_participants_select_policy ON public.conversation_participants
  FOR SELECT USING (
    (user_id = auth.uid()) 
    OR 
    public.is_conversation_participant(conversation_id) 
    OR 
    public.is_admin(auth.uid())
  );

-- 4. Clean up redundant or conflicting policies
DROP POLICY IF EXISTS view_conversations_as_participant ON public.conversations;
DROP POLICY IF EXISTS view_conversation_peers ON public.conversation_participants;
DROP POLICY IF EXISTS view_own_participation ON public.conversation_participants;

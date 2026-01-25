-- Fix Chat RLS Policies properly using Security Definer function to avoid recursion

-- 1. Create helper function to check participation without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Conversations Policy
-- Users can see conversations they created OR are participants in
DROP POLICY IF EXISTS "conversations_select_policy" ON "public"."conversations";
CREATE POLICY "conversations_select_policy" ON "public"."conversations"
  FOR SELECT USING (
    created_by = auth.uid() OR
    public.is_conversation_participant(id) OR
    public.is_admin(auth.uid())
  );

-- 3. Update Participants Policy
-- Users can see all participants in conversations they belong to
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON "public"."conversation_participants";
CREATE POLICY "conversation_participants_select_policy" ON "public"."conversation_participants"
  FOR SELECT USING (
    user_id = auth.uid() OR -- Can see self
    public.is_conversation_participant(conversation_id) OR -- Can see others in same chat
    public.is_admin(auth.uid())
  );

-- Users can only update their own participation (e.g. last_read_at)
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON "public"."conversation_participants";
CREATE POLICY "conversation_participants_update_policy" ON "public"."conversation_participants"
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 4. Update Messages Policy
-- Users can see messages in conversations they belong to
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON "public"."conversation_messages";
CREATE POLICY "conversation_messages_select_policy" ON "public"."conversation_messages"
  FOR SELECT USING (
    sender_id = auth.uid() OR -- Can see own messages
    public.is_conversation_participant(conversation_id) OR -- Can see others' messages in same chat
    public.is_admin(auth.uid())
  );

-- Users can insert messages if they are participants
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON "public"."conversation_messages";
CREATE POLICY "conversation_messages_insert_policy" ON "public"."conversation_messages"
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    public.is_conversation_participant(conversation_id)
  );

-- Users can update/delete only their own messages
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON "public"."conversation_messages";
CREATE POLICY "conversation_messages_update_policy" ON "public"."conversation_messages"
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON "public"."conversation_messages";
CREATE POLICY "conversation_messages_delete_policy" ON "public"."conversation_messages"
  FOR DELETE USING (sender_id = auth.uid());

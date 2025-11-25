-- CORRECTED FIX: Eliminate infinite recursion in conversation RLS policies
-- This migration properly handles existing policies and creates a clean solution

-- 1. Drop ALL existing conversation-related RLS policies (with CASCADE to handle dependencies)
DO $$ 
BEGIN
    -- Drop conversation policies
    DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_for_participants" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_create_own" ON public.conversations CASCADE;
    DROP POLICY IF EXISTS "conversations_update_participants" ON public.conversations CASCADE;

    -- Drop conversation_participants policies
    DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "Users can view their conversation participants" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "conversation_participants_select_policy" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "conversation_participants_update_policy" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON public.conversation_participants CASCADE;
    DROP POLICY IF EXISTS "participants_own_records_only" ON public.conversation_participants CASCADE;

    -- Drop conversation_messages policies
    DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "conversation_messages_select_policy" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "conversation_messages_update_policy" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "messages_for_participants" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "messages_send_to_participated" ON public.conversation_messages CASCADE;
    DROP POLICY IF EXISTS "messages_update_own" ON public.conversation_messages CASCADE;
END $$;

-- 2. Drop any problematic functions
DROP FUNCTION IF EXISTS public.get_user_conversation_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_access_conversation(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid, uuid) CASCADE;

-- 3. Create a simple, non-recursive helper function
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
$$;

-- 4. Create NEW non-recursive RLS policies

-- CONVERSATION_PARTICIPANTS policies (base table - no dependencies)
-- Users can only see participant records where they are the user
CREATE POLICY "participants_own_records_only_v2"
ON public.conversation_participants
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CONVERSATIONS policies (depends on participants but uses function to avoid recursion)
-- Users can view conversations where they are participants
CREATE POLICY "conversations_for_participants_v2"
ON public.conversations
FOR SELECT
USING (public.is_conversation_participant(id, auth.uid()));

-- Users can create conversations (they become participants via trigger)
CREATE POLICY "conversations_create_own_v2"
ON public.conversations
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Users can update conversations where they are participants
CREATE POLICY "conversations_update_participants_v2"
ON public.conversations
FOR UPDATE
USING (public.is_conversation_participant(id, auth.uid()));

-- CONVERSATION_MESSAGES policies (depends on participants via function)
-- Users can view messages in conversations they participate in
CREATE POLICY "messages_for_participants_v2"
ON public.conversation_messages
FOR SELECT
USING (public.is_conversation_participant(conversation_id, auth.uid()));

-- Users can send messages to conversations they participate in
CREATE POLICY "messages_send_to_participated_v2"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND 
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- Users can update their own messages
CREATE POLICY "messages_update_own_v2"
ON public.conversation_messages
FOR UPDATE
USING (sender_id = auth.uid());

-- 5. Create/recreate trigger to automatically add creator as participant
DROP TRIGGER IF EXISTS add_creator_as_participant ON public.conversations;
DROP FUNCTION IF EXISTS public.add_conversation_creator_as_participant() CASCADE;

CREATE OR REPLACE FUNCTION public.add_conversation_creator_as_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add the creator as a participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (NEW.id, NEW.created_by, true)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER add_creator_as_participant
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_conversation_creator_as_participant();

-- 6. Add unique constraint to prevent duplicate participants (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_conversation_participant' 
        AND conrelid = 'public.conversation_participants'::regclass
    ) THEN
        ALTER TABLE public.conversation_participants 
        ADD CONSTRAINT unique_conversation_participant 
        UNIQUE (conversation_id, user_id);
    END IF;
END $$;

-- 7. Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 8. Grant necessary permissions
GRANT SELECT ON public.conversations TO anon, authenticated;
GRANT INSERT, UPDATE ON public.conversations TO authenticated;

GRANT SELECT ON public.conversation_participants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;

GRANT SELECT ON public.conversation_messages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.conversation_messages TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 9. Create optimized indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON public.conversation_participants(conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
ON public.conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender 
ON public.conversation_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations(created_by);

-- 10. Add helpful comments
COMMENT ON FUNCTION public.is_conversation_participant(uuid, uuid) IS 
'Helper function to check if a user is a participant in a conversation. Used by RLS policies to avoid recursion.';

COMMENT ON POLICY "participants_own_records_only_v2" ON public.conversation_participants IS 
'Base policy: users can only access their own participant records';

COMMENT ON POLICY "conversations_for_participants_v2" ON public.conversations IS 
'Users can view conversations where they are participants (uses helper function to avoid recursion)';

COMMENT ON POLICY "messages_for_participants_v2" ON public.conversation_messages IS 
'Users can view messages in conversations they participate in (uses helper function to avoid recursion)';
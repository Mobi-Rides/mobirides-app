-- ============================================================================
-- Migration: Fix RLS Infinite Recursion with SECURITY DEFINER Functions
-- Date: 2025-11-16
-- Purpose: Resolve "infinite recursion detected in policy" errors by using
--          SECURITY DEFINER functions that bypass RLS when checking permissions
-- ============================================================================

-- ===== STEP 1: DROP EXISTING FUNCTIONS (if they exist with different signatures) =====
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_conversation_creator(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_conversation_admin(uuid, uuid);

-- ===== STEP 2: CREATE SECURITY DEFINER HELPER FUNCTIONS =====
-- These functions prevent infinite recursion in RLS policies by executing with
-- elevated privileges, bypassing RLS checks when querying conversation_participants

-- Function 1: Check if user is a participant in a conversation
CREATE FUNCTION public.is_conversation_participant(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  );
$$;

-- Function 2: Check if user created a conversation
CREATE FUNCTION public.is_conversation_creator(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND c.created_by = _user_id
  );
$$;

-- Function 3: Check if user is admin in a conversation
CREATE FUNCTION public.is_conversation_admin(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
      AND cp.is_admin = true
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated;

-- ===== STEP 3: DROP EXISTING POLICIES =====

-- Drop conversations policies
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

-- Drop conversation_participants policies
DROP POLICY IF EXISTS "participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON public.conversation_participants;

-- Drop conversation_messages policies
DROP POLICY IF EXISTS "messages_select" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_insert" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_update" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_delete" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_select" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_insert" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_update" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_delete" ON public.conversation_messages;

-- ===== STEP 4: CREATE NON-RECURSIVE RLS POLICIES =====

-- ===== CONVERSATIONS TABLE POLICIES =====

-- SELECT: Users can view conversations they participate in OR created
CREATE POLICY "conversations_select"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  -- Creator can view
  auth.uid() = created_by
  OR
  -- Participant can view (non-recursive check)
  EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

-- INSERT: Users can create conversations
CREATE POLICY "conversations_insert"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only creators can update conversations
CREATE POLICY "conversations_update"
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- ===== CONVERSATION_PARTICIPANTS TABLE POLICIES (NON-RECURSIVE) =====

-- SELECT: Users can view participants in conversations they're part of
CREATE POLICY "participants_select"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
  OR public.is_conversation_creator(conversation_id, auth.uid())
);

-- INSERT: Users can add themselves as participants OR conversation creators can add others
CREATE POLICY "participants_insert"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_creator(conversation_id, auth.uid())
);

-- UPDATE: Users can update their own participant record OR admins can update
CREATE POLICY "participants_update"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_conversation_admin(conversation_id, auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_admin(conversation_id, auth.uid())
);

-- DELETE: Creators can remove participants, users can remove themselves
CREATE POLICY "participants_delete"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_conversation_creator(conversation_id, auth.uid())
);

-- ===== CONVERSATION_MESSAGES TABLE POLICIES (NON-RECURSIVE) =====

-- SELECT: Users can view messages in conversations they participate in
CREATE POLICY "messages_select"
ON public.conversation_messages
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- INSERT: Users can send messages to conversations they participate in
CREATE POLICY "messages_insert"
ON public.conversation_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(conversation_id, auth.uid())
);

-- UPDATE: Users can update their own messages
CREATE POLICY "messages_update"
ON public.conversation_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- DELETE: Users can delete their own messages
CREATE POLICY "messages_delete"
ON public.conversation_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- ===== STEP 5: CREATE PERFORMANCE INDEXES =====

-- Index for participant lookups (used in all policies)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
ON public.conversation_participants(user_id, conversation_id);

-- Index for conversation creator lookups
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations(created_by);

-- Index for message sender lookups
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender 
ON public.conversation_messages(sender_id);

-- Index for conversation_id foreign key lookups
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
ON public.conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation 
ON public.conversation_participants(conversation_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- 
-- Summary of Changes:
-- ✅ Dropped old function definitions
-- ✅ Created 3 SECURITY DEFINER functions to break RLS recursion
-- ✅ Dropped all existing recursive policies
-- ✅ Created non-recursive policies using helper functions
-- ✅ Added performance indexes for policy lookups
-- 
-- This fixes: "infinite recursion detected in policy" errors
-- ============================================================================
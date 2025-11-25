-- Fix infinite recursion in conversation RLS policies
-- Uses simple auth.uid() checks + is_admin() for access control
-- This migration drops ALL existing recursive policies and replaces with non-recursive versions

BEGIN;

-- ===== STEP 1: DISABLE RLS TEMPORARILY =====
ALTER TABLE "public"."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" DISABLE ROW LEVEL SECURITY;

-- ===== STEP 2: DROP ALL EXISTING POLICIES =====

-- Drop conversations policies (all variants)
DROP POLICY IF EXISTS "conversations_select_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_update_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_delete_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_select" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_update" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_delete" ON "public"."conversations";
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON "public"."conversations";
DROP POLICY IF EXISTS "Users can create conversations" ON "public"."conversations";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "public"."conversations";

-- Drop conversation_participants policies (all variants)
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "participants_select" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "participants_insert" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "participants_update" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "participants_delete" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_read" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "admins_manage_participants" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "Users can view their conversation participants" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON "public"."conversation_participants";

-- Drop conversation_messages policies (all variants)
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "messages_select" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "messages_insert" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "messages_update" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "messages_delete" ON "public"."conversation_messages";

-- ===== STEP 3: CREATE SIMPLE NON-RECURSIVE POLICIES =====

-- CONVERSATION_PARTICIPANTS: Simple user_id check + admin access
CREATE POLICY "conversation_participants_select_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_participants_insert_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_participants_update_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_participants_delete_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- CONVERSATIONS: Simple created_by check + admin access
CREATE POLICY "conversations_select_policy" ON "public"."conversations"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "conversations_insert_policy" ON "public"."conversations"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "conversations_update_policy" ON "public"."conversations"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "conversations_delete_policy" ON "public"."conversations"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin());

-- CONVERSATION_MESSAGES: Simple sender_id check + admin access
CREATE POLICY "conversation_messages_select_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_messages_insert_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_messages_update_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid() OR public.is_admin())
    WITH CHECK (sender_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_messages_delete_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid() OR public.is_admin());

-- ===== STEP 4: RE-ENABLE RLS =====
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;

-- ===== STEP 5: GRANT PERMISSIONS =====
GRANT ALL ON "public"."conversations" TO authenticated;
GRANT ALL ON "public"."conversation_participants" TO authenticated;
GRANT ALL ON "public"."conversation_messages" TO authenticated;

GRANT SELECT ON "public"."conversations" TO anon;
GRANT SELECT ON "public"."conversation_participants" TO anon;
GRANT SELECT ON "public"."conversation_messages" TO anon;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Conversation RLS policies fixed - infinite recursion resolved with simple policies';
END $$;
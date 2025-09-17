-- Rollback: Remove duplicate foreign key constraints from conversation module
-- This addresses PostgREST embedding errors caused by multiple relationship paths

-- Remove duplicate foreign key constraint from conversations table
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS fk_conversations_profiles;

-- Remove duplicate foreign key constraint from conversation_participants table  
ALTER TABLE conversation_participants 
DROP CONSTRAINT IF EXISTS fk_conversation_participants_profiles;

-- Verify the original constraints remain intact
-- conversations_created_by_fkey should still exist
-- conversation_participants_user_id_fkey should still exist

-- Restore original RLS policy if needed
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON conversations;
CREATE POLICY "conversations_authenticated_insert" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());
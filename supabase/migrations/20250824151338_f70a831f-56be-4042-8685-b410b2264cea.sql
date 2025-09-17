-- Foreign Key Standardization: Conversation Module
-- Step 3: Update conversations table

-- 3.1: Add foreign key constraint for conversations
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_profiles 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3.2: Update RLS policies for conversations
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON conversations;
CREATE POLICY "conversations_authenticated_insert" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Step 4: Update conversation_participants table

-- 4.1: Add foreign key constraint for conversation_participants
ALTER TABLE conversation_participants 
ADD CONSTRAINT fk_conversation_participants_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4.2: Update RLS policies for conversation_participants (review existing policies)
-- The existing policies should work but ensure they reference the correct relationships

-- Verify all existing data integrity before applying constraints
-- This migration will fail if there are any orphaned records that don't have corresponding profile entries
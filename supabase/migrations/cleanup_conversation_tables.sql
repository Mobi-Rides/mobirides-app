-- Cleanup script for conversation-related tables
-- This script deletes all existing records from conversation tables in the correct order
-- to respect foreign key constraints

-- Start transaction
BEGIN;

-- 1. Delete from conversation_messages table first (has foreign keys to conversations and profiles)
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from conversation_messages', deleted_count;
END $$;

-- 2. Delete from conversation_participants table (has foreign keys to conversations and profiles)
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_participants;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from conversation_participants', deleted_count;
END $$;

-- 3. Clear foreign key references in messages table first
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE messages SET migrated_to_conversation_id = NULL WHERE migrated_to_conversation_id IS NOT NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Cleared % foreign key references in messages table', updated_count;
END $$;

-- 4. Delete from conversations table (now safe to delete)
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversations;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from conversations', deleted_count;
END $$;

-- 5. Delete any remaining records from the old messages table
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % records from messages', deleted_count;
END $$;

-- Reset sequences if needed (for tables with auto-incrementing IDs)
-- Note: conversation_messages, conversation_participants, and conversations use UUID primary keys
-- so no sequence reset is needed

-- Commit the transaction
COMMIT;

-- Verify cleanup
SELECT 
    'conversation_messages' as table_name, 
    COUNT(*) as remaining_records 
FROM conversation_messages
UNION ALL
SELECT 
    'conversation_participants' as table_name, 
    COUNT(*) as remaining_records 
FROM conversation_participants
UNION ALL
SELECT 
    'conversations' as table_name, 
    COUNT(*) as remaining_records 
FROM conversations
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as remaining_records 
FROM messages;

-- Display completion message
SELECT 'Conversation tables cleanup completed successfully!' AS status;
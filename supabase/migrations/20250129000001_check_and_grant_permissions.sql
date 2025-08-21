-- Check and grant permissions for tables causing ERR_ABORTED errors

-- Grant permissions for conversations table
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT ON conversations TO anon;

-- Grant permissions for conversation_participants table
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT ON conversation_participants TO anon;

-- Grant permissions for conversation_messages table
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_messages TO authenticated;
GRANT SELECT ON conversation_messages TO anon;

-- Grant permissions for messages table
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT ON messages TO anon;

-- Grant permissions for notifications table
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- Check current permissions (this will show in the migration output)
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages', 'messages', 'notifications') 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
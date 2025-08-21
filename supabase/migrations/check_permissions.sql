-- Check current permissions for conversations table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for conversations table
GRANT SELECT ON conversations TO anon;

-- Grant full permissions to authenticated role for conversations table
GRANT ALL PRIVILEGES ON conversations TO authenticated;

-- Check permissions for conversation_participants table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'conversation_participants'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for conversation_participants table
GRANT SELECT ON conversation_participants TO anon;

-- Grant full permissions to authenticated role for conversation_participants table
GRANT ALL PRIVILEGES ON conversation_participants TO authenticated;

-- Check permissions for conversation_messages table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'conversation_messages'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for conversation_messages table
GRANT SELECT ON conversation_messages TO anon;

-- Grant full permissions to authenticated role for conversation_messages table
GRANT ALL PRIVILEGES ON conversation_messages TO authenticated;
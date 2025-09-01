-- Check remaining conversations in the database
SELECT 
    id,
    title,
    type,
    created_at,
    created_by
FROM conversations
ORDER BY created_at DESC;

-- Check conversation participants
SELECT 
    cp.conversation_id,
    cp.user_id,
    p.full_name,
    c.title
FROM conversation_participants cp
JOIN conversations c ON cp.conversation_id = c.id
JOIN profiles p ON cp.user_id = p.id
ORDER BY c.created_at DESC;

-- Check conversation messages
SELECT 
    cm.id,
    cm.conversation_id,
    cm.sender_id,
    p.full_name as sender_name,
    cm.content,
    cm.created_at,
    c.title as conversation_title
FROM conversation_messages cm
JOIN conversations c ON cm.conversation_id = c.id
JOIN profiles p ON cm.sender_id = p.id
ORDER BY cm.created_at DESC
LIMIT 20;
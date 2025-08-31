-- Clean up only test conversations and related data (safer approach)

-- First, delete conversation messages for test conversations
DELETE FROM conversation_messages 
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE title ILIKE '%test%' OR title ILIKE '%arnold%' OR title ILIKE '%boitumelo%'
);

-- Delete conversation participants for test conversations
DELETE FROM conversation_participants 
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE title ILIKE '%test%' OR title ILIKE '%arnold%' OR title ILIKE '%boitumelo%'
);

-- Delete the test conversations themselves
DELETE FROM conversations 
WHERE title ILIKE '%test%' OR title ILIKE '%arnold%' OR title ILIKE '%boitumelo%';

-- Show remaining conversations after cleanup
SELECT 
    COUNT(*) as remaining_conversations
FROM conversations;

SELECT 
    id,
    title,
    type,
    created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;
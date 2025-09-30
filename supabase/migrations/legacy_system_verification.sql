-- Legacy Message System Removal Verification Script
-- This script verifies the current state before removing the legacy system

-- 1. Check if legacy messages table exists and count records
SELECT 
    'Legacy Messages Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    (SELECT COUNT(*) FROM public.messages WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')) as record_count;

-- 2. Check migration status of legacy messages (if table exists)
SELECT 
    'Migration Status' as check_type,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN migrated_to_conversation_id IS NOT NULL THEN 1 END) as migrated_count,
    COUNT(CASE WHEN migrated_to_conversation_id IS NULL THEN 1 END) as unmigrated_count
FROM public.messages 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages');

-- 3. Check conversation system tables
SELECT 
    'Conversation System Status' as check_type,
    (SELECT COUNT(*) FROM public.conversations) as conversation_count,
    (SELECT COUNT(*) FROM public.conversation_participants) as participant_count,
    (SELECT COUNT(*) FROM public.conversation_messages) as message_count;

-- 4. Sample legacy messages (if any exist)
SELECT 
    'Sample Legacy Messages' as check_type,
    id,
    sender_id,
    receiver_id,
    content,
    status,
    migrated_to_conversation_id,
    created_at
FROM public.messages 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Sample conversation messages
SELECT 
    'Sample Conversation Messages' as check_type,
    cm.id,
    cm.conversation_id,
    cm.sender_id,
    cm.content,
    cm.message_type,
    cm.created_at,
    c.title as conversation_title
FROM public.conversation_messages cm
JOIN public.conversations c ON cm.conversation_id = c.id
ORDER BY cm.created_at DESC 
LIMIT 5;

-- 6. Check for foreign key relationships to legacy table
SELECT 
    'Legacy Table Dependencies' as check_type,
    tc.table_name as dependent_table,
    kcu.column_name as dependent_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'messages';

-- 7. Check for RLS policies on legacy table
SELECT 
    'Legacy Table RLS Policies' as check_type,
    pol.policyname as policy_name,
    pol.cmd as command_type,
    pol.qual as policy_qualification
FROM pg_policies pol
WHERE pol.tablename = 'messages';

-- 8. Check for indexes on legacy table
SELECT 
    'Legacy Table Indexes' as check_type,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'messages';

-- 9. Check conversation system foreign key integrity
SELECT 
    'Conversation FK Integrity' as check_type,
    'conversation_participants -> conversations' as relationship,
    COUNT(*) as orphaned_count
FROM public.conversation_participants cp
WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cp.conversation_id);

SELECT 
    'Conversation FK Integrity' as check_type,
    'conversation_messages -> conversations' as relationship,
    COUNT(*) as orphaned_count
FROM public.conversation_messages cm
WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cm.conversation_id);

SELECT 
    'Conversation FK Integrity' as check_type,
    'conversation_messages -> profiles' as relationship,
    COUNT(*) as orphaned_count
FROM public.conversation_messages cm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = cm.sender_id);
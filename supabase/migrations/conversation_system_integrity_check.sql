-- Conversation System Integrity Verification
-- This script thoroughly checks the conversation system before legacy removal

-- 1. Foreign Key Integrity Check
SELECT 
    'Foreign Key Integrity' as check_type,
    'conversation_participants -> conversations' as relationship,
    COUNT(*) as orphaned_records
FROM public.conversation_participants cp
WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cp.conversation_id);

SELECT 
    'Foreign Key Integrity' as check_type,
    'conversation_participants -> profiles' as relationship,
    COUNT(*) as orphaned_records
FROM public.conversation_participants cp
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = cp.user_id);

SELECT 
    'Foreign Key Integrity' as check_type,
    'conversation_messages -> conversations' as relationship,
    COUNT(*) as orphaned_records
FROM public.conversation_messages cm
WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cm.conversation_id);

SELECT 
    'Foreign Key Integrity' as check_type,
    'conversation_messages -> profiles' as relationship,
    COUNT(*) as orphaned_records
FROM public.conversation_messages cm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = cm.sender_id);

-- 2. Data Consistency Check
SELECT 
    'Data Consistency' as check_type,
    'Conversations without participants' as issue_type,
    COUNT(*) as count
FROM public.conversations c
WHERE NOT EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = c.id);

SELECT 
    'Data Consistency' as check_type,
    'Conversations without messages' as issue_type,
    COUNT(*) as count
FROM public.conversations c
WHERE NOT EXISTS (SELECT 1 FROM public.conversation_messages cm WHERE cm.conversation_id = c.id);

-- 3. RLS Policy Verification
SELECT 
    'RLS Policy Check' as check_type,
    tablename as table_name,
    COUNT(*) as policy_count,
    CASE WHEN COUNT(*) > 0 THEN 'ACTIVE' ELSE 'MISSING' END as status
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
GROUP BY tablename
ORDER BY tablename;

-- 4. Performance Index Verification
SELECT 
    'Performance Indexes' as check_type,
    t.tablename as table_name,
    COUNT(i.indexname) as index_count,
    STRING_AGG(i.indexname, ', ') as index_names
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename
WHERE t.tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
GROUP BY t.tablename
ORDER BY t.tablename;

-- 5. Recent Activity Check
SELECT 
    'Recent Activity' as check_type,
    'Conversations created last 30 days' as activity_type,
    COUNT(*) as count,
    MAX(created_at) as latest_activity
FROM public.conversations 
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

SELECT 
    'Recent Activity' as check_type,
    'Messages sent last 30 days' as activity_type,
    COUNT(*) as count,
    MAX(created_at) as latest_activity
FROM public.conversation_messages 
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- 6. System Health Metrics
SELECT 
    'System Health' as check_type,
    'Total conversations' as metric,
    COUNT(*) as value
FROM public.conversations;

SELECT 
    'System Health' as check_type,
    'Total conversation participants' as metric,
    COUNT(*) as value
FROM public.conversation_participants;

SELECT 
    'System Health' as check_type,
    'Total conversation messages' as metric,
    COUNT(*) as value
FROM public.conversation_messages;

-- 7. Check for duplicate or conflicting data
SELECT 
    'Data Quality' as check_type,
    'Duplicate conversation participants' as issue_type,
    COUNT(*) as duplicate_count
FROM (
    SELECT conversation_id, user_id, COUNT(*) as cnt
    FROM public.conversation_participants
    GROUP BY conversation_id, user_id
    HAVING COUNT(*) > 1
) duplicates;

-- 8. Verify conversation system can handle load
SELECT 
    'Load Capacity' as check_type,
    'Average messages per conversation' as metric,
    ROUND(AVG(message_count), 2) as value
FROM (
    SELECT conversation_id, COUNT(*) as message_count
    FROM public.conversation_messages
    GROUP BY conversation_id
) conversation_stats;

-- 9. Check for any references to legacy system in conversation data
SELECT 
    'Legacy Reference Check' as check_type,
    'Conversations with legacy references' as check_name,
    COUNT(*) as count
FROM public.conversations 
WHERE title LIKE '%legacy%';

-- 10. Final readiness check
SELECT 
    'System Readiness' as check_type,
    'All integrity checks passed' as check_name,
    CASE 
        WHEN 
            (SELECT COUNT(*) FROM public.conversation_participants cp WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cp.conversation_id)) = 0
            AND (SELECT COUNT(*) FROM public.conversation_messages cm WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = cm.conversation_id)) = 0
            AND (SELECT COUNT(*) FROM public.conversation_participants cp WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = cp.user_id)) = 0
            AND (SELECT COUNT(*) FROM public.conversation_messages cm WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = cm.sender_id)) = 0
        THEN 'READY'
        ELSE 'ISSUES_FOUND'
    END as status;
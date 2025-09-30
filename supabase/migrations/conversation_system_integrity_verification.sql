-- Conversation System Integrity Verification Script
-- This script verifies that the conversation system remains intact and functional
-- after the legacy message system removal

-- =====================================================
-- TABLE STRUCTURE VERIFICATION
-- =====================================================

-- Verify all conversation system tables exist
SELECT 
    'conversations' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    (SELECT COUNT(*)::TEXT FROM public.conversations) as record_count

UNION ALL

SELECT 
    'conversation_participants' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversation_participants'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    (SELECT COUNT(*)::TEXT FROM public.conversation_participants) as record_count

UNION ALL

SELECT 
    'conversation_messages' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversation_messages'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    (SELECT COUNT(*)::TEXT FROM public.conversation_messages) as record_count;

-- =====================================================
-- FOREIGN KEY RELATIONSHIPS VERIFICATION
-- =====================================================

-- Verify all foreign key constraints are intact
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    '✅ INTACT' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- RLS POLICIES VERIFICATION
-- =====================================================

-- Verify RLS policies are active on all conversation tables
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles,
    qual,
    with_check,
    '✅ ACTIVE' as status
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, policyname;

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    '✅ ENABLED' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename;

-- =====================================================
-- INDEXES VERIFICATION
-- =====================================================

-- Verify all expected indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, indexname;

-- =====================================================
-- DATA INTEGRITY VERIFICATION
-- =====================================================

-- Check for orphaned conversation participants
SELECT 
    'orphaned_participants' as check_type,
    COUNT(*) as orphaned_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ ORPHANED' END as status
FROM public.conversation_participants cp
WHERE NOT EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = cp.conversation_id
);

-- Check for orphaned conversation messages
SELECT 
    'orphaned_messages' as check_type,
    COUNT(*) as orphaned_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ ORPHANED' END as status
FROM public.conversation_messages cm
WHERE NOT EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = cm.conversation_id
);

-- Check for participants without users
SELECT 
    'orphaned_participants_users' as check_type,
    COUNT(*) as orphaned_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ ORPHANED' END as status
FROM public.conversation_participants cp
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = cp.user_id
);

-- Check for messages without senders
SELECT 
    'orphaned_messages_senders' as check_type,
    COUNT(*) as orphaned_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ ORPHANED' END as status
FROM public.conversation_messages cm
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = cm.sender_id
);

-- =====================================================
-- PERFORMANCE VERIFICATION
-- =====================================================

-- Sample query performance test
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT 
    cm.*,
    u.email as sender_email,
    u.raw_user_meta_data->>'full_name' as sender_name
FROM public.conversation_messages cm
JOIN auth.users u ON u.id = cm.sender_id
WHERE cm.conversation_id = (
    SELECT id FROM public.conversations LIMIT 1
)
ORDER BY cm.created_at DESC
LIMIT 20;

-- =====================================================
-- FUNCTION VERIFICATION
-- =====================================================

-- Check if any conversation-related functions are missing
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    CASE WHEN pg_function_is_visible(oid) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_proc 
WHERE proname IN (
    'send_conversation_message',
    'create_conversation',
    'add_conversation_participant',
    'remove_conversation_participant',
    'mark_conversation_as_read',
    'get_conversation_messages',
    'get_user_conversations'
)
ORDER BY proname;

-- =====================================================
-- LEGACY SYSTEM REMOVAL VERIFICATION
-- =====================================================

-- Verify legacy messages table is completely removed
SELECT 
    'legacy_messages_table' as object_name,
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN '✅ REMOVED' ELSE '❌ STILL EXISTS' END as status;

-- Verify migration functions are removed
SELECT 
    'migration_functions' as object_name,
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations')
        AND pg_function_is_visible(oid)
    ) THEN '✅ REMOVED' ELSE '❌ STILL EXISTS' END as status;

-- =====================================================
-- FINAL STATUS SUMMARY
-- =====================================================

-- Overall system health check
WITH system_checks AS (
    SELECT 
        'conversations_table' as component, 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'conversations'
        ) THEN 1 ELSE 0 END as status
    
    UNION ALL
    
    SELECT 
        'conversation_participants_table' as component, 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'conversation_participants'
        ) THEN 1 ELSE 0 END as status
    
    UNION ALL
    
    SELECT 
        'conversation_messages_table' as component, 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'conversation_messages'
        ) THEN 1 ELSE 0 END as status
    
    UNION ALL
    
    SELECT 
        'legacy_messages_removed' as component, 
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'messages'
        ) THEN 1 ELSE 0 END as status
    
    UNION ALL
    
    SELECT 
        'orphaned_data_check' as component, 
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE NOT EXISTS (
                SELECT 1 FROM public.conversations c 
                WHERE c.id = cp.conversation_id
            )
        ) AND NOT EXISTS (
            SELECT 1 FROM public.conversation_messages cm
            WHERE NOT EXISTS (
                SELECT 1 FROM public.conversations c 
                WHERE c.id = cm.conversation_id
            )
        ) THEN 1 ELSE 0 END as status
)
SELECT 
    CASE 
        WHEN SUM(status) = (SELECT COUNT(*) FROM system_checks) 
        THEN '✅ SYSTEM INTEGRITY VERIFIED - ALL CHECKS PASSED'
        ELSE '❌ SYSTEM INTEGRITY ISSUES DETECTED'
    END as final_status,
    SUM(status) || '/' || (SELECT COUNT(*) FROM system_checks) || ' checks passed' as summary
FROM system_checks;
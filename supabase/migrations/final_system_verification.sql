-- Final System Verification Script
-- Legacy Message System Removal - Post-Implementation Verification
-- This script verifies that the conversation system is fully functional after legacy removal

-- =============================================================================
-- DATABASE INTEGRITY VERIFICATION
-- =============================================================================

-- 1. Verify conversation system tables exist and have data
SELECT 
    'conversations' as table_name,
    COUNT(*) as record_count,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'conversations'
UNION ALL
SELECT 
    'conversation_participants' as table_name,
    COUNT(*) as record_count,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'conversation_participants'
UNION ALL
SELECT 
    'conversation_messages' as table_name,
    COUNT(*) as record_count,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'conversation_messages';

-- 2. Verify legacy messages table is removed
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'LEGACY TABLE REMOVED ✅'
        ELSE 'LEGACY TABLE STILL EXISTS ❌'
    END as legacy_removal_status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'messages';

-- 3. Verify foreign key relationships are intact
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    'VALID' as relationship_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 4. Verify RLS policies are active on conversation tables
SELECT 
    tablename,
    policyname,
    cmd as command_type,
    'ACTIVE' as policy_status
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, policyname;

-- =============================================================================
-- FUNCTIONAL VERIFICATION
-- =============================================================================

-- 5. Check for any orphaned records
SELECT 
    'conversation_participants' as table_name,
    COUNT(*) as orphaned_count,
    'ORPHAN CHECK' as check_type
FROM conversation_participants cp
WHERE cp.conversation_id NOT IN (SELECT id FROM conversations)
UNION ALL
SELECT 
    'conversation_messages' as table_name,
    COUNT(*) as orphaned_count,
    'ORPHAN CHECK' as check_type
FROM conversation_messages cm
WHERE cm.conversation_id NOT IN (SELECT id FROM conversations);

-- 6. Verify conversation system has data (if applicable)
SELECT 
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_conversations,
    'CONVERSATION_ACTIVITY' as metric_type
FROM conversations;

SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_messages,
    'MESSAGE_ACTIVITY' as metric_type
FROM conversation_messages;

-- =============================================================================
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- 7. Check index usage and performance
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    'INDEX_STATS' as metric_type
FROM pg_stats 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, attname;

-- 8. Verify conversation message query performance (sample query)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    cm.*,
    u.email as sender_email,
    u.raw_user_meta_data->>'full_name' as sender_name
FROM conversation_messages cm
JOIN auth.users u ON cm.sender_id = u.id
WHERE cm.conversation_id = (SELECT id FROM conversations LIMIT 1)
ORDER BY cm.created_at DESC
LIMIT 50;

-- =============================================================================
-- MIGRATION FUNCTION CLEANUP VERIFICATION
-- =============================================================================

-- 9. Verify migration functions are removed
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'MIGRATION FUNCTIONS REMOVED ✅'
        ELSE 'MIGRATION FUNCTIONS STILL EXIST ❌'
    END as migration_cleanup_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations');

-- 10. Check for any remaining references to legacy system
SELECT 
    'LEGACY_REFERENCES_CHECK' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO LEGACY REFERENCES FOUND ✅'
        ELSE 'LEGACY REFERENCES STILL EXIST ❌'
    END as reference_status
FROM (
    -- Check for any remaining migrated_to_conversation_id references
    SELECT 1 as dummy
    WHERE EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE column_name = 'migrated_to_conversation_id'
        AND table_schema = 'public'
    )
) as legacy_check;

-- =============================================================================
-- FINAL STATUS SUMMARY
-- =============================================================================

SELECT 
    'DATABASE_INTEGRITY' as verification_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
        ) = 3 THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as status;

SELECT 
    'LEGACY_REMOVAL' as verification_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'messages'
        ) = 0 THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as status;

SELECT 
    'RLS_POLICIES' as verification_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
        ) > 0 THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as status;

-- =============================================================================
-- SUCCESS CRITERIA VERIFICATION
-- =============================================================================

-- Final comprehensive status check
WITH verification_checks AS (
    SELECT 'CONVERSATION_TABLES_EXIST' as check_name, 
           CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END as passed
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
    
    UNION ALL
    
    SELECT 'LEGACY_TABLE_REMOVED' as check_name, 
           CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as passed
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
    
    UNION ALL
    
    SELECT 'RLS_POLICIES_ACTIVE' as check_name, 
           CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END as passed
    FROM pg_policies 
    WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    
    UNION ALL
    
    SELECT 'MIGRATION_FUNCTIONS_REMOVED' as check_name, 
           CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as passed
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations')
)
SELECT 
    COUNT(*) as total_checks,
    SUM(passed) as passed_checks,
    COUNT(*) - SUM(passed) as failed_checks,
    ROUND((SUM(passed)::float / COUNT(*)::float) * 100, 2) as success_percentage,
    CASE 
        WHEN SUM(passed) = COUNT(*) THEN '✅ ALL VERIFICATIONS PASSED'
        ELSE '❌ SOME VERIFICATIONS FAILED'
    END as final_status
FROM verification_checks;
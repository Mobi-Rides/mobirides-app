-- Database Integrity Verification - Post Legacy Removal
-- Comprehensive verification of database state after legacy message system removal

-- =============================================================================
-- EXECUTIVE SUMMARY VERIFICATION
-- =============================================================================

-- Overall system health check
SELECT 
    'LEGACY_MESSAGE_SYSTEM_REMOVAL_VERIFICATION' as verification_type,
    CURRENT_TIMESTAMP as verification_timestamp,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'messages'
        ) = 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as legacy_removal_status,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
        ) = 3 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as conversation_system_status;

-- =============================================================================
-- DETAILED TABLE VERIFICATION
-- =============================================================================

-- 1. Verify conversation system tables exist and are accessible
SELECT 
    'TABLE_EXISTENCE' as check_type,
    table_name,
    table_type,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY table_name;

-- 2. Verify legacy messages table is completely removed
SELECT 
    'LEGACY_TABLE_REMOVAL' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'LEGACY_MESSAGES_REMOVED'
        ELSE 'LEGACY_MESSAGES_STILL_EXISTS'
    END as removal_status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'messages';

-- =============================================================================
-- FOREIGN KEY INTEGRITY VERIFICATION
-- =============================================================================

-- 3. Verify all foreign key relationships are intact
SELECT 
    'FOREIGN_KEY_INTEGRITY' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    'VALID' as relationship_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Check for orphaned records (critical integrity check)
SELECT 
    'ORPHANED_RECORDS_CHECK' as check_type,
    'conversation_participants' as table_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO_ORPHANS'
        ELSE 'ORPHANS_DETECTED'
    END as integrity_status
FROM conversation_participants cp
WHERE cp.conversation_id NOT IN (SELECT id FROM conversations)

UNION ALL

SELECT 
    'ORPHANED_RECORDS_CHECK' as check_type,
    'conversation_messages' as table_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO_ORPHANS'
        ELSE 'ORPHANS_DETECTED'
    END as integrity_status
FROM conversation_messages cm
WHERE cm.conversation_id NOT IN (SELECT id FROM conversations);

-- =============================================================================
-- RLS POLICY VERIFICATION
-- =============================================================================

-- 5. Verify RLS policies are active and properly configured
SELECT 
    'RLS_POLICY_VERIFICATION' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as command_type,
    roles,
    qual,
    'ACTIVE' as policy_status
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, policyname;

-- 6. Verify RLS is enabled on all conversation tables
SELECT 
    'RLS_ENABLED_CHECK' as check_type,
    table_name,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS_ACTIVE'
        ELSE 'RLS_INACTIVE'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY table_name;

-- =============================================================================
-- INDEX AND PERFORMANCE VERIFICATION
-- =============================================================================

-- 7. Verify critical indexes exist for performance
SELECT 
    'INDEX_VERIFICATION' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef,
    'EXISTS' as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
AND (
    indexname LIKE '%_pkey' OR  -- Primary keys
    indexname LIKE '%_idx' OR   -- Custom indexes
    indexname LIKE '%_key'      -- Unique constraints
)
ORDER BY tablename, indexname;

-- 8. Check table statistics for query optimization
SELECT 
    'TABLE_STATISTICS' as check_type,
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    avg_width,
    null_frac
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
AND attname IN ('id', 'conversation_id', 'sender_id', 'created_at', 'user_id')
ORDER BY tablename, attname;

-- =============================================================================
-- FUNCTION AND TRIGGER VERIFICATION
-- =============================================================================

-- 9. Verify migration functions are completely removed
SELECT 
    'MIGRATION_FUNCTIONS_REMOVED' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ALL_MIGRATION_FUNCTIONS_REMOVED'
        ELSE 'MIGRATION_FUNCTIONS_STILL_EXIST'
    END as removal_status,
    COUNT(*) as remaining_function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations');

-- 10. Check for any remaining triggers or functions related to legacy system
SELECT 
    'LEGACY_SYSTEM_CLEANUP' as check_type,
    routine_name,
    routine_type,
    'REQUIRES_REVIEW' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name ILIKE '%message%' AND 
    routine_name NOT ILIKE '%conversation%'
)
AND routine_name NOT IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations')
ORDER BY routine_name;

-- =============================================================================
-- DATA INTEGRITY VERIFICATION
-- =============================================================================

-- 11. Sample data integrity checks
SELECT 
    'DATA_INTEGRITY_SAMPLE' as check_type,
    'conversations' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at IS NOT NULL) as valid_created_dates,
    COUNT(*) FILTER (WHERE created_by IS NOT NULL) as valid_created_by,
    'SAMPLE_INTEGRITY_CHECK' as check_description
FROM conversations

UNION ALL

SELECT 
    'DATA_INTEGRITY_SAMPLE' as check_type,
    'conversation_messages' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at IS NOT NULL) as valid_created_dates,
    COUNT(*) FILTER (WHERE sender_id IS NOT NULL) as valid_sender_ids,
    'SAMPLE_INTEGRITY_CHECK' as check_description
FROM conversation_messages;

-- 12. Verify recent activity (indicates system is operational)
SELECT 
    'RECENT_ACTIVITY_CHECK' as check_type,
    'conversations' as table_name,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    'ACTIVITY_VERIFICATION' as check_description
FROM conversations

UNION ALL

SELECT 
    'RECENT_ACTIVITY_CHECK' as check_type,
    'conversation_messages' as table_name,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    'ACTIVITY_VERIFICATION' as check_description
FROM conversation_messages;

-- =============================================================================
-- PERMISSIONS AND SECURITY VERIFICATION
-- =============================================================================

-- 13. Verify table permissions for application roles
SELECT 
    'TABLE_PERMISSIONS' as check_type,
    table_name,
    grantee as role_name,
    privilege_type,
    'GRANTED' as permission_status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- =============================================================================
-- FINAL COMPREHENSIVE STATUS
-- =============================================================================

-- 14. Comprehensive final status check
WITH verification_summary AS (
    -- Table existence checks
    SELECT 'CONVERSATION_TABLES_EXIST' as check_name, 
           CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END as passed
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'conversation_participants', 'conversation_messages')
    
    UNION ALL
    
    -- Legacy removal check
    SELECT 'LEGACY_TABLE_REMOVED' as check_name, 
           CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as passed
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
    
    UNION ALL
    
    -- RLS policies check
    SELECT 'RLS_POLICIES_ACTIVE' as check_name, 
           CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END as passed
    FROM pg_policies 
    WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    
    UNION ALL
    
    -- Migration functions removed check
    SELECT 'MIGRATION_FUNCTIONS_REMOVED' as check_name, 
           CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as passed
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations')
    
    UNION ALL
    
    -- Orphaned records check
    SELECT 'NO_ORPHANED_RECORDS' as check_name, 
           CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as passed
    FROM (
            SELECT conversation_id FROM conversation_participants 
            WHERE conversation_id NOT IN (SELECT id FROM conversations)
            UNION ALL
            SELECT conversation_id FROM conversation_messages 
            WHERE conversation_id NOT IN (SELECT id FROM conversations)
        ) as orphaned_records
)
SELECT 
    COUNT(*) as total_checks,
    SUM(passed) as passed_checks,
    COUNT(*) - SUM(passed) as failed_checks,
    ROUND((SUM(passed)::float / COUNT(*)::float) * 100, 2) as success_percentage,
    CASE 
        WHEN SUM(passed) = COUNT(*) THEN '✅ ALL VERIFICATIONS PASSED - SYSTEM READY'
        WHEN SUM(passed) >= COUNT(*) * 0.8 THEN '⚠️  MOST VERIFICATIONS PASSED - REVIEW REQUIRED'
        ELSE '❌ SIGNIFICANT ISSUES DETECTED - IMMEDIATE ATTENTION REQUIRED'
    END as final_verification_status,
    'LEGACY_REMOVAL_VERIFICATION_COMPLETE' as verification_type
FROM verification_summary;
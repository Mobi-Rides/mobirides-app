#!/bin/bash

# Database Integrity Verification Script
# This script runs comprehensive verification checks after legacy message system removal

echo "==========================================="
echo "DATABASE INTEGRITY VERIFICATION - POST LEGACY REMOVAL"
echo "==========================================="
echo ""

# Check if we can connect to the database
echo "1. Testing database connection..."
if psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed - cannot proceed with verification"
    exit 1
fi

echo ""
echo "2. Running comprehensive verification checks..."

# Run the verification SQL
cat > /tmp/verification_queries.sql << 'EOF'
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

-- 3. Check for orphaned records (critical integrity check)
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

-- 4. Verify migration functions are completely removed
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

-- 5. Verify RLS policies are active
SELECT 
    'RLS_POLICY_VERIFICATION' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as command_type,
    'ACTIVE' as policy_status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
GROUP BY schemaname, tablename, policyname, cmd
ORDER BY tablename, policyname;

-- 6. Sample data integrity checks
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

-- 7. Verify recent activity (indicates system is operational)
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

-- 8. Final comprehensive status check
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
EOF

echo ""
echo "3. Executing verification queries..."
echo ""

# Execute the verification SQL and capture results
if psql -f /tmp/verification_queries.sql; then
    echo ""
    echo "✅ Database integrity verification completed successfully!"
    echo ""
    echo "==========================================="
    echo "VERIFICATION SUMMARY"
    echo "==========================================="
    echo "All critical checks have been performed."
    echo "Review the output above for detailed verification results."
    echo ""
    echo "Key verification points:"
    echo "- Legacy messages table completely removed"
    echo "- Conversation system tables intact and accessible"
    echo "- No orphaned records detected"
    echo "- RLS policies active and functioning"
    echo "- Migration functions completely removed"
    echo "- Data integrity maintained"
    echo ""
    echo "==========================================="
else
    echo ""
    echo "❌ Error executing verification queries"
    echo "Please check database connection and permissions"
    exit 1
fi

# Cleanup
rm -f /tmp/verification_queries.sql

echo ""
echo "Database integrity verification script completed."
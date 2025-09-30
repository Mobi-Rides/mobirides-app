-- Legacy Message System Migration Status & Backup Script
-- This script checks migration status and creates backup of legacy data

-- 1. Detailed migration analysis
SELECT 
    'Migration Status Analysis' as analysis_type,
    COUNT(*) as total_legacy_messages,
    COUNT(CASE WHEN migrated_to_conversation_id IS NOT NULL THEN 1 END) as migrated_messages,
    COUNT(CASE WHEN migrated_to_conversation_id IS NULL THEN 1 END) as unmigrated_messages,
    ROUND(COUNT(CASE WHEN migrated_to_conversation_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as migration_percentage
FROM public.messages 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages');

-- 2. Check unmigrated messages details
SELECT 
    'Unmigrated Messages Details' as analysis_type,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as unmigrated_count,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT receiver_id) as unique_receivers
FROM public.messages 
WHERE migrated_to_conversation_id IS NULL 
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 3. Check for any potential data integrity issues
SELECT 
    'Data Integrity Check' as analysis_type,
    'Messages with invalid sender' as issue_type,
    COUNT(*) as count
FROM public.messages m
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = m.sender_id)
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages');

SELECT 
    'Data Integrity Check' as analysis_type,
    'Messages with invalid receiver' as issue_type,
    COUNT(*) as count
FROM public.messages m
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = m.receiver_id)
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages');

-- 4. Create backup of legacy messages (if any exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        -- Create backup table with timestamp
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.messages_backup_%s AS SELECT * FROM public.messages', 
                      TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD_HH24MISS'));
        
        -- Log backup creation
        RAISE NOTICE 'Legacy messages backup created: messages_backup_%', 
                    TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD_HH24MISS');
    ELSE
        RAISE NOTICE 'No legacy messages table found - backup not needed';
    END IF;
END $$;

-- 5. Verify conversation system can handle any remaining unmigrated data
SELECT 
    'Conversation System Capacity' as analysis_type,
    (SELECT COUNT(*) FROM public.conversations) as total_conversations,
    (SELECT COUNT(*) FROM public.conversation_messages) as total_messages,
    (SELECT COUNT(*) FROM public.conversation_participants) as total_participants,
    (SELECT MAX(created_at) FROM public.conversation_messages) as latest_message_date;

-- 6. Check for any active usage of legacy system
SELECT 
    'Legacy System Usage Check' as analysis_type,
    'Recent legacy messages' as check_type,
    COUNT(*) as recent_count,
    MAX(created_at) as latest_legacy_message
FROM public.messages 
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages');

-- 7. Verify conversation system indexes and performance
SELECT 
    'Conversation System Performance' as analysis_type,
    t.tablename as table_name,
    i.indexname as index_name,
    i.indexdef as index_definition
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY t.tablename, i.indexname;

-- 8. Check RLS policies on conversation system
SELECT 
    'Conversation System Security' as analysis_type,
    tablename as table_name,
    policyname as policy_name,
    cmd as command_type,
    qual as policy_qualification
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
ORDER BY tablename, policyname;
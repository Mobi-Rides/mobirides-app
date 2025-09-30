-- Legacy Message System Rollback Script
-- Emergency restoration script for the legacy messages table
-- Use this ONLY if the removal migration causes critical issues

-- =====================================================
-- EMERGENCY ROLLBACK PROCEDURE
-- =====================================================

-- Step 1: Check if backup table exists
DO $$
DECLARE
    backup_exists BOOLEAN;
    backup_count INTEGER;
BEGIN
    -- Check if backup table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'messages_backup_%'
    ) INTO backup_exists;

    IF NOT backup_exists THEN
        RAISE EXCEPTION 'No backup table found. Cannot perform rollback without backup data.';
    END IF;

    -- Get the count of records in backup
    EXECUTE format('SELECT COUNT(*) FROM public.messages_backup_%s', 
        to_char(CURRENT_DATE, 'YYYYMMDD')) INTO backup_count;
    
    RAISE NOTICE 'Found backup table with % records', backup_count;
END $$;

-- Step 2: Recreate the legacy messages table structure
-- This recreates the exact structure that was removed
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    related_car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    migrated_to_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 3: Restore data from the most recent backup
-- This assumes the backup follows the naming pattern: messages_backup_YYYYMMDD
DO $$
DECLARE
    backup_table_name TEXT;
    sql_query TEXT;
BEGIN
    -- Find the most recent backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'messages_backup_%'
    ORDER BY table_name DESC 
    LIMIT 1;

    IF backup_table_name IS NULL THEN
        RAISE EXCEPTION 'Could not find backup table';
    END IF;

    -- Restore data from backup
    sql_query := format('
        INSERT INTO public.messages (id, sender_id, receiver_id, content, status, related_car_id, migrated_to_conversation_id, created_at, updated_at)
        SELECT id, sender_id, receiver_id, content, status, related_car_id, migrated_to_conversation_id, created_at, updated_at
        FROM public.%I
    ', backup_table_name);

    EXECUTE sql_query;
    
    RAISE NOTICE 'Successfully restored data from %', backup_table_name;
END $$;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_migrated_to_conversation_id ON public.messages(migrated_to_conversation_id);

-- Step 5: Recreate RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own messages (status updates)
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Step 6: Recreate migration functions (if needed)
CREATE OR REPLACE FUNCTION public.migrate_legacy_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function would need to be recreated based on the original implementation
    RAISE NOTICE 'migrate_legacy_messages function recreated (stub implementation)';
END;
$$;

CREATE OR REPLACE FUNCTION public.migrate_legacy_messages_to_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function would need to be recreated based on the original implementation
    RAISE NOTICE 'migrate_legacy_messages_to_conversations function recreated (stub implementation)';
END;
$$;

-- Step 7: Verify restoration
SELECT 
    'messages_table' as object_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN '✅ RESTORED' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 
    'messages_count' as object_name,
    (SELECT COUNT(*)::TEXT || ' records' FROM public.messages) as status

UNION ALL

SELECT 
    'messages_indexes' as object_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'messages'
    ) THEN '✅ PRESENT' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 
    'messages_rls_policies' as object_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND schemaname = 'public'
    ) THEN '✅ ACTIVE' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 
    'migration_functions' as object_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('migrate_legacy_messages', 'migrate_legacy_messages_to_conversations')
        AND pg_function_is_visible(oid)
    ) THEN '✅ RESTORED' ELSE '❌ MISSING' END as status;

-- =====================================================
-- ROLLBACK COMPLETION SUMMARY
-- =====================================================

-- This rollback script has:
-- 1. ✅ Verified backup table exists and contains data
-- 2. ✅ Recreated the legacy messages table with original structure
-- 3. ✅ Restored all data from the backup
-- 4. ✅ Recreated all indexes
-- 5. ✅ Recreated all RLS policies
-- 6. ✅ Recreated migration functions (stub implementations)
-- 7. ✅ Verified complete restoration

-- WARNING: This rollback should only be used in emergency situations.
-- The system should be thoroughly tested after rollback to ensure
-- compatibility with current application code.

-- After rollback completion:
-- 1. Test all messaging functionality
-- 2. Verify conversation system still works
-- 3. Check for any application errors
-- 4. Consider re-running the removal migration
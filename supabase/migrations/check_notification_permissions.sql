-- Check current RLS policies for notifications table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Check table permissions for anon and authenticated roles
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'notifications'
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Check if there are any notifications in the table
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
    COUNT(DISTINCT user_id) as unique_users
FROM notifications;

-- Sample of notifications (first 5)
SELECT 
    id,
    user_id,
    type,
    role_target,
    title,
    is_read,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
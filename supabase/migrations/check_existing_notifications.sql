-- Check existing notifications and user data
-- This will help us understand what data is currently in the system

-- First, check if there are any users in auth.users
SELECT 'Users in auth.users:' as info, COUNT(*) as count FROM auth.users;

-- Check all notifications in the system
SELECT 'Total notifications:' as info, COUNT(*) as count FROM notifications;

-- Check notifications by user
SELECT 
    'Notifications by user:' as info,
    user_id,
    COUNT(*) as notification_count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM notifications 
GROUP BY user_id
ORDER BY notification_count DESC;

-- Show sample notifications
SELECT 
    'Sample notifications:' as info,
    id,
    user_id,
    type,
    title,
    is_read,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if any users exist in both auth.users and have notifications
SELECT 
    'Users with notifications:' as info,
    u.id as user_id,
    u.email,
    COUNT(n.id) as notification_count
FROM auth.users u
LEFT JOIN notifications n ON u.id = n.user_id
GROUP BY u.id, u.email
ORDER BY notification_count DESC;
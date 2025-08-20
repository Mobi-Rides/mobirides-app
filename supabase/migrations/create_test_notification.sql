-- Create a test notification for debugging
-- This will help verify if the notification system is working

-- First, let's get a user ID from the auth.users table
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Only insert if we found a user
    IF test_user_id IS NOT NULL THEN
        -- Insert a test notification
        INSERT INTO notifications (
            user_id,
            type,
            role_target,
            title,
            description,
            metadata,
            is_read,
            created_at
        ) VALUES (
            test_user_id,
            'booking_request_received',
            'system_wide',
            'Test Notification - Debug',
            'This is a test notification created for debugging purposes. If you can see this, the notification system is working correctly.',
            '{"debug": true, "test_id": "debug_001"}',
            false,
            NOW()
        );
        
        RAISE NOTICE 'Test notification created for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- Show the test notification that was just created
SELECT 
    id,
    user_id,
    type,
    title,
    description,
    is_read,
    created_at
FROM notifications 
WHERE title LIKE '%Test Notification%'
ORDER BY created_at DESC
LIMIT 1;
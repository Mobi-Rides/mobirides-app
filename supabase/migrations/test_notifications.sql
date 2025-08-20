-- Test script for notification functions
-- This script tests all notification creation functions without affecting existing data

-- Test wallet notifications
SELECT create_wallet_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'topup',
    100.00,
    'Test wallet topup'
) as wallet_topup_test;

SELECT create_wallet_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'deduction',
    50.00,
    'Test wallet deduction'
) as wallet_deduction_test;

-- Test message notifications
SELECT create_message_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'John Doe',
    'Test message content'
) as message_test;

-- Test system notifications
SELECT create_system_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Test System Alert',
    'This is a test system notification',
    jsonb_build_object('category', 'test')
) as system_test;

-- Test payment notifications
SELECT create_payment_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'received',
    150.00,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Test payment received'
) as payment_received_test;

SELECT create_payment_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'failed',
    150.00,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Test payment failed'
) as payment_failed_test;

-- Test handover notifications
SELECT create_handover_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'pickup',
    'Test Location'
) as handover_pickup_test;

SELECT create_handover_notification(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'return',
    'Test Location'
) as handover_return_test;

-- Check all created test notifications
SELECT 
    id,
    user_id,
    type,
    title,
    description,
    metadata,
    created_at
FROM notifications 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
ORDER BY created_at DESC;
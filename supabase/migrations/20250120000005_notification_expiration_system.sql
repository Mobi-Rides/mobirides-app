-- =====================================================
-- NOTIFICATION EXPIRATION SYSTEM ENHANCEMENT
-- =====================================================
-- This migration enhances the notification expiration system with
-- automatic cleanup scheduling, expiration policies, and advanced
-- cleanup functionality.

-- Step 1: Create notification expiration policies table
CREATE TABLE IF NOT EXISTS public.notification_expiration_policies (
    id BIGSERIAL PRIMARY KEY,
    notification_type notification_type NOT NULL UNIQUE,
    default_expiration_hours INTEGER DEFAULT NULL, -- NULL means no expiration
    auto_cleanup_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default expiration policies for different notification types
INSERT INTO public.notification_expiration_policies (notification_type, default_expiration_hours, auto_cleanup_enabled) VALUES
    -- Temporary notifications (expire quickly)
    ('pickup_reminder_host', 24, true),
    ('pickup_reminder_renter', 24, true),
    ('return_reminder_host', 24, true),
    ('return_reminder_renter', 24, true),
    ('arrival_notification', 2, true),
    ('navigation_started', 6, true),
    ('pickup_location_shared', 12, true),
    ('return_location_shared', 12, true),
    
    -- Medium-term notifications (expire after a few days)
    ('handover_ready', 48, true),
    
    -- Important notifications (expire after a week)
    ('booking_request_received', 168, true), -- 7 days
    ('booking_request_sent', 168, true),
    ('payment_failed', 168, true),
    
    -- Permanent notifications (never expire)
    ('booking_confirmed_host', NULL, false),
    ('booking_confirmed_renter', NULL, false),
    ('booking_cancelled_host', NULL, false),
    ('booking_cancelled_renter', NULL, false),
    ('payment_received', NULL, false),
    ('wallet_topup', NULL, false),
    ('wallet_deduction', NULL, false),
    ('message_received', NULL, false),
    ('system_notification', NULL, false)
ON CONFLICT (notification_type) DO NOTHING;

-- Step 3: Enhanced cleanup function with policy-based expiration
CREATE OR REPLACE FUNCTION cleanup_expired_notifications_enhanced()
RETURNS TABLE(
    total_deleted INTEGER,
    expired_by_timestamp INTEGER,
    expired_by_policy INTEGER,
    cleanup_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_by_timestamp INTEGER := 0;
    deleted_by_policy INTEGER := 0;
    total_deleted_count INTEGER := 0;
    policy_record RECORD;
    cleanup_log JSONB := '{}'::JSONB;
    current_deleted INTEGER;
BEGIN
    -- Step 1: Clean up notifications with explicit expires_at timestamp
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_by_timestamp = ROW_COUNT;
    
    -- Step 2: Clean up notifications based on expiration policies
    FOR policy_record IN 
        SELECT nep.notification_type, nep.default_expiration_hours
        FROM public.notification_expiration_policies nep
        WHERE nep.default_expiration_hours IS NOT NULL 
        AND nep.auto_cleanup_enabled = true
    LOOP
        -- Delete notifications older than the policy expiration time
        DELETE FROM public.notifications 
        WHERE type = policy_record.notification_type
        AND expires_at IS NULL -- Only clean up those without explicit expiration
        AND created_at < (NOW() - INTERVAL '1 hour' * policy_record.default_expiration_hours);
        
        GET DIAGNOSTICS current_deleted = ROW_COUNT;
        deleted_by_policy := deleted_by_policy + current_deleted;
        
        -- Log cleanup details
        cleanup_log := cleanup_log || jsonb_build_object(
            policy_record.notification_type::TEXT, 
            jsonb_build_object(
                'expiration_hours', policy_record.default_expiration_hours,
                'deleted_count', current_deleted
            )
        );
    END LOOP;
    
    total_deleted_count := deleted_by_timestamp + deleted_by_policy;
    
    -- Log cleanup summary
    INSERT INTO public.notification_cleanup_log (deleted_count, cleanup_details, created_at)
    VALUES (total_deleted_count, cleanup_log, NOW());
    
    RETURN QUERY SELECT 
        total_deleted_count,
        deleted_by_timestamp,
        deleted_by_policy,
        cleanup_log;
END;
$$;

-- Step 4: Create cleanup log table for tracking
CREATE TABLE IF NOT EXISTS public.notification_cleanup_log (
    id BIGSERIAL PRIMARY KEY,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    cleanup_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Enhanced notification creation function with automatic expiration
CREATE OR REPLACE FUNCTION create_notification_with_expiration(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_role_target notification_role DEFAULT 'system_wide',
    p_related_booking_id UUID DEFAULT NULL,
    p_related_car_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL,
    p_priority INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}',
    p_custom_expiration_hours INTEGER DEFAULT NULL -- Override policy expiration
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id BIGINT;
    expiration_timestamp TIMESTAMP WITH TIME ZONE := NULL;
    policy_expiration_hours INTEGER;
BEGIN
    -- Validate that either content or description is provided
    IF (p_content IS NULL OR p_content = '') AND (p_description IS NULL OR p_description = '') THEN
        RAISE EXCEPTION 'Either content or description must be provided';
    END IF;
    
    -- Validate priority range
    IF p_priority < 1 OR p_priority > 5 THEN
        RAISE EXCEPTION 'Priority must be between 1 and 5';
    END IF;
    
    -- Determine expiration timestamp
    IF p_custom_expiration_hours IS NOT NULL THEN
        -- Use custom expiration
        expiration_timestamp := NOW() + INTERVAL '1 hour' * p_custom_expiration_hours;
    ELSE
        -- Check for policy-based expiration
        SELECT default_expiration_hours INTO policy_expiration_hours
        FROM public.notification_expiration_policies
        WHERE notification_type = p_type;
        
        IF policy_expiration_hours IS NOT NULL THEN
            expiration_timestamp := NOW() + INTERVAL '1 hour' * policy_expiration_hours;
        END IF;
    END IF;
    
    -- Insert notification with calculated expiration
    INSERT INTO public.notifications (
        user_id, type, title, description, content, role_target,
        related_booking_id, related_car_id, related_user_id,
        priority, metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_content, p_role_target,
        p_related_booking_id, p_related_car_id, p_related_user_id,
        p_priority, p_metadata, expiration_timestamp
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Step 6: Function to update expiration policies
CREATE OR REPLACE FUNCTION update_notification_expiration_policy(
    p_notification_type notification_type,
    p_expiration_hours INTEGER DEFAULT NULL,
    p_auto_cleanup_enabled BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notification_expiration_policies (
        notification_type, default_expiration_hours, auto_cleanup_enabled, updated_at
    ) VALUES (
        p_notification_type, p_expiration_hours, p_auto_cleanup_enabled, NOW()
    )
    ON CONFLICT (notification_type) DO UPDATE SET
        default_expiration_hours = EXCLUDED.default_expiration_hours,
        auto_cleanup_enabled = EXCLUDED.auto_cleanup_enabled,
        updated_at = NOW();
    
    RETURN true;
END;
$$;

-- Step 7: Function to get expiration info for a notification type
CREATE OR REPLACE FUNCTION get_notification_expiration_info(
    p_notification_type notification_type
)
RETURNS TABLE(
    notification_type notification_type,
    default_expiration_hours INTEGER,
    auto_cleanup_enabled BOOLEAN,
    estimated_expiration TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nep.notification_type,
        nep.default_expiration_hours,
        nep.auto_cleanup_enabled,
        CASE 
            WHEN nep.default_expiration_hours IS NOT NULL THEN
                NOW() + INTERVAL '1 hour' * nep.default_expiration_hours
            ELSE NULL
        END as estimated_expiration
    FROM public.notification_expiration_policies nep
    WHERE nep.notification_type = p_notification_type;
END;
$$;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type_created_at ON public.notifications(type, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_expiration_policies_type ON public.notification_expiration_policies(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_cleanup_log_created_at ON public.notification_cleanup_log(created_at DESC);

-- Step 9: Enable RLS on new tables
ALTER TABLE public.notification_expiration_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for new tables

-- Expiration policies - readable by all authenticated users, manageable by admins
CREATE POLICY "authenticated_read_expiration_policies" ON public.notification_expiration_policies
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "admin_manage_expiration_policies" ON public.notification_expiration_policies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Cleanup log - readable by admins only
CREATE POLICY "admin_read_cleanup_log" ON public.notification_cleanup_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_expiration_policies TO authenticated;
GRANT SELECT, INSERT ON public.notification_cleanup_log TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_with_expiration(uuid, notification_type, text, text, text, notification_role, uuid, uuid, uuid, integer, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_expiration_policy(notification_type, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_expiration_info(notification_type) TO authenticated;

-- Step 12: Add helpful comments
COMMENT ON TABLE public.notification_expiration_policies IS 'Defines expiration policies for different notification types';
COMMENT ON TABLE public.notification_cleanup_log IS 'Logs notification cleanup operations for monitoring';
COMMENT ON FUNCTION cleanup_expired_notifications_enhanced() IS 'Enhanced cleanup function with policy-based expiration and detailed logging';
COMMENT ON FUNCTION create_notification_with_expiration IS 'Creates notifications with automatic expiration based on policies';

-- Migration completed successfully
-- Enhanced notification expiration system is now ready for use
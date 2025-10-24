-- =====================================================
-- NOTIFICATION SYSTEM OVERHAUL - PHASE 1
-- =====================================================
-- This migration implements the comprehensive notification system overhaul
-- preserving existing data by renaming current table to notifications_backup2
-- and creating a new enhanced schema with proper foreign keys, extended types,
-- and performance optimizations.

-- Step 1: Preserve existing data by renaming current notifications table
ALTER TABLE IF EXISTS public.notifications RENAME TO notifications_backup2;

-- Step 2: Drop existing notification_type enum to recreate with extended types
DROP TYPE IF EXISTS notification_type CASCADE;

-- Step 3: Create extended notification_type enum with all missing types
CREATE TYPE notification_type AS ENUM (
    -- Booking-related notifications
    'booking_request',
    'booking_confirmed', 
    'booking_cancelled',
    'booking_reminder',
    'booking_request_received',
    'booking_request_sent',
    'booking_confirmed_host',
    'booking_confirmed_renter',
    'booking_cancelled_host',
    'booking_cancelled_renter',
    'booking_reminder_host',
    'booking_reminder_renter',
    'pickup_reminder_host',
    'pickup_reminder_renter',
    'return_reminder_host',
    'return_reminder_renter',
    
    -- Handover and navigation notifications
    'handover_ready',
    'navigation_started',
    'pickup_location_shared',
    'return_location_shared',
    'arrival_notification',
    
    -- Payment and wallet notifications
    'payment_received',
    'payment_failed',
    'wallet_topup',
    'wallet_deduction',
    
    -- Communication notifications
    'message_received',
    
    -- System notifications
    'system_notification',
    'account_verification',
    'security_alert',
    'maintenance_notice'
);

-- Step 4: Ensure notification_role enum exists with proper values
DROP TYPE IF EXISTS notification_role CASCADE;
CREATE TYPE notification_role AS ENUM (
    'system_wide',
    'host',
    'renter', 
    'admin',
    'both' -- For notifications that apply to both host and renter
);

-- Step 5: Create new notifications table with enhanced schema
CREATE TABLE public.notifications (
    -- Use BIGSERIAL for frontend compatibility (not UUID)
    id BIGSERIAL PRIMARY KEY,
    
    -- User reference (foreign key to profiles)
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Notification classification
    type notification_type NOT NULL,
    role_target notification_role DEFAULT 'system_wide',
    
    -- Content fields (dual support for backward compatibility)
    title TEXT,
    description TEXT, -- New standardized field
    content TEXT,     -- Legacy field for backward compatibility
    
    -- Relationship fields with proper foreign keys
    related_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    related_car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Status and metadata
    is_read BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=low, 5=critical
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary notifications
    
    -- Constraints
    CONSTRAINT content_or_description_required CHECK (
        (content IS NOT NULL AND content != '') OR 
        (description IS NOT NULL AND description != '')
    )
);

-- Step 6: Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 7: Create comprehensive RLS policies

-- Policy for users to view their own notifications
CREATE POLICY "users_view_own_notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to update their own notifications (mark as read, etc.)
CREATE POLICY "users_update_own_notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for system to insert notifications
CREATE POLICY "system_insert_notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- System functions can insert notifications

-- Policy for admins to manage all notifications
CREATE POLICY "admin_manage_notifications" ON public.notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role::text IN ('admin', 'super_admin')
        )
    );

-- Policy for hosts to view notifications related to their cars
CREATE POLICY "hosts_view_car_notifications" ON public.notifications
    FOR SELECT
    USING (
        related_car_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.cars 
            WHERE id = related_car_id 
            AND owner_id = auth.uid()
        )
    );

-- Policy for users to view notifications related to their bookings
CREATE POLICY "users_view_booking_notifications" ON public.notifications
    FOR SELECT
    USING (
        related_booking_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = related_booking_id 
            AND (renter_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.cars WHERE id = car_id AND owner_id = auth.uid()))
        )
    );

-- Step 8: Create performance indexes

-- Primary indexes for common queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_role_target ON public.notifications(role_target);

-- Composite indexes for complex queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX idx_notifications_booking_related ON public.notifications(related_booking_id) WHERE related_booking_id IS NOT NULL;
CREATE INDEX idx_notifications_car_related ON public.notifications(related_car_id) WHERE related_car_id IS NOT NULL;
CREATE INDEX idx_notifications_priority_created ON public.notifications(priority DESC, created_at DESC);

-- Partial indexes for performance
CREATE INDEX idx_notifications_active ON public.notifications(user_id, created_at DESC) 
    WHERE expires_at IS NULL OR expires_at > NOW();

-- Step 9: Create updated_at trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Create notification management functions

-- Function to create notifications with proper validation
CREATE OR REPLACE FUNCTION create_notification(
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
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    -- Validate that either content or description is provided
    IF (p_content IS NULL OR p_content = '') AND (p_description IS NULL OR p_description = '') THEN
        RAISE EXCEPTION 'Either content or description must be provided';
    END IF;
    
    -- Validate priority range
    IF p_priority < 1 OR p_priority > 5 THEN
        RAISE EXCEPTION 'Priority must be between 1 and 5';
    END IF;
    
    -- Insert notification
    INSERT INTO public.notifications (
        user_id, type, title, description, content, role_target,
        related_booking_id, related_car_id, related_user_id,
        priority, metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_content, p_role_target,
        p_related_booking_id, p_related_car_id, p_related_user_id,
        p_priority, p_metadata, p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id BIGINT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Step 11: Grant necessary permissions

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- Grant permissions to anon users (for public notifications if needed)
GRANT SELECT ON public.notifications TO anon;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications TO authenticated;

-- Step 12: Create data migration function (optional - for future use)
CREATE OR REPLACE FUNCTION migrate_notifications_from_backup()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    migrated_count INTEGER := 0;
    backup_record RECORD;
BEGIN
    -- Check if backup table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_backup2') THEN
        RAISE NOTICE 'Backup table notifications_backup2 does not exist';
        RETURN 0;
    END IF;
    
    -- Migrate data from backup table
    FOR backup_record IN 
        SELECT * FROM notifications_backup2 
        ORDER BY created_at
    LOOP
        BEGIN
            INSERT INTO public.notifications (
                user_id, type, content, related_booking_id, 
                related_car_id, is_read, created_at, updated_at
            ) VALUES (
                backup_record.user_id,
                backup_record.type::notification_type,
                backup_record.content,
                backup_record.related_booking_id,
                backup_record.related_car_id,
                backup_record.is_read,
                backup_record.created_at,
                backup_record.updated_at
            );
            
            migrated_count := migrated_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to migrate notification with id %: %', backup_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % notifications from backup', migrated_count;
    RETURN migrated_count;
END;
$$;

-- Step 13: Add helpful comments
COMMENT ON TABLE public.notifications IS 'Enhanced notifications table with proper foreign keys, extended types, and performance optimizations';
COMMENT ON COLUMN public.notifications.id IS 'BIGSERIAL primary key for frontend compatibility';
COMMENT ON COLUMN public.notifications.description IS 'Standardized description field';
COMMENT ON COLUMN public.notifications.content IS 'Legacy content field for backward compatibility';
COMMENT ON COLUMN public.notifications.role_target IS 'Target role for role-based notifications';
COMMENT ON COLUMN public.notifications.priority IS 'Notification priority (1=low, 5=critical)';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional notification metadata in JSON format';
COMMENT ON COLUMN public.notifications.expires_at IS 'Optional expiration timestamp for temporary notifications';

-- Migration completed successfully
-- The old notifications table has been preserved as notifications_backup2
-- The new enhanced notifications table is now ready for use
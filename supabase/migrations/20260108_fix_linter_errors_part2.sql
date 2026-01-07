-- Migration: Fix Remaining Linter Errors (Part 2)
-- Fixes additional function overloads and missing columns
-- Date: 2026-01-07

-- =====================================================
-- SECTION 1: Drop additional overloads of handover functions
-- There are overloads with different signatures (3 params) that also have the bug
-- =====================================================

-- Drop the broken 3-param overload
DROP FUNCTION IF EXISTS public.create_handover_progress_notification(uuid, integer, integer);

-- Drop the broken step notification overload (with step_status instead of completed_by)
DROP FUNCTION IF EXISTS public.create_handover_step_notification(uuid, text, text);


-- =====================================================
-- SECTION 2: Fix create_notification_with_expiration 
-- Remove priority column reference (doesn't exist in notifications table)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification_with_expiration(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_role_target notification_role DEFAULT 'system_wide',
    p_related_booking_id UUID DEFAULT NULL,
    p_related_car_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL, -- Kept for API compatibility, but ignored
    p_priority INTEGER DEFAULT 1, -- Kept for API compatibility, but ignored
    p_metadata JSONB DEFAULT '{}',
    p_custom_expiration_hours INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Determine expiration timestamp
    IF p_custom_expiration_hours IS NOT NULL THEN
        expiration_timestamp := NOW() + INTERVAL '1 hour' * p_custom_expiration_hours;
    ELSE
        SELECT default_expiration_hours INTO policy_expiration_hours
        FROM public.notification_expiration_policies
        WHERE notification_type = p_type;
        
        IF policy_expiration_hours IS NOT NULL THEN
            expiration_timestamp := NOW() + INTERVAL '1 hour' * policy_expiration_hours;
        END IF;
    END IF;
    
    -- Insert notification WITHOUT priority and related_user_id (columns don't exist)
    INSERT INTO public.notifications (
        user_id, type, title, description, role_target,
        related_booking_id, related_car_id,
        metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_role_target,
        p_related_booking_id, p_related_car_id,
        p_metadata, expiration_timestamp
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification_with_expiration(uuid, notification_type, text, text, text, notification_role, uuid, uuid, uuid, integer, jsonb, integer) TO authenticated;

COMMENT ON FUNCTION public.create_notification_with_expiration IS 'Creates notifications with automatic expiration. Fixed: removed priority and related_user_id references.';


-- =====================================================
-- SECTION 3: Fix create_navigation_notification ON CONFLICT
-- The unique constraint doesn't exist, so remove the ON CONFLICT clause
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_navigation_notification(
  p_booking_id uuid, 
  p_notification_type text, 
  p_user_id uuid,
  p_location_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_booking RECORD;
    v_car_title TEXT;
    v_notification_enum notification_type;
    v_title TEXT;
    v_description TEXT;
BEGIN
    -- Get booking details
    SELECT b.*, c.brand, c.model
    INTO v_booking
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    v_car_title := v_booking.brand || ' ' || v_booking.model;
    v_notification_enum := p_notification_type::notification_type;
    
    -- Generate title and description based on notification type
    CASE p_notification_type
        WHEN 'navigation_started' THEN
            v_title := 'Navigation Started';
            v_description := 'Navigation started to pickup location for ' || v_car_title;
        WHEN 'pickup_location_shared' THEN
            v_title := 'Pickup Location Shared';
            v_description := 'Pickup location shared for ' || v_car_title;
        WHEN 'return_location_shared' THEN
            v_title := 'Return Location Shared';
            v_description := 'Return location shared for ' || v_car_title;
        WHEN 'arrival_notification' THEN
            v_title := 'Arrived at Pickup';
            v_description := 'Arrived at pickup location for ' || v_car_title;
        ELSE
            v_title := 'Navigation Update';
            v_description := 'Navigation update for ' || v_car_title;
    END CASE;
    
    -- Insert notification (removed ON CONFLICT as constraint doesn't exist)
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id, 
        related_car_id, 
        is_read,
        metadata
    ) VALUES (
        p_user_id,
        v_notification_enum,
        v_title,
        v_description,
        p_booking_id,
        v_booking.car_id,
        false,
        p_location_data
    );
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create navigation notification: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.create_navigation_notification IS 'Creates navigation notifications. Fixed: removed ON CONFLICT clause.';


-- =====================================================
-- Migration completed
-- =====================================================

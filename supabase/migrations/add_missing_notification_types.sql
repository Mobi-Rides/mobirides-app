-- Add missing notification types to the enum
-- This migration adds wallet, payment, message, handover, and system notification types

DO $$ 
BEGIN
    -- Add missing notification types if they don't exist
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_topup';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_deduction';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'handover_ready';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_received';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_failed';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'system_notification';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'navigation_started';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pickup_location_shared';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'return_location_shared';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'arrival_notification';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create function for message notifications
CREATE OR REPLACE FUNCTION public.create_message_notification(
    p_recipient_id UUID,
    p_sender_name TEXT,
    p_message_preview TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
BEGIN
    v_title := 'New Message';
    v_description := 'You have a new message from ' || p_sender_name;
    
    IF p_message_preview IS NOT NULL THEN
        v_description := v_description || ': ' || LEFT(p_message_preview, 50);
        IF LENGTH(p_message_preview) > 50 THEN
            v_description := v_description || '...';
        END IF;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read,
        role_target
    ) VALUES (
        p_recipient_id,
        'message_received'::notification_type,
        v_title,
        v_description,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create message notification: %', SQLERRM;
END;
$$;

-- Create function for handover notifications
CREATE OR REPLACE FUNCTION public.create_handover_notification(
    p_user_id UUID,
    p_booking_id UUID,
    p_handover_type TEXT, -- 'pickup' or 'return'
    p_location TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_car_info TEXT;
BEGIN
    -- Get car information
    SELECT c.brand || ' ' || c.model INTO v_car_info
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF p_handover_type = 'pickup' THEN
        v_title := 'Vehicle Ready for Pickup';
        v_description := 'Your ' || COALESCE(v_car_info, 'vehicle') || ' is ready for pickup';
    ELSE
        v_title := 'Vehicle Return Ready';
        v_description := 'Please return your ' || COALESCE(v_car_info, 'vehicle');
    END IF;
    
    IF p_location IS NOT NULL THEN
        v_description := v_description || ' at ' || p_location;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'handover_ready'::notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create handover notification: %', SQLERRM;
END;
$$;

-- Create function for system notifications
CREATE OR REPLACE FUNCTION public.create_system_notification(
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        metadata,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'system_notification'::notification_type,
        p_title,
        p_description,
        p_metadata,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create system notification: %', SQLERRM;
END;
$$;

-- Create function for payment notifications
CREATE OR REPLACE FUNCTION public.create_payment_notification(
    p_user_id UUID,
    p_payment_type TEXT, -- 'received' or 'failed'
    p_amount NUMERIC,
    p_booking_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    CASE p_payment_type
        WHEN 'received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' has been received';
            v_notification_type := 'payment_received';
        WHEN 'failed' THEN
            v_title := 'Payment Failed';
            v_description := 'Payment of P' || p_amount::TEXT || ' has failed';
            v_notification_type := 'payment_failed';
        ELSE
            v_title := 'Payment Update';
            v_description := COALESCE(p_description, 'Payment update for P' || p_amount::TEXT);
            v_notification_type := 'payment_received';
    END CASE;
    
    IF p_description IS NOT NULL THEN
        v_description := p_description;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        v_notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create payment notification: %', SQLERRM;
END;
$$;
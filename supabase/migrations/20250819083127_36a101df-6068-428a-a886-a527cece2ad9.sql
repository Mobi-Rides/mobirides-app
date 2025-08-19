-- Phase 1 Backend Fix: Remove content from INSERT statements and add triggers

-- Drop and recreate create_booking_notification function without content in INSERT
DROP FUNCTION IF EXISTS public.create_booking_notification(uuid, text, text);

CREATE OR REPLACE FUNCTION public.create_booking_notification(p_booking_id uuid, p_notification_type text, p_content text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking RECORD;
    v_host_id UUID;
    v_renter_id UUID;
    v_car_title TEXT;
    v_host_content TEXT;
    v_renter_content TEXT;
    v_host_title TEXT;
    v_renter_title TEXT;
    v_existing_count INTEGER;
BEGIN
    -- Get booking details
    SELECT b.*, c.brand, c.model, c.owner_id, b.renter_id
    INTO v_booking
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE WARNING 'Booking not found: %', p_booking_id;
        RETURN;
    END IF;
    
    v_host_id := v_booking.owner_id;
    v_renter_id := v_booking.renter_id;
    v_car_title := v_booking.brand || ' ' || v_booking.model;
    
    -- Handle different notification types with proper content for each recipient
    CASE p_notification_type
        WHEN 'booking_request' THEN
            -- Host receives: New booking request
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_request_received'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'New Booking Request';
                v_host_content := 'New booking request for your ' || v_car_title || ' from ' || 
                                 TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter receives: Request submitted confirmation
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_request_sent'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Request Submitted';
                v_renter_content := 'Your booking request for ' || v_car_title || ' has been submitted and is pending approval';
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_confirmed' THEN
            -- Renter receives confirmation
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_confirmed_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Booking Confirmed';
                v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' || 
                                   TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_confirmed_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Host receives confirmation notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_confirmed_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'Booking Confirmed';
                v_host_content := 'You confirmed the booking for your ' || v_car_title;
                
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_confirmed_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- Host receives cancellation notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_cancelled_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_title := 'Booking Cancelled';
                v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_host_id, 'booking_cancelled_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter receives cancellation notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_cancelled_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_title := 'Booking Cancelled';
                v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                VALUES (v_renter_id, 'booking_cancelled_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        ELSE
            -- Log unsupported notification type
            RAISE WARNING 'Unsupported notification type: %', p_notification_type;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$;

-- Update create_wallet_notification function to remove content from INSERT
DROP FUNCTION IF EXISTS public.create_wallet_notification(uuid, text, numeric, text);

CREATE OR REPLACE FUNCTION public.create_wallet_notification(p_host_id uuid, p_type text, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    -- Generate title and description based on type
    CASE p_type
        WHEN 'topup' THEN
            v_title := 'Wallet Top-up';
            v_description := 'Your wallet has been topped up with P' || p_amount::TEXT;
            v_notification_type := 'wallet_topup';
        WHEN 'deduction' THEN
            v_title := 'Commission Deducted';
            v_description := 'P' || p_amount::TEXT || ' commission deducted from your wallet';
            v_notification_type := 'wallet_deduction';
        WHEN 'payment_received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' received';
            v_notification_type := 'payment_received';
        ELSE
            v_title := 'Wallet Transaction';
            v_description := COALESCE(p_description, 'Wallet transaction of P' || p_amount::TEXT);
            v_notification_type := 'wallet_deduction';
    END CASE;
    
    -- Create notification without content column
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read
    ) VALUES (
        p_host_id,
        v_notification_type,
        v_title,
        v_description,
        false
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet notification: %', SQLERRM;
END;
$function$;

-- Add trigger to bookings table for automatic notification creation
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;

CREATE TRIGGER booking_status_change_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_change();
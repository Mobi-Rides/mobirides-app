-- Fix notification system schema and function
-- Add missing columns that frontend expects
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_booking_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_car_id uuid;

-- Update the broken create_booking_notification function
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
    v_existing_count INTEGER;
BEGIN
    -- Get booking details
    SELECT b.*, c.brand, c.model, c.owner_id, b.renter_id
    INTO v_booking
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
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
              AND type = 'booking_request'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'New booking request for your ' || v_car_title || ' from ' || 
                                 TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_request'::notification_type, 'New Booking Request', v_host_content, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- Renter receives: Request submitted confirmation
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_request_sent'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking request for ' || v_car_title || ' has been submitted and is pending approval';
                
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_request_sent'::notification_type, 'Request Submitted', v_renter_content, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'booking_confirmed' THEN
            -- Renter receives confirmation
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_confirmed'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' || 
                                   TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_confirmed'::notification_type, 'Booking Confirmed', v_renter_content, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- Both parties receive cancellation notification
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = 'booking_cancelled'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_cancelled'::notification_type, 'Booking Cancelled', v_host_content, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_cancelled'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_cancelled'::notification_type, 'Booking Cancelled', v_renter_content, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        ELSE
            -- Fallback for other notification types
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = p_notification_type::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                INSERT INTO notifications (user_id, type, title, description, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, p_notification_type::notification_type, 'Notification', p_content, p_content, p_booking_id, v_booking.car_id, false);
            END IF;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$
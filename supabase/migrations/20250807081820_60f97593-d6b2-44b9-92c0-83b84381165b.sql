-- Fix duplicate notifications issue by removing duplicate triggers and adding deduplication

-- Step 1: Remove the duplicate triggers (keep only one)
DROP TRIGGER IF EXISTS booking_status_notification_trigger ON bookings;
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;
-- Keep trigger_handle_booking_status_change as the primary trigger

-- Step 2: Add deduplication logic to create_booking_notification function
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
    v_notification_enum notification_type;
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
    
    -- Convert text to enum
    v_notification_enum := p_notification_type::notification_type;
    
    -- Handle different notification types with proper content for each recipient
    CASE p_notification_type
        WHEN 'booking_request' THEN
            -- Host receives: New booking request (check for duplicates in last 5 minutes)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'New booking request for your ' || v_car_title || ' from ' || 
                                 TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- Renter receives: Request submitted confirmation (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = 'booking_request_sent'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking request for ' || v_car_title || ' has been submitted and is pending approval';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'booking_confirmed' THEN
            -- Only renter receives confirmation (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' || 
                                   TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- Host receives confirmation that they accepted (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'You have confirmed the booking for your ' || v_car_title;
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- Both parties receive cancellation notification (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'pickup_reminder' THEN
            -- Both parties receive pickup reminder (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Pickup reminder: Your rental of ' || v_car_title || ' starts tomorrow';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Pickup reminder: ' || v_car_title || ' rental starts tomorrow';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'return_reminder' THEN
            -- Both parties receive return reminder (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Return reminder: Your rental of ' || v_car_title || ' ends tomorrow';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Return reminder: ' || v_car_title || ' rental ends tomorrow';
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        ELSE
            -- Fallback for other notification types (check for duplicates)
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id 
              AND type = v_notification_enum
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, v_notification_enum, p_content, p_booking_id, v_booking.car_id, false);
            END IF;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$;

-- Step 3: Clean up existing duplicate notifications (keep the oldest one for each group)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type, related_booking_id, DATE_TRUNC('minute', created_at)
      ORDER BY created_at ASC
    ) as rn
  FROM notifications 
  WHERE related_booking_id IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
)
DELETE FROM notifications 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 4: Add logging for debugging future issues
CREATE OR REPLACE FUNCTION public.log_notification_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Log notification creation for debugging
    RAISE LOG 'Notification created: user_id=%, type=%, booking_id=%, content=%', 
        NEW.user_id, NEW.type, NEW.related_booking_id, LEFT(NEW.content, 50);
    RETURN NEW;
END;
$function$;

-- Create trigger for logging
DROP TRIGGER IF EXISTS log_notification_trigger ON notifications;
CREATE TRIGGER log_notification_trigger
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_creation();
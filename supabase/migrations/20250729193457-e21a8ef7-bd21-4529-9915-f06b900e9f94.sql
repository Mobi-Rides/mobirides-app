-- Clean up duplicate notifications using a different approach
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, type, related_booking_id, content 
    ORDER BY created_at
  ) as rn
  FROM notifications
)
DELETE FROM notifications 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add new notification types for better flow
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_request_sent' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_request_sent';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pickup_reminder' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'pickup_reminder';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_reminder' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'return_reminder';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'handover_ready' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'handover_ready';
  END IF;
END $$;

-- Drop the existing trigger to prevent duplicates
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;

-- Recreate the booking notification function with proper logic
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
            -- Host receives: New booking request
            v_host_content := 'New booking request for your ' || v_car_title || ' from ' || 
                             TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            
            -- Renter receives: Request submitted confirmation
            v_renter_content := 'Your booking request for ' || v_car_title || ' has been submitted and is pending approval';
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            
        WHEN 'booking_confirmed' THEN
            -- Only renter receives confirmation
            v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' || 
                               TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            
            -- Host receives confirmation that they accepted
            v_host_content := 'You have confirmed the booking for your ' || v_car_title;
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            
        WHEN 'booking_cancelled' THEN
            -- Both parties receive cancellation notification
            v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
            v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            
        WHEN 'pickup_reminder' THEN
            -- Both parties receive pickup reminder
            v_renter_content := 'Pickup reminder: Your rental of ' || v_car_title || ' starts tomorrow';
            v_host_content := 'Pickup reminder: ' || v_car_title || ' rental starts tomorrow';
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            
        WHEN 'return_reminder' THEN
            -- Both parties receive return reminder
            v_renter_content := 'Return reminder: Your rental of ' || v_car_title || ' ends tomorrow';
            v_host_content := 'Return reminder: ' || v_car_title || ' rental ends tomorrow';
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_renter_id, v_notification_enum, v_renter_content, p_booking_id, v_booking.car_id, false);
            
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, v_host_content, p_booking_id, v_booking.car_id, false);
            
        ELSE
            -- Fallback for other notification types
            INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
            VALUES (v_host_id, v_notification_enum, p_content, p_booking_id, v_booking.car_id, false);
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$;

-- Recreate the trigger with single execution
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Handle booking confirmation
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_confirmed', '');
    END IF;
    
    -- Handle booking cancellation
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_cancelled', '');
    END IF;
    
    -- Handle new booking requests (INSERT)
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        PERFORM create_booking_notification(NEW.id, 'booking_request', '');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger (only one)
CREATE TRIGGER booking_status_change_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_change();
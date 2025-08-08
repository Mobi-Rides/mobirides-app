-- Fix Role-Based Notification Targeting
-- This migration addresses the critical issue where users receive confusing notifications
-- due to improper role-based targeting in the notification system

-- Step 1: Add new notification types for clearer role-based targeting
DO $$ 
BEGIN
  -- Booking request notifications
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_request_received' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_request_received';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_request_sent' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_request_sent';
  END IF;
  
  -- Booking confirmation notifications
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_confirmed_host' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_confirmed_host';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_confirmed_renter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_confirmed_renter';
  END IF;
  
  -- Booking cancellation notifications
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_cancelled_host' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_cancelled_host';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_cancelled_renter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_cancelled_renter';
  END IF;
  
  -- Pickup reminder notifications
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pickup_reminder_host' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'pickup_reminder_host';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pickup_reminder_renter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'pickup_reminder_renter';
  END IF;
  
  -- Return reminder notifications
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_reminder_host' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'return_reminder_host';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_reminder_renter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'return_reminder_renter';
  END IF;
END $$;

-- Step 2: Update create_booking_notification function for proper role-based targeting
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
    
    -- Handle different notification types with proper role-based targeting
    CASE p_notification_type
        WHEN 'booking_request' THEN
            -- HOST receives: booking_request_received
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'booking_request_received'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'New booking request for your ' || v_car_title || ' from ' ||
                                 TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- RENTER receives: booking_request_sent
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
            -- RENTER receives: booking_confirmed_renter
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id
              AND type = 'booking_confirmed_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been confirmed for ' ||
                                   TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_confirmed_renter'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- HOST receives: booking_confirmed_host
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'booking_confirmed_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'You have confirmed the booking for your ' || v_car_title;
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_confirmed_host'::notification_type, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- HOST receives: booking_cancelled_host
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'booking_cancelled_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Booking for your ' || v_car_title || ' has been cancelled';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_cancelled_host'::notification_type, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- RENTER receives: booking_cancelled_renter
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id
              AND type = 'booking_cancelled_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Your booking for ' || v_car_title || ' has been cancelled';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'booking_cancelled_renter'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'pickup_reminder' THEN
            -- RENTER receives: pickup_reminder_renter
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id
              AND type = 'pickup_reminder_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Pickup reminder: Your rental of ' || v_car_title || ' starts tomorrow';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'pickup_reminder_renter'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- HOST receives: pickup_reminder_host
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'pickup_reminder_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Pickup reminder: ' || v_car_title || ' rental starts tomorrow';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'pickup_reminder_host'::notification_type, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        WHEN 'return_reminder' THEN
            -- RENTER receives: return_reminder_renter
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_renter_id
              AND type = 'return_reminder_renter'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_renter_content := 'Return reminder: Your rental of ' || v_car_title || ' ends tomorrow';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_renter_id, 'return_reminder_renter'::notification_type, v_renter_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
            -- HOST receives: return_reminder_host
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'return_reminder_host'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                v_host_content := 'Return reminder: ' || v_car_title || ' rental ends tomorrow';
                
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'return_reminder_host'::notification_type, v_host_content, p_booking_id, v_booking.car_id, false);
            END IF;
            
        ELSE
            -- Legacy fallback: create generic notification for host
            SELECT COUNT(*) INTO v_existing_count
            FROM notifications
            WHERE user_id = v_host_id
              AND type = 'booking_reminder'::notification_type
              AND related_booking_id = p_booking_id
              AND created_at > NOW() - INTERVAL '5 minutes';
              
            IF v_existing_count = 0 THEN
                INSERT INTO notifications (user_id, type, content, related_booking_id, related_car_id, is_read)
                VALUES (v_host_id, 'booking_reminder'::notification_type, COALESCE(p_content, 'Booking update for ' || v_car_title), p_booking_id, v_booking.car_id, false);
            END IF;
    END CASE;
    
    RAISE LOG 'Notification created for booking % with type %', p_booking_id, p_notification_type;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$function$;

-- Step 3: Create a function to help migrate existing notifications to role-based types
CREATE OR REPLACE FUNCTION public.migrate_existing_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_record RECORD;
    v_booking RECORD;
    v_new_type notification_type;
BEGIN
    -- Update existing generic booking_confirmed notifications to role-specific ones
    FOR notification_record IN 
        SELECT n.*, b.renter_id, c.owner_id
        FROM notifications n
        JOIN bookings b ON b.id = n.related_booking_id
        JOIN cars c ON c.id = b.car_id
        WHERE n.type = 'booking_confirmed'
          AND n.created_at > NOW() - INTERVAL '30 days'
    LOOP
        -- Determine if this notification should be host or renter specific
        IF notification_record.user_id = notification_record.owner_id THEN
            v_new_type := 'booking_confirmed_host'::notification_type;
        ELSIF notification_record.user_id = notification_record.renter_id THEN
            v_new_type := 'booking_confirmed_renter'::notification_type;
        ELSE
            CONTINUE; -- Skip notifications that don't match expected recipients
        END IF;
        
        -- Update the notification type
        UPDATE notifications 
        SET type = v_new_type
        WHERE id = notification_record.id;
    END LOOP;
    
    RAISE LOG 'Migration of existing notifications completed';
END;
$function$;

-- Step 4: Add indexes for the new notification types to improve query performance
CREATE INDEX IF NOT EXISTS idx_notifications_role_based_types 
ON notifications(user_id, type) 
WHERE type IN (
    'booking_request_received', 'booking_request_sent',
    'booking_confirmed_host', 'booking_confirmed_renter',
    'booking_cancelled_host', 'booking_cancelled_renter',
    'pickup_reminder_host', 'pickup_reminder_renter',
    'return_reminder_host', 'return_reminder_renter'
);

-- Step 5: Create a view to help analyze notification patterns by role
CREATE OR REPLACE VIEW public.notification_role_analysis AS
SELECT 
    n.user_id,
    p.full_name,
    p.role as profile_role,
    CASE 
        WHEN n.type LIKE '%_host' OR n.type = 'booking_request_received' THEN 'host'
        WHEN n.type LIKE '%_renter' OR n.type = 'booking_request_sent' THEN 'renter'
        ELSE 'generic'
    END as notification_role,
    n.type as notification_type,
    COUNT(*) as notification_count,
    MAX(n.created_at) as latest_notification
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.related_booking_id IS NOT NULL
GROUP BY n.user_id, p.full_name, p.role, notification_role, n.type
ORDER BY n.user_id, notification_count DESC;

-- Step 6: Add a comment explaining the migration
COMMENT ON FUNCTION public.create_booking_notification(uuid, text, text) IS 
'Enhanced booking notification function with proper role-based targeting. 
Addresses the critical issue where users received confusing notifications 
due to profile role vs actual booking role mismatches.';

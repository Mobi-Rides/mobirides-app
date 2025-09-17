-- Add navigation-related notification types
-- These are missing from the current system and needed for GPS/location features

-- Add new notification types for navigation features
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'navigation_started' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'navigation_started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pickup_location_shared' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'pickup_location_shared';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_location_shared' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'return_location_shared';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'arrival_notification' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'arrival_notification';
  END IF;
END $$;

-- Enhance the create_booking_notification function to handle navigation types
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
AS $function$
DECLARE
    v_booking RECORD;
    v_car_title TEXT;
    v_notification_enum notification_type;
    v_content TEXT;
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
    
    -- Generate content based on notification type
    CASE p_notification_type
        WHEN 'navigation_started' THEN
            v_content := 'Navigation started to pickup location for ' || v_car_title;
        WHEN 'pickup_location_shared' THEN
            v_content := 'Pickup location shared for ' || v_car_title;
        WHEN 'return_location_shared' THEN
            v_content := 'Return location shared for ' || v_car_title;
        WHEN 'arrival_notification' THEN
            v_content := 'Arrived at pickup location for ' || v_car_title;
        ELSE
            v_content := 'Navigation update for ' || v_car_title;
    END CASE;
    
    -- Insert notification with upsert to prevent duplicates
    INSERT INTO notifications (
        user_id, 
        type, 
        content, 
        related_booking_id, 
        related_car_id, 
        is_read,
        metadata
    ) VALUES (
        p_user_id,
        v_notification_enum,
        v_content,
        p_booking_id,
        v_booking.car_id,
        false,
        p_location_data
    )
    ON CONFLICT (user_id, type, related_booking_id) 
    DO UPDATE SET 
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        created_at = NOW();
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create navigation notification: %', SQLERRM;
END;
$function$;
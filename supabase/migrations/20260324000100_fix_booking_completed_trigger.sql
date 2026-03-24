-- Fix: add 'completed' case to handle_booking_status_change trigger
-- When a booking transitions to 'completed', release pending earnings to host wallet.
-- Previously this was missing, so release_pending_earnings() was never called from the DB layer.

CREATE OR REPLACE FUNCTION "public"."handle_booking_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    -- Handle booking completion: release pending earnings to host wallet
    IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        PERFORM release_pending_earnings(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

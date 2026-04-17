-- Migration: Update handle_handover_completion to handle cancellations and disputes
-- This migration updates the trigger function to skip completion if the booking is cancelled or if a dispute is flagged on the handover session or booking.

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.handle_handover_completion();

CREATE OR REPLACE FUNCTION public.handle_handover_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    booking_record record;
    car_record record;
    is_early_return boolean := false;
    handover_dispute boolean := false;
    booking_dispute boolean := false;
BEGIN
    -- Only process if handover_completed is being set to true
    IF NEW.handover_completed = true AND (OLD.handover_completed IS NULL OR OLD.handover_completed = false) THEN
        -- Only process return handovers
        IF NEW.handover_type = 'return' THEN
            -- Get booking details and dispute status
            SELECT b.*, c.brand, c.model, b.dispute_flag INTO booking_record
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            WHERE b.id = NEW.booking_id;

            -- Check for dispute flag on handover session and booking
            handover_dispute := COALESCE(NEW.dispute_flag, false);
            booking_dispute := COALESCE(booking_record.dispute_flag, false);

            -- Check if booking is cancelled or if there is a dispute
            IF booking_record.status = 'cancelled' THEN
                RETURN NEW; -- Do not complete if cancelled
            END IF;
            IF handover_dispute OR booking_dispute THEN
                -- Optionally, synchronize dispute flag to booking if needed
                IF NOT booking_dispute THEN
                    UPDATE bookings SET dispute_flag = true, updated_at = NOW() WHERE id = NEW.booking_id;
                END IF;
                RETURN NEW; -- Do not complete if dispute is flagged
            END IF;

            IF FOUND THEN
                -- Set actual_end_date to current timestamp
                -- Check if this is an early return by comparing with original end_date
                IF NOW() < booking_record.end_date THEN
                    is_early_return := true;
                END IF;

                -- Update the booking record
                UPDATE bookings 
                SET 
                    status = 'completed',
                    early_return = is_early_return,
                    actual_end_date = NOW(),
                    updated_at = NOW()
                WHERE id = NEW.booking_id;

                -- Create early return notification if applicable
                IF is_early_return THEN
                    -- Create notification for the host (car owner)
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.host_id,
                        'early_return_notification'::notification_type,
                        'Early Return Completed',
                        format('The %s %s has been returned early by the renter', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'original_end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                    -- Create notification for the renter
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.renter_id,
                        'early_return_notification'::notification_type,
                        'Early Return Confirmed',
                        format('You have successfully returned the %s %s early', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'original_end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                ELSE
                    -- Create regular completion notification for on-time returns
                    -- Create notification for the host
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.host_id,
                        'system_notification'::notification_type,
                        'Return Completed',
                        format('The %s %s has been returned successfully', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                    -- Create notification for the renter
                    INSERT INTO public.notifications (
                        user_id,
                        type,
                        title,
                        description,
                        metadata,
                        created_at
                    )
                    VALUES (
                        NEW.renter_id,
                        'system_notification'::notification_type,
                        'Return Confirmed',
                        format('You have successfully returned the %s %s', 
                               booking_record.brand, booking_record.model),
                        jsonb_build_object(
                            'booking_id', NEW.booking_id,
                            'handover_session_id', NEW.id,
                            'car_brand', booking_record.brand,
                            'car_model', booking_record.model,
                            'end_date', booking_record.end_date,
                            'actual_end_date', NOW(),
                            'handover_type', 'return'
                        ),
                        NOW()
                    );
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

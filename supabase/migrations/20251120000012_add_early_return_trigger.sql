-- Add trigger to handle booking completion when return handover is completed
-- This migration implements the missing early return logic that automatically
-- updates booking status, early_return flag, and actual_end_date upon return handover completion

-- Create function to handle handover completion
CREATE OR REPLACE FUNCTION public.handle_handover_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    booking_record record;
    car_record record;
    is_early_return boolean := false;
BEGIN
    -- Only process if handover_completed is being set to true
    IF NEW.handover_completed = true AND (OLD.handover_completed IS NULL OR OLD.handover_completed = false) THEN
        
        -- Only process return handovers
        IF NEW.handover_type = 'return' THEN
            
            -- Get booking details
            SELECT b.*, c.brand, c.model
            INTO booking_record
            FROM bookings b
            JOIN cars c ON b.car_id = c.id
            WHERE b.id = NEW.booking_id;
            
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

-- Create trigger on handover_sessions table
CREATE TRIGGER trigger_handle_handover_completion
    AFTER UPDATE ON public.handover_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_handover_completion();

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_handover_completion() IS 'Trigger function that handles booking completion when return handover sessions are completed. Updates booking status, early_return flag, actual_end_date, and sends notifications.';
COMMENT ON TRIGGER trigger_handle_handover_completion ON public.handover_sessions IS 'Trigger that automatically completes bookings and handles early return logic when return handover sessions are marked as completed.';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_handover_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_handover_completion() TO anon;
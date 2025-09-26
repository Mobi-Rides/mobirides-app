-- Fix booking notification duplicates and add email/push sending
-- This migration updates create_booking_notification to handle same-user scenarios
-- and adds HTTP calls to edge functions for email and push notifications

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
    v_notification_id UUID;
    v_user_email TEXT;
    v_push_subscription JSONB;
    v_template_id TEXT;
    v_http_response RECORD;
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
            -- If same user is both host and renter, create single notification
            IF v_host_id = v_renter_id THEN
                SELECT COUNT(*) INTO v_existing_count
                FROM notifications
                WHERE user_id = v_host_id
                  AND related_booking_id = p_booking_id
                  AND created_at > NOW() - INTERVAL '5 minutes';

                IF v_existing_count = 0 THEN
                    v_host_title := 'Booking Request (Self-Booking)';
                    v_host_content := 'You have submitted a booking request for your own ' || v_car_title || ' from ' ||
                                     TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');

                    INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                    VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'system_wide'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_request');
                END IF;
            ELSE
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
                    VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_request');
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
                    VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_renter_id, v_renter_title, v_renter_content, 'booking_request');
                END IF;
            END IF;

        WHEN 'booking_confirmed' THEN
            -- If same user is both host and renter, create single notification
            IF v_host_id = v_renter_id THEN
                SELECT COUNT(*) INTO v_existing_count
                FROM notifications
                WHERE user_id = v_host_id
                  AND related_booking_id = p_booking_id
                  AND created_at > NOW() - INTERVAL '5 minutes';

                IF v_existing_count = 0 THEN
                    v_host_title := 'Booking Confirmed (Self-Booking)';
                    v_host_content := 'Your booking for your own ' || v_car_title || ' has been confirmed for ' ||
                                     TO_CHAR(v_booking.start_date, 'Mon DD') || ' - ' || TO_CHAR(v_booking.end_date, 'Mon DD');

                    INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                    VALUES (v_host_id, 'booking_confirmed_renter'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'system_wide'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_confirmed');
                END IF;
            ELSE
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
                    VALUES (v_renter_id, 'booking_confirmed_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_renter_id, v_renter_title, v_renter_content, 'booking_confirmed');
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
                    VALUES (v_host_id, 'booking_confirmed_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_confirmed');
                END IF;
            END IF;

        WHEN 'booking_cancelled' THEN
            -- If same user is both host and renter, create single notification
            IF v_host_id = v_renter_id THEN
                SELECT COUNT(*) INTO v_existing_count
                FROM notifications
                WHERE user_id = v_host_id
                  AND related_booking_id = p_booking_id
                  AND created_at > NOW() - INTERVAL '5 minutes';

                IF v_existing_count = 0 THEN
                    v_host_title := 'Booking Cancelled (Self-Booking)';
                    v_host_content := 'Your booking for your own ' || v_car_title || ' has been cancelled';

                    INSERT INTO notifications (user_id, type, title, description, related_booking_id, related_car_id, is_read, role_target, metadata)
                    VALUES (v_host_id, 'booking_cancelled_renter'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'system_wide'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_cancelled');
                END IF;
            ELSE
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
                    VALUES (v_host_id, 'booking_cancelled_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_host_id, v_host_title, v_host_content, 'booking_cancelled');
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
                    VALUES (v_renter_id, 'booking_cancelled_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb)
                    RETURNING id INTO v_notification_id;

                    -- Send email and push for the notification
                    PERFORM send_notification_email_and_push(v_notification_id, v_renter_id, v_renter_title, v_renter_content, 'booking_cancelled');
                END IF;
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

-- Helper function to send email and push notifications
CREATE OR REPLACE FUNCTION public.send_notification_email_and_push(
    p_notification_id UUID,
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_email TEXT;
    v_push_subscription JSONB;
    v_template_id TEXT;
    v_http_response RECORD;
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Get Supabase URL and service role key from settings
    v_supabase_url := current_setting('app.supabase_url', true);
    v_service_role_key := current_setting('app.service_role_key', true);

    IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
        RAISE WARNING 'Supabase URL or service role key not configured for notifications';
        RETURN;
    END IF;

    -- Get user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE WARNING 'User email not found for user_id: %', p_user_id;
        RETURN;
    END IF;

    -- Map notification type to email template
    CASE p_type
        WHEN 'booking_request' THEN v_template_id := 'booking_request';
        WHEN 'booking_confirmed' THEN v_template_id := 'booking_confirmation';
        WHEN 'booking_cancelled' THEN v_template_id := 'booking_cancelled';
        ELSE v_template_id := 'system_notification';
    END CASE;

    -- Send email via resend-service edge function
    BEGIN
        SELECT * INTO v_http_response
        FROM http((
            'POST',
            v_supabase_url || '/functions/v1/resend-service',
            ARRAY[
                http_header('Authorization', 'Bearer ' || v_service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object(
                'to', v_user_email,
                'templateId', v_template_id,
                'data', json_build_object(
                    'name', (SELECT full_name FROM profiles WHERE id = p_user_id),
                    'title', p_title,
                    'description', p_description,
                    'type', p_type,
                    'timestamp', to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
                    'actionUrl', v_supabase_url || '/notifications'
                )
            )::text
        ));

        IF v_http_response.status != 200 THEN
            RAISE WARNING 'Failed to send email notification: HTTP %', v_http_response.status;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error sending email notification: %', SQLERRM;
    END;

    -- Get push subscription
    SELECT subscription INTO v_push_subscription
    FROM push_subscriptions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_push_subscription IS NOT NULL THEN
        -- Send push notification via send-push-notification edge function
        BEGIN
            SELECT * INTO v_http_response
            FROM http((
                'POST',
                v_supabase_url || '/functions/v1/send-push-notification',
                ARRAY[
                    http_header('Authorization', 'Bearer ' || v_service_role_key),
                    http_header('Content-Type', 'application/json')
                ],
                'application/json',
                json_build_object(
                    'subscription', v_push_subscription,
                    'payload', json_build_object(
                        'title', p_title,
                        'body', p_description,
                        'icon', '/favicon.ico',
                        'url', '/notifications',
                        'notification_type', p_type
                    )
                )::text
            ));

            IF v_http_response.status != 200 THEN
                RAISE WARNING 'Failed to send push notification: HTTP %', v_http_response.status;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
            RAISE WARNING 'Error sending push notification: %', SQLERRM;
        END;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in send_notification_email_and_push: %', SQLERRM;
END;
$function$;

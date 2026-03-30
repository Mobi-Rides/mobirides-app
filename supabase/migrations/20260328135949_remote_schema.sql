drop policy "dynamic_pricing_rules_read_all_authenticated" on "public"."dynamic_pricing_rules";

drop policy "dynamic_pricing_rules_write_super_admin" on "public"."dynamic_pricing_rules";

drop policy "Authenticated can view commission rates" on "public"."insurance_commission_rates";

drop policy "Super admins manage commission rates" on "public"."insurance_commission_rates";

drop policy "platform_settings_read_all_authenticated" on "public"."platform_settings";

drop policy "platform_settings_write_super_admin" on "public"."platform_settings";

drop policy "Admins can view remittance batches" on "public"."premium_remittance_batches";

drop policy "Super admins manage remittance batches" on "public"."premium_remittance_batches";

drop policy "Admins can view their own activity logs" on "public"."admin_activity_logs";

revoke delete on table "public"."dynamic_pricing_rules" from "anon";

revoke insert on table "public"."dynamic_pricing_rules" from "anon";

revoke references on table "public"."dynamic_pricing_rules" from "anon";

revoke select on table "public"."dynamic_pricing_rules" from "anon";

revoke trigger on table "public"."dynamic_pricing_rules" from "anon";

revoke truncate on table "public"."dynamic_pricing_rules" from "anon";

revoke update on table "public"."dynamic_pricing_rules" from "anon";

revoke delete on table "public"."dynamic_pricing_rules" from "authenticated";

revoke insert on table "public"."dynamic_pricing_rules" from "authenticated";

revoke references on table "public"."dynamic_pricing_rules" from "authenticated";

revoke select on table "public"."dynamic_pricing_rules" from "authenticated";

revoke trigger on table "public"."dynamic_pricing_rules" from "authenticated";

revoke truncate on table "public"."dynamic_pricing_rules" from "authenticated";

revoke update on table "public"."dynamic_pricing_rules" from "authenticated";

revoke delete on table "public"."dynamic_pricing_rules" from "service_role";

revoke insert on table "public"."dynamic_pricing_rules" from "service_role";

revoke references on table "public"."dynamic_pricing_rules" from "service_role";

revoke select on table "public"."dynamic_pricing_rules" from "service_role";

revoke trigger on table "public"."dynamic_pricing_rules" from "service_role";

revoke truncate on table "public"."dynamic_pricing_rules" from "service_role";

revoke update on table "public"."dynamic_pricing_rules" from "service_role";

revoke delete on table "public"."platform_settings" from "anon";

revoke insert on table "public"."platform_settings" from "anon";

revoke references on table "public"."platform_settings" from "anon";

revoke select on table "public"."platform_settings" from "anon";

revoke trigger on table "public"."platform_settings" from "anon";

revoke truncate on table "public"."platform_settings" from "anon";

revoke update on table "public"."platform_settings" from "anon";

revoke delete on table "public"."platform_settings" from "authenticated";

revoke insert on table "public"."platform_settings" from "authenticated";

revoke references on table "public"."platform_settings" from "authenticated";

revoke select on table "public"."platform_settings" from "authenticated";

revoke trigger on table "public"."platform_settings" from "authenticated";

revoke truncate on table "public"."platform_settings" from "authenticated";

revoke update on table "public"."platform_settings" from "authenticated";

revoke delete on table "public"."platform_settings" from "service_role";

revoke insert on table "public"."platform_settings" from "service_role";

revoke references on table "public"."platform_settings" from "service_role";

revoke select on table "public"."platform_settings" from "service_role";

revoke trigger on table "public"."platform_settings" from "service_role";

revoke truncate on table "public"."platform_settings" from "service_role";

revoke update on table "public"."platform_settings" from "service_role";

alter table "public"."handover_sessions" drop constraint "handover_sessions_booking_id_handover_type_key";

alter table "public"."platform_settings" drop constraint "platform_settings_setting_key_key";

alter table "public"."platform_settings" drop constraint "platform_settings_updated_by_fkey";

alter table "public"."conversation_messages" drop constraint "conversation_messages_message_type_check";

drop function if exists "public"."get_platform_settings"();

drop function if exists "public"."update_platform_setting"(p_key text, p_value jsonb);

alter table "public"."dynamic_pricing_rules" drop constraint "dynamic_pricing_rules_pkey";

alter table "public"."platform_settings" drop constraint "platform_settings_pkey";

drop index if exists "public"."dynamic_pricing_rules_pkey";

drop index if exists "public"."handover_sessions_booking_id_handover_type_key";

drop index if exists "public"."platform_settings_pkey";

drop index if exists "public"."platform_settings_setting_key_key";

drop table "public"."dynamic_pricing_rules";

drop table "public"."platform_settings";

alter type "public"."notification_type" rename to "notification_type__old_version_to_be_dropped";

create type "public"."notification_type" as enum ('booking_request_received', 'booking_request_sent', 'booking_confirmed_host', 'booking_confirmed_renter', 'booking_cancelled_host', 'booking_cancelled_renter', 'pickup_reminder_host', 'pickup_reminder_renter', 'return_reminder_host', 'return_reminder_renter', 'wallet_topup', 'wallet_deduction', 'message_received', 'handover_ready', 'payment_received', 'payment_failed', 'system_notification', 'navigation_started', 'pickup_location_shared', 'return_location_shared', 'arrival_notification', 'early_return_notification', 'pickup_reminder', 'return_reminder', 'claim_submitted', 'claim_status_updated');

alter table "public"."notification_expiration_policies" alter column notification_type type "public"."notification_type" using notification_type::text::"public"."notification_type";

alter table "public"."notifications" alter column type type "public"."notification_type" using type::text::"public"."notification_type";

drop type "public"."notification_type__old_version_to_be_dropped";

alter table "public"."insurance_commission_rates" drop column "rate";

alter table "public"."insurance_commission_rates" disable row level security;

alter table "public"."insurance_packages" drop column "daily_premium_amount";

alter table "public"."insurance_packages" drop column "excess_percentage";

alter table "public"."premium_remittance_batches" disable row level security;

drop sequence if exists "public"."premium_remittance_seq";

alter table "public"."notifications" add constraint "notifications_content_or_description_required" CHECK (((content IS NOT NULL) OR (description IS NOT NULL))) not valid;

alter table "public"."notifications" validate constraint "notifications_content_or_description_required";

alter table "public"."conversation_messages" add constraint "conversation_messages_message_type_check" CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'video'::character varying, 'audio'::character varying, 'file'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."conversation_messages" validate constraint "conversation_messages_message_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.advance_handover_step(p_session_id uuid, p_completed_step_name text, p_user_id uuid, p_user_role text, p_completion_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_session RECORD;
  v_current_step RECORD;
  v_is_host BOOLEAN;
  v_is_renter BOOLEAN;
  v_next_step RECORD;
BEGIN
  -- Get session and current step
  SELECT * INTO v_session FROM public.handover_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  v_is_host := (p_user_role = 'host' AND v_session.host_id = p_user_id);
  v_is_renter := (p_user_role = 'renter' AND v_session.renter_id = p_user_id);

  IF NOT v_is_host AND NOT v_is_renter THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized or invalid role');
  END IF;

  -- Get current step completion record
  SELECT * INTO v_current_step 
  FROM public.handover_step_completion 
  WHERE handover_session_id = p_session_id 
  AND step_order = v_session.current_step_order;

  -- Update completion based on role
  IF v_is_host THEN
    UPDATE public.handover_step_completion
    SET 
      host_completed = TRUE,
      host_completed_at = NOW(),
      completion_data = completion_data || p_completion_data,
      completed_by = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN p_user_id ELSE completed_by END,
      completed_at = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN NOW() ELSE completed_at END,
      is_completed = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN TRUE ELSE is_completed END
    WHERE id = v_current_step.id;
  ELSIF v_is_renter THEN
    UPDATE public.handover_step_completion
    SET 
      renter_completed = TRUE,
      renter_completed_at = NOW(),
      completion_data = completion_data || p_completion_data,
      completed_by = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN p_user_id ELSE completed_by END,
      completed_at = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN NOW() ELSE completed_at END,
      is_completed = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN TRUE ELSE is_completed END
    WHERE id = v_current_step.id;
  END IF;

  -- Special Logic for Location Selection
  IF p_completed_step_name = 'location_selection' AND v_is_host THEN
    UPDATE public.handover_sessions
    SET 
      handover_location_lat = (p_completion_data->>'latitude')::DOUBLE PRECISION,
      handover_location_lng = (p_completion_data->>'longitude')::DOUBLE PRECISION,
      handover_location_name = p_completion_data->>'address',
      handover_location_type = COALESCE(p_completion_data->>'type', 'custom_pin')
    WHERE id = p_session_id;
  END IF;

  -- Refresh current step data
  SELECT * INTO v_current_step FROM public.handover_step_completion WHERE id = v_current_step.id;

  -- If current step is now fully completed, advance to next step
  IF v_current_step.is_completed THEN
    -- Get next step
    SELECT * INTO v_next_step 
    FROM public.handover_step_completion 
    WHERE handover_session_id = p_session_id 
    AND step_order = v_session.current_step_order + 1;

    IF FOUND THEN
      UPDATE public.handover_sessions
      SET 
        current_step_order = v_next_step.step_order,
        waiting_for = CASE 
          WHEN v_next_step.step_owner = 'both' THEN 'both'
          ELSE v_next_step.step_owner
        END
      WHERE id = p_session_id;
    ELSE
      -- No more steps, mark session as completed
      UPDATE public.handover_sessions
      SET 
        handover_completed = TRUE,
        waiting_for = 'none'
      WHERE id = p_session_id;
    END IF;
  ELSE
    -- Step not fully completed (waiting for the other party in 'both' step)
    UPDATE public.handover_sessions
    SET 
      waiting_for = CASE 
        WHEN v_is_host THEN 'renter'
        ELSE 'host'
      END
    WHERE id = p_session_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analyze_conversation_query_performance()
 RETURNS TABLE(query_type text, table_name text, index_usage text, estimated_cost numeric, recommendations text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- This function can be used to analyze query performance
    -- and identify slow queries in the conversation system
    
    RETURN QUERY
    SELECT 
        'conversation_lookup'::text as query_type,
        'conversations'::text as table_name,
        'Check EXPLAIN ANALYZE for actual usage'::text as index_usage,
        0::numeric as estimated_cost,
        'Monitor slow query log for conversation queries'::text as recommendations;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := NEW.user_id,
      p_action_details := jsonb_build_object('role', NEW.role, 'assigned_by', NEW.assigned_by)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := NEW.user_id,
      p_action_details := jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role, 'assigned_by', NEW.assigned_by)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := OLD.user_id,
      p_action_details := jsonb_build_object('role_removed', OLD.role)
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_handover_progress(handover_session_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_total_steps INTEGER;
  v_completed_steps INTEGER;
  v_current_step_order INTEGER;
  v_handover_completed BOOLEAN;
  v_progress_percentage FLOAT;
BEGIN
  -- Get session status
  SELECT 
    current_step_order, 
    handover_completed 
  INTO 
    v_current_step_order, 
    v_handover_completed 
  FROM public.handover_sessions 
  WHERE id = handover_session_id_param;

  -- Count total steps
  SELECT COUNT(*) INTO v_total_steps 
  FROM public.handover_step_completion 
  WHERE handover_session_id = handover_session_id_param;

  -- Count completed steps
  SELECT COUNT(*) INTO v_completed_steps 
  FROM public.handover_step_completion 
  WHERE handover_session_id = handover_session_id_param 
  AND is_completed = TRUE;

  -- Calculate percentage
  IF v_total_steps > 0 THEN
    v_progress_percentage := (v_completed_steps::FLOAT / v_total_steps::FLOAT) * 100;
  ELSE
    v_progress_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_steps', v_total_steps,
    'completed_steps', v_completed_steps,
    'current_step', v_current_step_order,
    'progress_percentage', v_progress_percentage,
    'is_completed', v_handover_completed
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_column_exists(p_table_name text, p_column_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns isc
    WHERE isc.table_schema = 'public' 
    AND isc.table_name = p_table_name 
    AND isc.column_name = p_column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_verification_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Auto-complete address verification for new records
    IF NEW.address_confirmed IS NULL THEN
        NEW.address_confirmed := true;
    END IF;
    
    -- Check if all steps are completed
    IF NEW.personal_info_completed = true 
       AND NEW.documents_completed = true 
       AND NEW.selfie_completed = true 
       AND NEW.phone_verified = true 
       AND NEW.address_confirmed = true 
       AND NEW.overall_status != 'completed' THEN
        
        NEW.overall_status := 'completed';
        NEW.completed_at := NOW();
        NEW.current_step := 'COMPLETION';
    END IF;
    
    NEW.last_updated_at := NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_verification_completion(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    verification_complete BOOLEAN;
BEGIN
    SELECT 
        personal_info_completed AND 
        documents_completed AND 
        phone_verified AND 
        address_confirmed
    INTO verification_complete
    FROM public.user_verifications
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(verification_complete, false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_expired_locations()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.real_time_locations
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_confirmations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.pending_confirmations 
    WHERE expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_check_column_function()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function just exists to be called via RPC to create the check_column_exists function
  -- The actual implementation is in the check_column_exists function above
  NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_claim_notification(p_user_id uuid, p_claim_number text, p_status text, p_is_new_claim boolean DEFAULT false)
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
    IF p_is_new_claim THEN
        v_title := 'Claim Submitted';
        v_description := 'Your insurance claim ' || p_claim_number || ' has been submitted and is under review.';
        v_notification_type := 'claim_submitted';
    ELSE
        v_title := 'Claim Status Updated';
        CASE p_status
            WHEN 'approved' THEN
                v_description := 'Great news! Your claim ' || p_claim_number || ' has been approved.';
            WHEN 'rejected' THEN
                v_description := 'Your claim ' || p_claim_number || ' has been rejected. Please check for details.';
            WHEN 'paid' THEN
                v_description := 'Your claim ' || p_claim_number || ' payout has been processed.';
            WHEN 'under_review' THEN
                v_description := 'Your claim ' || p_claim_number || ' is now under review.';
            WHEN 'more_info_needed' THEN
                v_description := 'Additional information is required for claim ' || p_claim_number || '.';
            ELSE
                v_description := 'Your claim ' || p_claim_number || ' status has been updated to: ' || p_status;
        END CASE;
        v_notification_type := 'claim_status_updated';
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read,
        role_target,
        metadata
    ) VALUES (
        p_user_id,
        v_notification_type,
        v_title,
        v_description,
        false,
        'renter_only'::notification_role,
        jsonb_build_object('claim_number', p_claim_number, 'status', p_status)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create claim notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(p_created_by uuid, p_participant_ids uuid[], p_title text DEFAULT NULL::text, p_type text DEFAULT 'direct'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_participant_id uuid;
BEGIN
  -- Create conversation (type is VARCHAR, not enum)
  INSERT INTO public.conversations (
    title,
    type,
    created_by
  )
  VALUES (
    p_title,
    p_type, -- Direct VARCHAR, no cast needed
    p_created_by
  )
  RETURNING conversations.id INTO v_conversation_id;
  
  -- Add creator as participant
  INSERT INTO public.conversation_participants (
    conversation_id,
    user_id,
    joined_at,
    is_admin
  ) VALUES (
    v_conversation_id,
    p_created_by,
    NOW(),
    true
  );
  
  -- Add other participants
  IF p_participant_ids IS NOT NULL THEN
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
      IF v_participant_id != p_created_by THEN
        INSERT INTO public.conversation_participants (
          conversation_id,
          user_id,
          joined_at,
          is_admin
        ) VALUES (
          v_conversation_id,
          v_participant_id,
          NOW(),
          false
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_conversation_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_progress_notification(p_handover_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_record record;
    -- REMOVED: booking_record record (was unused)
    car_record record;
    progress_percentage integer;
    progress_data jsonb;  -- Use jsonb first, then extract integer
    current_step text;
BEGIN
    -- Get handover session details
    SELECT hs.booking_id, b.renter_id, b.car_id, hs.host_id, hs.renter_id AS session_renter_id
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Calculate progress with explicit type handling
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_data;
        progress_percentage := (progress_data->>'progress_percentage')::integer;  -- FIX: explicit cast
    EXCEPTION WHEN OTHERS THEN
        progress_percentage := 0;
    END;
    
    -- Get the most recent incomplete step
    SELECT step_name
    INTO current_step
    FROM handover_step_completion
    WHERE handover_session_id = p_handover_session_id
      AND is_completed = false
    ORDER BY step_order ASC
    LIMIT 1;
    
    -- Create progress notifications for both users
    IF session_record.host_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            session_record.host_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'in_progress',
            current_step,
            progress_percentage
        );
    END IF;
    
    IF session_record.session_renter_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            session_record.session_renter_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'in_progress',
            current_step,
            progress_percentage
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_handover_step_notification(p_handover_session_id uuid, p_step_name text, p_completed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_record record;
    car_record record;
    other_user_id uuid;
    progress_percentage integer;
    progress_data jsonb;  -- Use jsonb first, then extract integer
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Calculate progress with explicit type handling
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_data;
        progress_percentage := (progress_data->>'progress_percentage')::integer;  -- FIX: explicit cast
    EXCEPTION WHEN OTHERS THEN
        progress_percentage := 0;
    END;
    
    -- Determine the other user
    IF p_completed_by = session_record.host_id THEN
        other_user_id := session_record.renter_id;
    ELSE
        other_user_id := session_record.host_id;
    END IF;
    
    -- Create notification for the other user
    IF other_user_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            other_user_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'step_completed',
            p_step_name,
            progress_percentage
        );
    END IF;
    
    -- If handover is complete, create completion notification
    IF progress_percentage >= 100 AND other_user_id IS NOT NULL THEN
        PERFORM create_handover_notification(
            other_user_id,
            'pickup',
            car_record.brand,
            car_record.model,
            '',
            'completed',
            NULL,
            100
        );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_navigation_notification(p_booking_id uuid, p_notification_type text, p_user_id uuid, p_location_data jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking RECORD;
    v_car_title TEXT;
    v_notification_enum notification_type;
    v_title TEXT;
    v_description TEXT;
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
    
    -- Generate title and description based on notification type
    CASE p_notification_type
        WHEN 'navigation_started' THEN
            v_title := 'Navigation Started';
            v_description := 'Navigation started to pickup location for ' || v_car_title;
        WHEN 'pickup_location_shared' THEN
            v_title := 'Pickup Location Shared';
            v_description := 'Pickup location shared for ' || v_car_title;
        WHEN 'return_location_shared' THEN
            v_title := 'Return Location Shared';
            v_description := 'Return location shared for ' || v_car_title;
        WHEN 'arrival_notification' THEN
            v_title := 'Arrived at Pickup';
            v_description := 'Arrived at pickup location for ' || v_car_title;
        ELSE
            v_title := 'Navigation Update';
            v_description := 'Navigation update for ' || v_car_title;
    END CASE;
    
    -- Insert notification (removed ON CONFLICT as constraint doesn't exist)
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id, 
        related_car_id, 
        is_read,
        metadata
    ) VALUES (
        p_user_id,
        v_notification_enum,
        v_title,
        v_description,
        p_booking_id,
        v_booking.car_id,
        false,
        p_location_data
    );
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create navigation notification: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_with_expiration(p_user_id uuid, p_type public.notification_type, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_content text DEFAULT NULL::text, p_role_target public.notification_role DEFAULT 'system_wide'::public.notification_role, p_related_booking_id uuid DEFAULT NULL::uuid, p_related_car_id uuid DEFAULT NULL::uuid, p_related_user_id uuid DEFAULT NULL::uuid, p_priority integer DEFAULT 1, p_metadata jsonb DEFAULT '{}'::jsonb, p_custom_expiration_hours integer DEFAULT NULL::integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    notification_id BIGINT;
    expiration_timestamp TIMESTAMP WITH TIME ZONE := NULL;
    policy_expiration_hours INTEGER;
BEGIN
    -- Validate that either content or description is provided
    IF (p_content IS NULL OR p_content = '') AND (p_description IS NULL OR p_description = '') THEN
        RAISE EXCEPTION 'Either content or description must be provided';
    END IF;
    
    -- Determine expiration timestamp
    IF p_custom_expiration_hours IS NOT NULL THEN
        expiration_timestamp := NOW() + INTERVAL '1 hour' * p_custom_expiration_hours;
    ELSE
        SELECT default_expiration_hours INTO policy_expiration_hours
        FROM public.notification_expiration_policies
        WHERE notification_type = p_type;
        
        IF policy_expiration_hours IS NOT NULL THEN
            expiration_timestamp := NOW() + INTERVAL '1 hour' * policy_expiration_hours;
        END IF;
    END IF;
    
    -- Insert notification WITHOUT priority and related_user_id (columns don't exist)
    INSERT INTO public.notifications (
        user_id, type, title, description, role_target,
        related_booking_id, related_car_id,
        metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_role_target,
        p_related_booking_id, p_related_car_id,
        p_metadata, expiration_timestamp
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_renter_arrival_notification(p_booking_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host_id UUID;
  v_car_brand TEXT;
  v_car_model TEXT;
  v_notification_id BIGINT;
  v_car_location TEXT;
BEGIN
  -- Get host ID and car details from booking
  SELECT 
    c.owner_id,
    c.brand,
    c.model,
    c.location
  INTO 
    v_host_id,
    v_car_brand,
    v_car_model,
    v_car_location
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;

  -- Check if host exists
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Host not found for booking %', p_booking_id;
  END IF;

  -- Create notification for host
  INSERT INTO notifications (
    user_id,
    type,
    title,
    description,
    related_booking_id,
    is_read,
    created_at,
    expires_at
  )
  VALUES (
    v_host_id,
    'arrival_notification'::notification_type,
    'Renter has arrived',
    format('The renter has arrived at %s for your %s %s. Please proceed to complete the handover process.', 
           COALESCE(v_car_location, 'the pickup location'), v_car_brand, v_car_model),
    p_booking_id,
    false,
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.decrypt_message_content(p_cipher bytea)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
SELECT pgp_sym_decrypt(p_cipher, public.get_encryption_key())
$function$
;

CREATE OR REPLACE FUNCTION public.encrypt_message_content(p_text text)
 RETURNS bytea
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
SELECT pgp_sym_encrypt(p_text, public.get_encryption_key())
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_step_dependencies()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check dependencies when marking a step as completed
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    -- Skip dependency check for the first step
    IF NEW.step_order > 1 THEN
      IF NOT public.validate_step_dependencies(NEW.handover_session_id, NEW.step_order) THEN
        RAISE EXCEPTION 'Cannot complete step %. Previous steps must be completed first.', NEW.step_name;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_audit_hash(event_type public.audit_event_type, actor_id uuid, target_id uuid, action_details jsonb, event_timestamp timestamp with time zone, previous_hash text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    hash_input text;
BEGIN
    -- Create hash input string
    hash_input := event_type::text || '|' ||
                  COALESCE(actor_id::text, '') || '|' ||
                  COALESCE(target_id::text, '') || '|' ||
                  action_details::text || '|' ||
                  event_timestamp::text || '|' ||
                  COALESCE(previous_hash, '');

    -- Return SHA-256 hash
    RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(id uuid, email text, full_name text, phone_number text, role public.user_role, created_at timestamp with time zone, avatar_url text, verification_status public.verification_status)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT 
    p.id,
    u.email::text,
    p.full_name,
    p.phone_number,
    p.role,
    p.created_at,
    p.avatar_url,
    p.verification_status
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_encryption_key()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  k text;
BEGIN
  k := current_setting('app.encryption_key', true);
  IF k IS NULL OR k = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key.';
  END IF;
  RETURN k;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_search_term text DEFAULT NULL::text)
 RETURNS TABLE(conv_id uuid, title text, conv_type character varying, last_message_at timestamp with time zone, participants json, last_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_user_id uuid;
    v_offset integer;
BEGIN
    v_current_user_id := auth.uid();
    v_offset := (p_page - 1) * p_page_size;
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    RETURN QUERY
    WITH conversation_data AS (
        SELECT 
            c.id AS cid,
            c.title,
            c.type,
            c.last_message_at,
            (
                SELECT json_agg(
                    json_build_object(
                        'user_id', p.user_id,
                        'full_name', pr.full_name,
                        'avatar_url', pr.avatar_url
                    )
                )
                FROM conversation_participants p
                JOIN profiles pr ON p.user_id = pr.id
                WHERE p.conversation_id = c.id
            ) AS participants,
            (
                SELECT cm.content 
                FROM conversation_messages cm
                WHERE cm.conversation_id = c.id
                ORDER BY cm.created_at DESC
                LIMIT 1
            ) AS last_message
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE 
            cp.user_id = v_current_user_id
            AND (
                p_search_term IS NULL 
                OR c.title ILIKE '%' || p_search_term || '%'
                OR EXISTS (
                    SELECT 1 
                    FROM profiles p
                    JOIN conversation_participants cp2 ON p.id = cp2.user_id
                    WHERE cp2.conversation_id = c.id 
                    AND p.full_name ILIKE '%' || p_search_term || '%'
                )
            )
    )
    SELECT 
        cid AS conv_id,
        conversation_data.title,
        conversation_data.type AS conv_type,
        conversation_data.last_message_at,
        conversation_data.participants,
        conversation_data.last_message
    FROM conversation_data
    ORDER BY conversation_data.last_message_at DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_review_stats(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB := '{}'::jsonb;  -- FIX: explicit jsonb cast
    host_rating NUMERIC;
    renter_rating NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- Calculate host rating (when user is being reviewed as a host)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO host_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'renter_to_host'
    AND status = 'published';
    
    -- Calculate renter rating (when user is being reviewed as a renter)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO renter_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'host_to_renter'
    AND status = 'published';
    
    -- Count total reviews received
    SELECT COUNT(*) INTO total_reviews
    FROM reviews
    WHERE reviewee_id = user_uuid
    AND review_type IN ('host_to_renter', 'renter_to_host')
    AND status = 'published';
    
    result := jsonb_build_object(
        'host_rating', host_rating,
        'renter_rating', renter_rating,
        'total_reviews', total_reviews,
        'overall_rating', COALESCE((host_rating + renter_rating) / NULLIF(2, 0), 0)
    );
    
    RETURN result;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_handover_step_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only create notifications when a step is completed
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        PERFORM create_handover_step_notification(
            NEW.handover_session_id,
            NEW.step_name,
            NEW.completed_by
        );
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_full_name text;
    user_phone_number text;
    user_email text;
BEGIN
    -- Extract user data
    user_email := NEW.email;
    user_full_name := NEW.raw_user_meta_data ->> 'full_name';
    user_phone_number := NEW.raw_user_meta_data ->> 'phone_number';
    
    -- Log the extracted data for debugging
    RAISE LOG 'handle_new_user: Processing user % with email %, full_name %, phone %',
        NEW.id, user_email, user_full_name, user_phone_number;
    
    -- Insert into profiles with extracted data
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        email_confirmed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_full_name,
        user_phone_number,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW()
    );
    
    -- Log successful profile creation
    RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
    
    -- Call edge function to send welcome email (if email exists)
    IF user_email IS NOT NULL THEN
        BEGIN
            -- This will be handled by the resend-service edge function
            RAISE LOG 'handle_new_user: Email service call would be made for %', user_email;
        EXCEPTION WHEN OTHERS THEN
            -- Don't fail the user creation if email fails
            RAISE LOG 'handle_new_user: Email service failed for user %, error: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE LOG 'handle_new_user: Error processing user %, error: %', NEW.id, SQLERRM;
        -- Still return NEW to allow user creation to succeed
        RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_conversation(p_title text, p_type character varying, p_participant_ids uuid[])
 RETURNS TABLE(conversation_id uuid, participant_ids uuid[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
  v_participant_ids uuid[];
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Create conversation
  INSERT INTO public.conversations (title, type, created_by)
  VALUES (p_title, p_type, v_current_user_id)
  RETURNING id INTO v_conversation_id;
  
  -- Insert participants using a loop to properly handle is_admin logic
  FOR i IN 1..array_length(p_participant_ids, 1) LOOP
    INSERT INTO conversation_participants (
      conversation_id, 
      user_id, 
      joined_at,
      is_admin
    ) VALUES (
      v_conversation_id,
      p_participant_ids[i],
      NOW(),
      p_participant_ids[i] = v_current_user_id
    );
  END LOOP;
  
  -- Get all participant IDs
  SELECT array_agg(cp.user_id)
  INTO v_participant_ids
  FROM conversation_participants cp
  WHERE cp.conversation_id = v_conversation_id;
  
  conversation_id := v_conversation_id;
  participant_ids := v_participant_ids;
  RETURN NEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role::text IN ('admin', 'super_admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_admin_activity(p_admin_id uuid, p_action text, p_resource_type text DEFAULT NULL::text, p_resource_id text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ip_address INET;
  v_user_agent TEXT;
  v_resource_uuid UUID;
BEGIN
  -- Try to get IP address and user agent from request headers
  BEGIN
    v_ip_address := (current_setting('request.headers', true)::json->>'x-forwarded-for')::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
  END;
  
  BEGIN
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;
  
  -- Cast resource_id to UUID if provided
  IF p_resource_id IS NOT NULL AND p_resource_id != '' THEN
    BEGIN
      v_resource_uuid := p_resource_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_resource_uuid := NULL;
    END;
  END IF;
  
  -- Insert the activity log
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_admin_id,
    p_action,
    p_resource_type,
    v_resource_uuid,
    p_details,
    v_ip_address,
    v_user_agent,
    NOW()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_event_type public.audit_event_type, p_severity public.audit_severity DEFAULT 'medium'::public.audit_severity, p_actor_id uuid DEFAULT auth.uid(), p_target_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_location_data jsonb DEFAULT NULL::jsonb, p_action_details jsonb DEFAULT '{}'::jsonb, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text, p_anomaly_flags jsonb DEFAULT NULL::jsonb, p_compliance_tags text[] DEFAULT NULL::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_audit_id uuid;
    prev_hash text;
    curr_hash text;
BEGIN
    -- Get the previous hash (most recent audit log)
    SELECT current_hash INTO prev_hash
    FROM public.audit_logs
    ORDER BY event_timestamp DESC, id DESC
    LIMIT 1;

    -- Generate current hash
    curr_hash := generate_audit_hash(
        p_event_type,
        p_actor_id,
        p_target_id,
        p_action_details,
        now(),
        prev_hash
    );

    -- Insert the audit log
    INSERT INTO public.audit_logs (
        event_type,
        severity,
        actor_id,
        target_id,
        session_id,
        ip_address,
        user_agent,
        location_data,
        action_details,
        previous_hash,
        current_hash,
        resource_type,
        resource_id,
        reason,
        anomaly_flags,
        compliance_tags
    ) VALUES (
        p_event_type,
        p_severity,
        p_actor_id,
        p_target_id,
        p_session_id,
        p_ip_address,
        p_user_agent,
        p_location_data,
        p_action_details,
        prev_hash,
        curr_hash,
        p_resource_type,
        p_resource_id,
        p_reason,
        p_anomaly_flags,
        p_compliance_tags
    )
    RETURNING id INTO new_audit_id;

    RETURN new_audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Allow inserts only
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Prevent updates and deletes
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_push_subscription(p_user_id uuid, p_endpoint text, p_p256dh_key text, p_auth_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (p_user_id, p_endpoint, p_p256dh_key, p_auth_key)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    endpoint = EXCLUDED.endpoint,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_conversation_message(p_conversation_id uuid, p_content text, p_message_type text DEFAULT 'text'::text, p_related_car_id uuid DEFAULT NULL::uuid, p_reply_to_message_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
    v_participant_exists BOOLEAN;
    -- REMOVED: v_result JSON (was unused)
BEGIN
    -- Get the authenticated user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Validate required parameters
    IF p_conversation_id IS NULL OR p_content IS NULL OR trim(p_content) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Missing required parameters: conversation_id and content'
        );
    END IF;
    
    -- Check if user is a participant in the conversation
    SELECT EXISTS(
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = v_user_id
    ) INTO v_participant_exists;
    
    IF NOT v_participant_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is not a participant in this conversation'
        );
    END IF;
    
    -- Validate reply_to_message_id if provided
    IF p_reply_to_message_id IS NOT NULL THEN
        IF NOT EXISTS(
            SELECT 1 FROM conversation_messages 
            WHERE id = p_reply_to_message_id 
            AND conversation_id = p_conversation_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Reply message not found in this conversation'
            );
        END IF;
    END IF;
    
    -- Validate related_car_id if provided
    IF p_related_car_id IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM cars WHERE id = p_related_car_id) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Related car not found'
            );
        END IF;
    END IF;
    
    -- Insert the message
    INSERT INTO conversation_messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        related_car_id,
        reply_to_message_id,
        metadata
    ) VALUES (
        p_conversation_id,
        v_user_id,
        p_content,
        p_message_type,
        p_related_car_id,
        p_reply_to_message_id,
        p_metadata
    ) RETURNING id INTO v_message_id;
    
    -- Update conversation's last_message_at
    UPDATE conversations 
    SET 
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    -- Return success with message details
    RETURN json_build_object(
        'success', true,
        'message_id', v_message_id,
        'conversation_id', p_conversation_id,
        'sender_id', v_user_id,
        'content', p_content,
        'message_type', p_message_type,
        'related_car_id', p_related_car_id,
        'reply_to_message_id', p_reply_to_message_id,
        'metadata', p_metadata,
        'created_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to send message: ' || SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_verification_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET verification_status = NEW.overall_status
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_confirmations()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Clean up expired tokens on every insert (with some probability to avoid overhead)
    IF random() < 0.1 THEN -- 10% chance to run cleanup
        PERFORM cleanup_expired_confirmations();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_last_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_location(user_id uuid, lat numeric, lng numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET 
    latitude = lat,
    longitude = lng,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_verification_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- For user_verifications table, update last_updated_at
    IF TG_TABLE_NAME = 'user_verifications' THEN
        NEW.last_updated_at = NOW();
    END IF;
    
    -- For other tables that might have updated_at
    IF TG_TABLE_NAME = 'verification_address' THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_verification_step(user_uuid uuid, new_step public.verification_step)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.user_verifications
    SET 
        current_step = new_step,
        last_updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_owns_verification(verification_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_verifications 
        WHERE id = verification_uuid AND user_id = auth.uid()
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_car_verification_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.verification_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification_status: %. Must be pending, approved, or rejected.', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_step_dependencies(handover_session_id_param uuid, step_order_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  required_steps_completed BOOLEAN;
BEGIN
  -- Check if all previous steps are completed
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO required_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND step_order < step_order_param;
  
  RETURN required_steps_completed;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_audit_chain_integrity()
 RETURNS TABLE(audit_id uuid, log_event_timestamp timestamp with time zone, expected_hash text, actual_hash text, chain_valid boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH audit_chain AS (
        SELECT
            al.id,
            al.event_timestamp AS log_ts,
            al.previous_hash,
            al.current_hash,
            al.event_type,
            al.actor_id,
            al.target_id,
            al.action_details,
            ROW_NUMBER() OVER (ORDER BY al.event_timestamp, al.id) as row_num
        FROM public.audit_logs al
        ORDER BY al.event_timestamp, al.id
    ),
    calculated_hashes AS (
        SELECT
            ac.id,
            ac.log_ts,
            ac.current_hash as actual_hash,
            generate_audit_hash(
                ac.event_type,
                ac.actor_id,
                ac.target_id,
                ac.action_details,
                ac.log_ts,
                LAG(ac.current_hash) OVER (ORDER BY ac.log_ts, ac.id)
            ) as expected_hash
        FROM audit_chain ac
    )
    SELECT
        ch.id AS audit_id,
        ch.log_ts AS log_event_timestamp,
        ch.expected_hash,
        ch.actual_hash,
        (ch.expected_hash = ch.actual_hash) as chain_valid
    FROM calculated_hashes ch
    ORDER BY ch.log_ts;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_no_recursive_policies()
 RETURNS TABLE(table_name text, policy_name text, policy_qual text, policy_with_check text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        pp.schemaname::text || '.' || pp.tablename::text as table_name,
        pp.policyname::text as policy_name,
        pp.qual::text as policy_qual,
        pp.with_check::text as policy_with_check
    FROM pg_policies pp
    WHERE pp.schemaname = 'public' 
    AND pp.tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    ORDER BY pp.tablename, pp.policyname;
END;
$function$
;


  create policy "Admins can view their own activity logs"
  on "public"."admin_activity_logs"
  as permissive
  for select
  to public
using ((admin_id = auth.uid()));







SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "archive";


ALTER SCHEMA "archive" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."audit_event_type" AS ENUM (
    'user_restriction_created',
    'user_restriction_updated',
    'user_restriction_removed',
    'user_deleted',
    'user_password_reset',
    'vehicle_transferred',
    'vehicle_deleted',
    'admin_login',
    'admin_logout',
    'system_config_changed',
    'notification_campaign_created',
    'notification_sent',
    'verification_approved',
    'verification_rejected',
    'booking_cancelled_admin',
    'payment_refunded_admin'
);


ALTER TYPE "public"."audit_event_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_severity" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE "public"."audit_severity" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'expired',
    'in_progress',
    'awaiting_payment'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."document_status" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE "public"."document_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'national_id_front',
    'national_id_back',
    'driving_license_front',
    'driving_license_back',
    'proof_of_address',
    'vehicle_registration',
    'vehicle_ownership',
    'proof_of_income',
    'selfie_photo'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."handover_type" AS ENUM (
    'pickup',
    'return'
);


ALTER TYPE "public"."handover_type" OWNER TO "postgres";


CREATE TYPE "public"."message_delivery_status" AS ENUM (
    'sent',
    'delivered',
    'read'
);


ALTER TYPE "public"."message_delivery_status" OWNER TO "postgres";


CREATE TYPE "public"."message_status" AS ENUM (
    'sent',
    'delivered',
    'read'
);


ALTER TYPE "public"."message_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_campaign_status" AS ENUM (
    'draft',
    'scheduled',
    'sending',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE "public"."notification_campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_role" AS ENUM (
    'host_only',
    'renter_only',
    'system_wide'
);


ALTER TYPE "public"."notification_role" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'booking_request_received',
    'booking_request_sent',
    'booking_confirmed_host',
    'booking_confirmed_renter',
    'booking_cancelled_host',
    'booking_cancelled_renter',
    'pickup_reminder_host',
    'pickup_reminder_renter',
    'return_reminder_host',
    'return_reminder_renter',
    'wallet_topup',
    'wallet_deduction',
    'message_received',
    'handover_ready',
    'payment_received',
    'payment_failed',
    'system_notification',
    'navigation_started',
    'pickup_location_shared',
    'return_location_shared',
    'arrival_notification',
    'early_return_notification',
    'pickup_reminder',
    'return_reminder',
    'claim_submitted',
    'claim_status_updated'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."notification_type" IS 'Notification types including early_return_notification for early return events';



CREATE TYPE "public"."old_notification_type" AS ENUM (
    'booking_cancelled',
    'booking_confirmed',
    'booking_request',
    'message_received',
    'booking_reminder',
    'wallet_topup',
    'wallet_deduction',
    'handover_ready',
    'payment_received',
    'payment_failed',
    'booking_request_sent',
    'pickup_reminder',
    'return_reminder'
);


ALTER TYPE "public"."old_notification_type" OWNER TO "postgres";


CREATE TYPE "public"."restriction_type_enum" AS ENUM (
    'login_block',
    'booking_block',
    'messaging_block',
    'suspension'
);


ALTER TYPE "public"."restriction_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."review_type" AS ENUM (
    'car',
    'renter',
    'host_to_renter',
    'renter_to_host'
);


ALTER TYPE "public"."review_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'host',
    'renter',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_type" AS ENUM (
    'Basic',
    'Standard',
    'Executive',
    '4x4',
    'SUV',
    'Electric',
    'Exotic'
);


ALTER TYPE "public"."vehicle_type" OWNER TO "postgres";


CREATE TYPE "public"."verification_method" AS ENUM (
    'document',
    'utility_bill',
    'bank_statement'
);


ALTER TYPE "public"."verification_method" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'failed',
    'rejected',
    'pending_review'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE TYPE "public"."verification_step" AS ENUM (
    'personal_info',
    'document_upload',
    'selfie_verification',
    'phone_verification',
    'address_confirmation',
    'review_submit',
    'processing_status',
    'completion',
    'ADDRESS_CONFIRMATION'
);


ALTER TYPE "public"."verification_step" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_conversation_creator_as_participant"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only add participant if created_by is not null
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
    VALUES (NEW.id, NEW.created_by, true)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_conversation_creator_as_participant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_handover_step"("p_session_id" "uuid", "p_completed_step_name" "text", "p_user_id" "uuid", "p_user_role" "text", "p_completion_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."advance_handover_step"("p_session_id" "uuid", "p_completed_step_name" "text", "p_user_id" "uuid", "p_user_role" "text", "p_completion_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."analyze_conversation_query_performance"() RETURNS TABLE("query_type" "text", "table_name" "text", "index_usage" "text", "estimated_cost" numeric, "recommendations" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."analyze_conversation_query_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_user_role_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."audit_user_role_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_uid_test"() RETURNS TABLE("current_user_id" "uuid", "is_authenticated" boolean, "session_info" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.uid() IS NOT NULL) as is_authenticated,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'Valid session'
      ELSE 'No session or auth.uid() is null'
    END as session_info;
END;
$$;


ALTER FUNCTION "public"."auth_uid_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_car_rating"("car_uuid" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this car
    SELECT COUNT(*) INTO review_count
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    RETURN avg_rating;
END;
$$;


ALTER FUNCTION "public"."calculate_car_rating"("car_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_category_ratings"("p_car_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  car_categories text[] := ARRAY['cleanliness', 'accuracy', 'communication', 'value'];
BEGIN
  FOREACH category_key IN ARRAY car_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE car_id = p_car_id
      AND review_type = 'car'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_category_ratings"("p_car_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_commission"("booking_total" numeric, "rate" numeric DEFAULT 0.1500) RETURNS numeric
    LANGUAGE "sql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT ROUND(booking_total * rate, 2);
$$;


ALTER FUNCTION "public"."calculate_commission"("booking_total" numeric, "rate" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_handover_progress"("handover_session_id_param" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_handover_progress"("handover_session_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_renter_category_ratings"("p_renter_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  renter_categories text[] := ARRAY['punctuality', 'car_care', 'communication'];
BEGIN
  FOREACH category_key IN ARRAY renter_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE reviewee_id = p_renter_id
      AND review_type = 'host_to_renter'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_renter_category_ratings"("p_renter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_rating"("user_uuid" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this user (both as host and renter)
    SELECT COUNT(*) INTO review_count
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        -- Traditional reviews
        (r.reviewee_id = user_uuid AND r.review_type IN ('host_to_renter', 'renter_to_host'))
        OR
        -- Car reviews where this user is the car owner (host)
        (c.owner_id = user_uuid AND r.review_type = 'car')
    )
    AND r.status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        r.reviewee_id = user_uuid
        OR c.owner_id = user_uuid
    )
    AND r.review_type IN ('car', 'host_to_renter', 'renter_to_host')
    AND r.status = 'published';
    
    RETURN avg_rating;
END;
$$;


ALTER FUNCTION "public"."calculate_user_rating"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_circular_reply"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the reply would create a circular chain
  IF NEW.replying_to_message_id IS NOT NULL THEN
    -- Simple check: prevent direct circular reference (A replies to B which replies to A)
    IF EXISTS (
      SELECT 1 FROM public.messages 
      WHERE id = NEW.replying_to_message_id 
      AND replying_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply detected: message % is already replying to message %', NEW.replying_to_message_id, NEW.id;
    END IF;
    
    -- Additional check: prevent longer circular chains (up to 5 levels deep)
    -- This prevents A->B->C->D->E->A type chains
    IF EXISTS (
      WITH RECURSIVE reply_chain AS (
        -- Start with the message we're replying to
        SELECT id, replying_to_message_id, 1 as depth
        FROM public.messages 
        WHERE id = NEW.replying_to_message_id
        
        UNION ALL
        
        -- Follow the reply chain
        SELECT m.id, m.replying_to_message_id, rc.depth + 1
        FROM public.messages m
        JOIN reply_chain rc ON m.id = rc.replying_to_message_id
        WHERE rc.depth < 5 -- Limit depth to prevent infinite recursion
      )
      SELECT 1 FROM reply_chain 
      WHERE replying_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply chain detected for message %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_circular_reply"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_circular_reply_conversation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the reply would create a circular chain
  IF NEW.reply_to_message_id IS NOT NULL THEN
    -- Simple check: prevent direct circular reference (A replies to B which replies to A)
    IF EXISTS (
      SELECT 1 FROM public.conversation_messages 
      WHERE id = NEW.reply_to_message_id 
      AND reply_to_message_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reply detected: message % is already replying to message % in conversation %', NEW.reply_to_message_id, NEW.id, NEW.conversation_id;
    END IF;
    
    -- Additional check: prevent longer circular chains (up to 5 levels deep)
    -- This prevents A->B->C->D->E->A type chains within the same conversation
    IF EXISTS (
      WITH RECURSIVE reply_chain AS (
        -- Start with the message we're replying to
        SELECT id, reply_to_message_id, conversation_id, 1 as depth
        FROM public.conversation_messages 
        WHERE id = NEW.reply_to_message_id AND conversation_id = NEW.conversation_id
        
        UNION ALL
        
        -- Follow the reply chain within the same conversation
        SELECT cm.id, cm.reply_to_message_id, cm.conversation_id, rc.depth + 1
        FROM public.conversation_messages cm
        JOIN reply_chain rc ON cm.id = rc.reply_to_message_id AND cm.conversation_id = rc.conversation_id
        WHERE rc.depth < 5 -- Limit depth to prevent infinite recursion
      )
      SELECT 1 FROM reply_chain 
      WHERE reply_to_message_id = NEW.id AND conversation_id = NEW.conversation_id
    ) THEN
      RAISE EXCEPTION 'Circular reply chain detected for message % in conversation %', NEW.id, NEW.conversation_id;
    END IF;
    
    -- Check that the message we're replying to exists and is in the same conversation
    IF NOT EXISTS (
      SELECT 1 FROM public.conversation_messages 
      WHERE id = NEW.reply_to_message_id
      AND conversation_id = NEW.conversation_id
    ) THEN
      RAISE EXCEPTION 'Reply to message does not exist or is not in the same conversation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_circular_reply_conversation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") IS 'Fixed: renamed parameters to avoid ambiguity with information_schema columns';



CREATE OR REPLACE FUNCTION "public"."check_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check if user is a participant or creator
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = p_conversation_id AND created_by = p_user_id
    );
END;
$$;


ALTER FUNCTION "public"."check_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_host_wallet_balance"("host_uuid" "uuid", "required_commission" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current wallet balance
  SELECT balance INTO current_balance 
  FROM public.host_wallets 
  WHERE host_id = host_uuid;
  
  -- Return true if balance is sufficient, false otherwise
  RETURN COALESCE(current_balance, 0) >= required_commission;
END;
$$;


ALTER FUNCTION "public"."check_host_wallet_balance"("host_uuid" "uuid", "required_commission" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_verification_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."check_verification_completion"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_verification_completion"() IS 'Automatically completes address verification and updates overall status when all verification steps are completed';



CREATE OR REPLACE FUNCTION "public"."check_verification_completion"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."check_verification_completion"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_expired_locations"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.real_time_locations
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."clean_expired_locations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_admin_sessions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE expires_at < timezone('utc'::text, now()) 
  AND is_active = true;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_admin_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_bypass_sessions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deactivate expired sessions
    UPDATE verification_bypass_sessions
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true AND expires_at < NOW();

    -- Log the deactivation
    INSERT INTO verification_bypass_logs (
        user_id, session_id, action, bypass_reason, created_at
    )
    SELECT user_id, id, 'expired', bypass_reason, NOW()
    FROM verification_bypass_sessions
    WHERE is_active = false AND updated_at = NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_bypass_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_confirmations"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM public.pending_confirmations 
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_confirmations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Delete notifications that have expired
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW();
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_notifications_enhanced"() RETURNS TABLE("total_deleted" integer, "expired_by_timestamp" integer, "expired_by_policy" integer, "cleanup_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_by_timestamp INTEGER := 0;
    deleted_by_policy INTEGER := 0;
    total_deleted_count INTEGER := 0;
    policy_record RECORD;
    cleanup_log JSONB := '{}'::JSONB;
    current_deleted INTEGER;
BEGIN
    -- Step 1: Clean up notifications with explicit expires_at timestamp
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_by_timestamp = ROW_COUNT;
    
    -- Step 2: Clean up notifications based on expiration policies
    FOR policy_record IN 
        SELECT nep.notification_type, nep.default_expiration_hours
        FROM public.notification_expiration_policies nep
        WHERE nep.default_expiration_hours IS NOT NULL 
        AND nep.auto_cleanup_enabled = true
    LOOP
        -- Delete notifications older than the policy expiration time
        DELETE FROM public.notifications 
        WHERE type = policy_record.notification_type
        AND expires_at IS NULL -- Only clean up those without explicit expiration
        AND created_at < (NOW() - INTERVAL '1 hour' * policy_record.default_expiration_hours);
        
        GET DIAGNOSTICS current_deleted = ROW_COUNT;
        deleted_by_policy := deleted_by_policy + current_deleted;
        
        -- Log cleanup details
        cleanup_log := cleanup_log || jsonb_build_object(
            policy_record.notification_type::TEXT, 
            jsonb_build_object(
                'expiration_hours', policy_record.default_expiration_hours,
                'deleted_count', current_deleted
            )
        );
    END LOOP;
    
    total_deleted_count := deleted_by_timestamp + deleted_by_policy;
    
    -- Log cleanup summary
    INSERT INTO public.notification_cleanup_log (deleted_count, cleanup_details, created_at)
    VALUES (total_deleted_count, cleanup_log, NOW());
    
    RETURN QUERY SELECT 
        total_deleted_count,
        deleted_by_timestamp,
        deleted_by_policy,
        cleanup_log;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_notifications_enhanced"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_notifications_enhanced"() IS 'Enhanced cleanup function with policy-based expiration and detailed logging';



CREATE OR REPLACE FUNCTION "public"."cleanup_rate_limits"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;


ALTER FUNCTION "public"."cleanup_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_verification_temp"() RETURNS TABLE("deleted_count" integer, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  files_to_delete TEXT[];
  delete_count INTEGER := 0;
BEGIN
  -- Get list of files older than 24 hours
  SELECT ARRAY_AGG(name) INTO files_to_delete
  FROM storage.objects
  WHERE bucket_id = 'verification-temp'
    AND created_at < now() - interval '24 hours';

  -- If there are files to delete
  IF files_to_delete IS NOT NULL AND array_length(files_to_delete, 1) > 0 THEN
    -- Delete files using storage API
    FOR i IN 1..array_length(files_to_delete, 1) LOOP
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'verification-temp' AND name = files_to_delete[i];
        delete_count := delete_count + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete file %: %', files_to_delete[i], SQLERRM;
      END;
    END LOOP;
  END IF;

  RETURN QUERY SELECT delete_count, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 0, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."cleanup_verification_temp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unread_notifications"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_unread_count INTEGER;
BEGIN
    SELECT 
        COUNT(*)
    INTO 
        v_unread_count
    FROM 
        notifications
    WHERE 
        user_id = (SELECT auth.uid())
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_unread_count;
END;
$$;


ALTER FUNCTION "public"."count_unread_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_content" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    
    -- Handle different notification types
    CASE p_notification_type
        WHEN 'booking_request' THEN
            -- Host notification
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
                VALUES (v_host_id, 'booking_request_received'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter notification
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
                VALUES (v_renter_id, 'booking_request_sent'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_confirmed' THEN
            -- Renter notification
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
                VALUES (v_renter_id, 'booking_confirmed_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Host notification
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
                VALUES (v_host_id, 'booking_confirmed_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
        WHEN 'booking_cancelled' THEN
            -- Host notification
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
                VALUES (v_host_id, 'booking_cancelled_host'::notification_type, v_host_title, v_host_content, p_booking_id, v_booking.car_id, false, 'host_only'::notification_role, '{}'::jsonb);
            END IF;
            
            -- Renter notification
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
                VALUES (v_renter_id, 'booking_cancelled_renter'::notification_type, v_renter_title, v_renter_content, p_booking_id, v_booking.car_id, false, 'renter_only'::notification_role, '{}'::jsonb);
            END IF;
            
        ELSE
            RAISE WARNING 'Unsupported notification type: %', p_notification_type;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_renter_id uuid;
    v_host_id uuid;
    v_car_id uuid;
BEGIN
    -- Retrieve renter, host, and car IDs in a single query
    SELECT 
        b.renter_id, 
        c.owner_id,
        b.car_id
    INTO 
        v_renter_id, 
        v_host_id,
        v_car_id
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    -- Validate both IDs
    IF v_renter_id IS NULL OR v_host_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find renter or host for booking %', p_booking_id;
    END IF;
    
    -- Renter notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read
    ) VALUES (
        v_renter_id,
        p_renter_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false
    );
    
    -- Host notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read
    ) VALUES (
        v_host_id,
        p_host_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Failed to create notifications for booking %: %', p_booking_id, SQLERRM;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_role_target" "public"."notification_role" DEFAULT 'system_wide'::"public"."notification_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_renter_id uuid;
    v_host_id uuid;
    v_car_id uuid;
BEGIN
    -- Log the start of notification creation
    RAISE LOG 'Creating booking notifications for booking ID: %', p_booking_id;

    -- Retrieve renter, host, and car IDs in a single query
    SELECT 
        b.renter_id, 
        c.owner_id,
        b.car_id
    INTO 
        v_renter_id, 
        v_host_id,
        v_car_id
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    -- Validate both IDs
    IF v_renter_id IS NULL OR v_host_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find renter or host for booking %', p_booking_id;
    END IF;
    
    -- Renter notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        v_renter_id,  -- Ensure this matches the notification policy
        p_renter_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );
    
    -- Host notification
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        v_host_id,  -- Ensure this matches the notification policy
        p_host_notification_type,
        p_title,
        p_description,
        p_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );

    -- Log successful notification creation
    RAISE LOG 'Successfully created notifications for booking ID: % (Renter: %, Host: %)', 
        p_booking_id, v_renter_id, v_host_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE LOG 'Failed to create notifications for booking %: %', 
            p_booking_id, SQLERRM;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_check_column_function"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- This function just exists to be called via RPC to create the check_column_exists function
  -- The actual implementation is in the check_column_exists function above
  NULL;
END;
$$;


ALTER FUNCTION "public"."create_check_column_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean) IS 'Creates in-app notification for insurance claim events';



CREATE OR REPLACE FUNCTION "public"."create_conversation_secure"("p_title" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT 'direct'::"text", "p_participant_ids" "uuid"[] DEFAULT '{}'::"uuid"[], "p_created_by_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid;
  v_participant_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID or use provided ID
  v_user_id := COALESCE(p_created_by_id, auth.uid());
  
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: No valid user ID found';
  END IF;
  
  -- Check if direct conversation already exists (for direct messages only)
  IF p_type = 'direct' AND array_length(p_participant_ids, 1) = 1 THEN
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = v_user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_participant_ids[1]
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_participants cp 
      WHERE cp.conversation_id = c.id
    ) = 2;
    
    IF v_conversation_id IS NOT NULL THEN
      RAISE LOG 'create_conversation_secure: Found existing conversation %', v_conversation_id;
      
      -- Return existing conversation with proper structure
      SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'type', c.type,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'exists', true
      ) INTO v_result
      FROM public.conversations c
      WHERE c.id = v_conversation_id;
      
      RETURN v_result;
    END IF;
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations (
    title,
    type,
    created_by
  ) VALUES (
    p_title,
    p_type,
    v_user_id
  ) RETURNING id INTO v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Created conversation % for user %', v_conversation_id, v_user_id;
  
  -- Add creator as participant using INSERT ... ON CONFLICT DO NOTHING
  INSERT INTO public.conversation_participants (
    conversation_id,
    user_id
  ) VALUES (
    v_conversation_id,
    v_user_id
  ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Add other participants
  IF p_participant_ids IS NOT NULL AND array_length(p_participant_ids, 1) > 0 THEN
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
      -- Skip if participant is the creator (already added)
      IF v_participant_id != v_user_id THEN
        INSERT INTO public.conversation_participants (
          conversation_id,
          user_id
        ) VALUES (
          v_conversation_id,
          v_participant_id
        ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE LOG 'create_conversation_secure: Added participant % to conversation %', v_participant_id, v_conversation_id;
      END IF;
    END LOOP;
  END IF;
  
  -- Build and return result
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'type', c.type,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'exists', false
  ) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Successfully created conversation % with result %', v_conversation_id, v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_conversation_secure: Error for user %: % %', v_user_id, SQLSTATE, SQLERRM;
    RAISE;
END;
$$;


ALTER FUNCTION "public"."create_conversation_secure"("p_title" "text", "p_type" "text", "p_participant_ids" "uuid"[], "p_created_by_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_with_participants"("p_created_by" "uuid", "p_participant_ids" "uuid"[], "p_title" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT 'direct'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_conversation_with_participants"("p_created_by" "uuid", "p_participant_ids" "uuid"[], "p_title" "text", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_booking_id" "uuid", "p_handover_type" "text", "p_location" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_car_info TEXT;
BEGIN
    -- Get car information
    SELECT c.brand || ' ' || c.model INTO v_car_info
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF p_handover_type = 'pickup' THEN
        v_title := 'Vehicle Ready for Pickup';
        v_description := 'Your ' || COALESCE(v_car_info, 'vehicle') || ' is ready for pickup';
    ELSE
        v_title := 'Vehicle Return Ready';
        v_description := 'Please return your ' || COALESCE(v_car_info, 'vehicle');
    END IF;
    
    IF p_location IS NOT NULL THEN
        v_description := v_description || ' at ' || p_location;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'handover_ready'::notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create handover notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_booking_id" "uuid", "p_handover_type" "text", "p_location" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_handover_type" "text", "p_car_brand" "text", "p_car_model" "text", "p_location" "text", "p_status" "text" DEFAULT 'ready'::"text", "p_step_name" "text" DEFAULT NULL::"text", "p_progress_percentage" integer DEFAULT 0) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  notification_type notification_type;
  notification_title TEXT;
  notification_description TEXT;
  notification_id BIGINT;
BEGIN
  -- Determine notification type based on status (use only valid enum values)
  CASE p_status
    WHEN 'ready', 'pickup', 'return', 'completed' THEN
      notification_type := 'handover_ready';
    ELSE
      notification_type := 'system_notification';
  END CASE;
  
  -- Create appropriate title and description
  IF p_step_name IS NOT NULL THEN
    notification_title := 'Handover Step Update';
    notification_description := format('Step "%s" for %s %s at %s', 
                                      p_step_name, p_car_brand, p_car_model, p_location);
  ELSIF p_progress_percentage > 0 THEN
    notification_title := 'Handover Progress Update';
    notification_description := format('Handover %s%% complete for %s %s at %s', 
                                      p_progress_percentage, p_car_brand, p_car_model, p_location);
  ELSE
    notification_title := format('Handover %s', initcap(p_status));
    notification_description := format('Your %s handover for %s %s is %s at %s', 
                                      p_handover_type, p_car_brand, p_car_model, p_status, p_location);
  END IF;
  
  -- Insert notification using correct column names and let ID auto-generate
  INSERT INTO public.notifications (
    user_id,
    title,
    description,  -- Use 'description' not 'message'
    type,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    notification_title,
    notification_description,
    notification_type::notification_type,  -- Explicit cast
    jsonb_build_object(
      'handover_type', p_handover_type,
      'car_brand', p_car_brand,
      'car_model', p_car_model,
      'location', p_location,
      'status', p_status,
      'step_name', p_step_name,
      'progress_percentage', p_progress_percentage
    ),
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_handover_type" "text", "p_car_brand" "text", "p_car_model" "text", "p_location" "text", "p_status" "text", "p_step_name" "text", "p_progress_percentage" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") IS 'Fixed: uses b.renter_id instead of non-existent b.user_id';



CREATE OR REPLACE FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") IS 'Fixed: uses b.renter_id instead of non-existent b.user_id';



CREATE OR REPLACE FUNCTION "public"."create_message_notification"("p_recipient_id" "uuid", "p_sender_name" "text", "p_message_preview" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
BEGIN
    v_title := 'New Message';
    v_description := 'You have a new message from ' || p_sender_name;
    
    IF p_message_preview IS NOT NULL THEN
        v_description := v_description || ': ' || LEFT(p_message_preview, 50);
        IF LENGTH(p_message_preview) > 50 THEN
            v_description := v_description || '...';
        END IF;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read,
        role_target
    ) VALUES (
        p_recipient_id,
        'message_received'::notification_type,
        v_title,
        v_description,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create message notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_message_notification"("p_recipient_id" "uuid", "p_sender_name" "text", "p_message_preview" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb") IS 'Creates navigation notifications. Fixed: removed ON CONFLICT clause.';



CREATE OR REPLACE FUNCTION "public"."create_notification_campaign"("p_campaign_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_campaign_id UUID;
  v_user_record RECORD;
  v_notification_id BIGINT;
  v_created_count INTEGER := 0;
  v_total_recipients INTEGER := 0;
  v_send_immediately BOOLEAN;
BEGIN
  v_send_immediately := COALESCE((p_campaign_data->>'send_immediately')::BOOLEAN, false);
  
  -- Create campaign
  INSERT INTO notification_campaigns (
    name, description, status, target_user_roles,
    title, message, action_url, action_text, priority,
    scheduled_for, registration_start, registration_end,
    last_login_days, booking_count_min, metadata, created_by
  ) VALUES (
    p_campaign_data->>'name',
    p_campaign_data->>'description',
    CASE WHEN v_send_immediately THEN 'sending'::notification_campaign_status ELSE 'scheduled'::notification_campaign_status END,
    ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles')),
    p_campaign_data->>'title',
    p_campaign_data->>'message',
    p_campaign_data->>'action_url',
    p_campaign_data->>'action_text',
    COALESCE(p_campaign_data->>'priority', 'medium'),
    (p_campaign_data->>'scheduled_date')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_start')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_end')::TIMESTAMPTZ,
    (p_campaign_data->>'last_login_days')::INTEGER,
    (p_campaign_data->>'booking_count_min')::INTEGER,
    COALESCE(p_campaign_data->'metadata', '{}'::JSONB),
    auth.uid()
  ) RETURNING id INTO v_campaign_id;
  
  -- If sending immediately, create notifications
  IF v_send_immediately THEN
    FOR v_user_record IN
      SELECT DISTINCT p.id
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE 
        (p_campaign_data->'user_roles' IS NULL OR p.role::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles'))))
    LOOP
      v_total_recipients := v_total_recipients + 1;
      
      BEGIN
        INSERT INTO notifications (user_id, type, title, description, metadata)
        VALUES (
          v_user_record.id,
          'system_notification'::notification_type,
          p_campaign_data->>'title',
          p_campaign_data->>'message',
          jsonb_build_object('campaign_id', v_campaign_id)
        ) RETURNING id INTO v_notification_id;
        
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, notification_id, status)
        VALUES (v_campaign_id, v_user_record.id, v_notification_id, 'sent');
        
        v_created_count := v_created_count + 1;
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, status, error_message)
        VALUES (v_campaign_id, v_user_record.id, 'failed', SQLERRM);
      END;
    END LOOP;
    
    UPDATE notification_campaigns
    SET status = 'completed'::notification_campaign_status,
        sent_at = NOW(),
        total_recipients = v_total_recipients,
        successful_sends = v_created_count,
        failed_sends = v_total_recipients - v_created_count
    WHERE id = v_campaign_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', v_campaign_id,
    'notifications_created', v_created_count,
    'total_recipients', v_total_recipients
  );
END;
$$;


ALTER FUNCTION "public"."create_notification_campaign"("p_campaign_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_content" "text" DEFAULT NULL::"text", "p_role_target" "public"."notification_role" DEFAULT 'system_wide'::"public"."notification_role", "p_related_booking_id" "uuid" DEFAULT NULL::"uuid", "p_related_car_id" "uuid" DEFAULT NULL::"uuid", "p_related_user_id" "uuid" DEFAULT NULL::"uuid", "p_priority" integer DEFAULT 1, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_custom_expiration_hours" integer DEFAULT NULL::integer) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_content" "text", "p_role_target" "public"."notification_role", "p_related_booking_id" "uuid", "p_related_car_id" "uuid", "p_related_user_id" "uuid", "p_priority" integer, "p_metadata" "jsonb", "p_custom_expiration_hours" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_content" "text", "p_role_target" "public"."notification_role", "p_related_booking_id" "uuid", "p_related_car_id" "uuid", "p_related_user_id" "uuid", "p_priority" integer, "p_metadata" "jsonb", "p_custom_expiration_hours" integer) IS 'Creates notifications with automatic expiration. Fixed: removed priority and related_user_id references.';



CREATE OR REPLACE FUNCTION "public"."create_payment_notification"("p_user_id" "uuid", "p_payment_type" "text", "p_amount" numeric, "p_booking_id" "uuid" DEFAULT NULL::"uuid", "p_description" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    CASE p_payment_type
        WHEN 'received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' has been received';
            v_notification_type := 'payment_received';
        WHEN 'failed' THEN
            v_title := 'Payment Failed';
            v_description := 'Payment of P' || p_amount::TEXT || ' has failed';
            v_notification_type := 'payment_failed';
        ELSE
            v_title := 'Payment Update';
            v_description := COALESCE(p_description, 'Payment update for P' || p_amount::TEXT);
            v_notification_type := 'payment_received';
    END CASE;
    
    IF p_description IS NOT NULL THEN
        v_description := p_description;
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        related_booking_id,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        v_notification_type,
        v_title,
        v_description,
        p_booking_id,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create payment notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_payment_notification"("p_user_id" "uuid", "p_payment_type" "text", "p_amount" numeric, "p_booking_id" "uuid", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") IS 'Fixed: removed unused p_renter_id parameter';



CREATE OR REPLACE FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_title" "text", "p_description" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        metadata,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        'system_notification'::notification_type,
        p_title,
        p_description,
        p_metadata,
        false,
        'system_wide'::notification_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create system notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_wallet_notification"("p_host_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    -- Generate title and description based on type
    CASE p_type
        WHEN 'topup' THEN
            v_title := 'Wallet Top-up';
            v_description := 'Your wallet has been topped up with P' || p_amount::TEXT;
            v_notification_type := 'wallet_topup';
        WHEN 'deduction' THEN
            v_title := 'Commission Deducted';
            v_description := 'P' || p_amount::TEXT || ' commission deducted from your wallet';
            v_notification_type := 'wallet_deduction';
        WHEN 'payment_received' THEN
            v_title := 'Payment Received';
            v_description := 'Payment of P' || p_amount::TEXT || ' received';
            v_notification_type := 'payment_received';
        ELSE
            v_title := 'Wallet Transaction';
            v_description := COALESCE(p_description, 'Wallet transaction of P' || p_amount::TEXT);
            v_notification_type := 'wallet_deduction';
    END CASE;
    
    -- Create notification without content column
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read
    ) VALUES (
        p_host_id,
        v_notification_type,
        v_title,
        v_description,
        false
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet notification: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_wallet_notification"("p_host_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_wallet_notification"("p_wallet_transaction_id" "uuid", "p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_role_target" "public"."notification_role" DEFAULT 'system_wide'::"public"."notification_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_booking_id uuid;
    v_car_id uuid;
BEGIN
    -- Log the start of wallet notification creation
    RAISE LOG 'Creating wallet notification for transaction ID: %', p_wallet_transaction_id;

    -- Attempt to retrieve associated booking and car details
    SELECT 
        wt.booking_id, 
        b.car_id
    INTO 
        v_booking_id, 
        v_car_id
    FROM wallet_transactions wt
    LEFT JOIN bookings b ON wt.booking_id = b.id
    WHERE wt.id = p_wallet_transaction_id;

    -- Insert wallet notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        description,
        related_booking_id,
        related_car_id,
        metadata,
        is_read,
        role_target
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_description,
        v_booking_id,
        v_car_id,
        p_metadata,
        false,
        p_role_target
    );

    -- Log successful notification creation
    RAISE LOG 'Successfully created wallet notification for transaction ID: % (User: %)', 
        p_wallet_transaction_id, p_user_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE LOG 'Failed to create wallet notification for transaction %: %', 
            p_wallet_transaction_id, SQLERRM;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."create_wallet_notification"("p_wallet_transaction_id" "uuid", "p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_pending_earnings"("p_booking_id" "uuid", "p_host_earnings" numeric, "p_platform_commission" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_host_id UUID;
  v_wallet_id UUID;
  v_balance_before NUMERIC;
BEGIN
  SELECT c.owner_id
  INTO v_host_id
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  SELECT pending_balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  v_balance_before := COALESCE(v_balance_before, 0);

  UPDATE host_wallets
  SET 
    pending_balance = pending_balance + p_host_earnings,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO host_wallets (host_id, balance, pending_balance, currency)
    VALUES (v_host_id, 0, p_host_earnings, 'BWP')
    RETURNING id INTO v_wallet_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    p_host_earnings,
    'rental_earnings_pending',
    'Pending earnings from booking ' || p_booking_id::TEXT || ' (Commission: P' || p_platform_commission::TEXT || ')',
    p_booking_id,
    v_balance_before,
    hw.pending_balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."credit_pending_earnings"("p_booking_id" "uuid", "p_host_earnings" numeric, "p_platform_commission" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_message_content"("p_cipher" "bytea") RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
SELECT pgp_sym_decrypt(p_cipher, public.get_encryption_key())
$$;


ALTER FUNCTION "public"."decrypt_message_content"("p_cipher" "bytea") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_notifications"("p_days_old" integer DEFAULT 30) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deleted_count INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());

    DELETE FROM notifications
    WHERE user_id = v_user_id
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = true;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."delete_old_notifications"("p_days_old" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_message_content"("p_text" "text") RETURNS "bytea"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
SELECT pgp_sym_encrypt(p_text, public.get_encryption_key())
$$;


ALTER FUNCTION "public"."encrypt_message_content"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_step_dependencies"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."enforce_step_dependencies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_conversation_integrity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- When a participant is deleted, check if conversation should be deleted
  IF TG_OP = 'DELETE' THEN
    -- If conversation has less than 2 participants after deletion, delete the conversation
    IF (SELECT COUNT(*) FROM public.conversation_participants WHERE conversation_id = OLD.conversation_id) < 2 THEN
      DELETE FROM public.conversations WHERE id = OLD.conversation_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_conversation_integrity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_insurance_policies"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update policies where end_date < now() AND status is 'active'
  WITH updated AS (
    UPDATE public.insurance_policies
    SET 
      status = 'expired',
      updated_at = now()
    WHERE 
      status = 'active' 
      AND end_date < now()
    RETURNING id
  )
  SELECT count(*) INTO expired_count FROM updated;

  IF expired_count > 0 THEN
    RAISE NOTICE 'Expired % insurance policies', expired_count;
  END IF;
END;
$$;


ALTER FUNCTION "public"."expire_insurance_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_unpaid_bookings"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  r RECORD;
BEGIN
  -- Log start
  RAISE NOTICE 'Running expire_unpaid_bookings...';
  
  FOR r IN 
    SELECT id FROM bookings 
    WHERE status = 'awaiting_payment' 
    AND payment_deadline < NOW()
  LOOP
    RAISE NOTICE 'Expiring booking %', r.id;
    
    UPDATE bookings 
    SET 
      status = 'cancelled', -- or 'expired' if enum supports it
      payment_status = 'expired',
      updated_at = NOW()
    WHERE id = r.id;
    
    -- Optional: Insert notification logic here
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."expire_unpaid_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_audit_hash"("event_type" "public"."audit_event_type", "actor_id" "uuid", "target_id" "uuid", "action_details" "jsonb", "event_timestamp" timestamp with time zone, "previous_hash" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_audit_hash"("event_type" "public"."audit_event_type", "actor_id" "uuid", "target_id" "uuid", "action_details" "jsonb", "event_timestamp" timestamp with time zone, "previous_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_claim_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_claims) + 1;
  new_number := 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$;


ALTER FUNCTION "public"."generate_claim_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_policy_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_policies) + 1;
  new_number := 'INS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$;


ALTER FUNCTION "public"."generate_policy_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users"() RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "phone_number" "text", "role" "public"."user_role", "created_at" timestamp with time zone, "avatar_url" "text", "verification_status" "public"."verification_status")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_admin_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_users"() IS 'Returns admin user data including email from auth.users. Used by admin user management module.';



CREATE OR REPLACE FUNCTION "public"."get_admin_users_complete"() RETURNS TABLE("id" "uuid", "full_name" "text", "email" "text", "role" "text", "avatar_url" "text", "phone_number" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "verification_status" "text", "is_active" boolean, "user_roles" "text"[], "is_restricted" boolean, "active_restrictions" "jsonb", "vehicles_count" bigint, "bookings_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.full_name,
    au.email::TEXT,
    pr.role::TEXT,
    pr.avatar_url,
    pr.phone_number,
    pr.created_at,
    pr.updated_at,
    pr.verification_status::TEXT,
    TRUE AS is_active,
    COALESCE(
      (SELECT array_agg(ur.role::TEXT) FROM public.user_roles ur WHERE ur.user_id = pr.id),
      ARRAY[]::TEXT[]
    ) AS user_roles,
    EXISTS (
      SELECT 1 FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.active = true
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())
    ) AS is_restricted,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', urs.id,
        'restriction_type', urs.restriction_type,
        'reason', urs.reason,
        'starts_at', urs.starts_at,
        'ends_at', urs.ends_at
      )) FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.active = true
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())),
      '[]'::JSONB
    ) AS active_restrictions,
    (SELECT COUNT(*) FROM public.cars c WHERE c.owner_id = pr.id) AS vehicles_count,
    (SELECT COUNT(*) FROM public.bookings b WHERE b.renter_id = pr.id) AS bookings_count
  FROM public.profiles pr
  LEFT JOIN auth.users au ON au.id = pr.id
  ORDER BY pr.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_users_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bypass_statistics"("p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("total_sessions" bigint, "active_sessions" bigint, "expired_sessions" bigint, "most_common_reason" "text", "unique_users" bigint, "avg_session_duration" interval)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
        COUNT(*) FILTER (WHERE is_active = false) as expired_sessions,
        mode() WITHIN GROUP (ORDER BY bypass_reason) as most_common_reason,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(expires_at - created_at) as avg_session_duration
    FROM verification_bypass_sessions
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;


ALTER FUNCTION "public"."get_bypass_statistics"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campaign_analytics"("p_campaign_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_stats RECORD;
  v_result JSONB;
BEGIN
  SELECT 
    COUNT(*) as total_recipients,
    COUNT(*) FILTER (WHERE status = 'sent') as sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'opened') as opened,
    COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending
  INTO v_stats
  FROM campaign_delivery_logs
  WHERE campaign_id = p_campaign_id;
  
  v_result := jsonb_build_object(
    'total_recipients', COALESCE(v_stats.total_recipients, 0),
    'sent', COALESCE(v_stats.sent, 0),
    'delivered', COALESCE(v_stats.delivered, 0),
    'opened', COALESCE(v_stats.opened, 0),
    'clicked', COALESCE(v_stats.clicked, 0),
    'failed', COALESCE(v_stats.failed, 0),
    'pending', COALESCE(v_stats.pending, 0),
    'delivery_rate', CASE WHEN v_stats.total_recipients > 0 THEN ROUND((v_stats.delivered::NUMERIC / v_stats.total_recipients) * 100, 2) ELSE 0 END,
    'open_rate', CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.opened::NUMERIC / v_stats.delivered) * 100, 2) ELSE 0 END,
    'click_rate', CASE WHEN v_stats.opened > 0 THEN ROUND((v_stats.clicked::NUMERIC / v_stats.opened) * 100, 2) ELSE 0 END
  );
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_campaign_analytics"("p_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("id" "uuid", "content" "text", "sender_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- First check if user has access to this conversation
    IF NOT public.check_conversation_access(p_conversation_id, p_user_id) THEN
        RAISE EXCEPTION 'Access denied to conversation';
    END IF;
    
    RETURN QUERY
    SELECT 
        cm.id,
        cm.content,
        cm.sender_id,
        cm.created_at,
        cm.updated_at
    FROM public.conversation_messages cm
    WHERE cm.conversation_id = p_conversation_id
    ORDER BY cm.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_encryption_key"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  k text;
BEGIN
  k := current_setting('app.encryption_key', true);
  IF k IS NULL OR k = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key.';
  END IF;
  RETURN k;
END;
$$;


ALTER FUNCTION "public"."get_encryption_key"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_marketing_recipients"() RETURNS TABLE("id" "uuid", "email" character varying, "full_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Default to all users for now (ignoring marketing_notifications preference for broad reach)
  -- Or we can change the logic to WHERE p.marketing_notifications IS NOT FALSE (if we want to allow opt-out but default to true)
  -- User requested: "by default all users should recieve the notification"
  
  RETURN QUERY
  SELECT 
    p.id,
    au.email::varchar,
    p.full_name
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id;
  -- Removed: WHERE p.marketing_notifications = true;
END;
$$;


ALTER FUNCTION "public"."get_marketing_recipients"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notification_expiration_info"("p_notification_type" "public"."notification_type") RETURNS TABLE("notification_type" "public"."notification_type", "default_expiration_hours" integer, "auto_cleanup_enabled" boolean, "estimated_expiration" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nep.notification_type,
        nep.default_expiration_hours,
        nep.auto_cleanup_enabled,
        CASE 
            WHEN nep.default_expiration_hours IS NOT NULL THEN
                NOW() + INTERVAL '1 hour' * nep.default_expiration_hours
            ELSE NULL
        END as estimated_expiration
    FROM public.notification_expiration_policies nep
    WHERE nep.notification_type = p_notification_type;
END;
$$;


ALTER FUNCTION "public"."get_notification_expiration_info"("p_notification_type" "public"."notification_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_profile"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "full_name" "text", "avatar_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_uuid
    AND p.id IS NOT NULL; -- Explicit null check
$$;


ALTER FUNCTION "public"."get_public_profile"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_public_profile"("user_uuid" "uuid") IS 'Returns public profile information (name and avatar) for display in car listings and public contexts. Uses SECURITY DEFINER to bypass RLS while maintaining controlled access to only public fields.';



CREATE OR REPLACE FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer DEFAULT 10) RETURNS TABLE("message_id" "uuid", "conversation_id" "uuid", "sender_id" "uuid", "content" "text", "reply_to_message_id" "uuid", "depth" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reply_chain AS (
    -- Base case: the original message
    SELECT 
      cm.id as message_id,
      cm.conversation_id,
      cm.sender_id,
      cm.content,
      cm.reply_to_message_id,
      0 as depth,
      cm.created_at
    FROM public.conversation_messages cm
    WHERE cm.id = p_message_id
    
    UNION ALL
    
    -- Recursive case: messages that reply to the current message
    SELECT 
      cm.id as message_id,
      cm.conversation_id,
      cm.sender_id,
      cm.content,
      cm.reply_to_message_id,
      rc.depth + 1,
      cm.created_at
    FROM public.conversation_messages cm
    INNER JOIN reply_chain rc ON cm.reply_to_message_id = rc.message_id
    WHERE rc.depth < p_max_depth
  )
  SELECT * FROM reply_chain
  ORDER BY depth, created_at;
END;
$$;


ALTER FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer) IS 'Get the complete reply chain for a message, including the original and all replies';



CREATE OR REPLACE FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) RETURNS TABLE("message_id" "uuid", "reply_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    COUNT(r.id) as reply_count
  FROM unnest(message_ids) AS m(id)
  LEFT JOIN public.conversation_messages r ON r.reply_to_message_id = m.id
  WHERE r.conversation_id = conversation_id_param OR r.conversation_id IS NULL
  GROUP BY m.id;
END;
$$;


ALTER FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) IS 'Get reply counts for multiple messages in a conversation';



CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("conversation_id" "uuid", "title" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "is_participant" boolean, "is_creator" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        (cp.user_id IS NOT NULL) as is_participant,
        (c.created_by = p_user_id) as is_creator
    FROM public.conversations c
    LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = p_user_id
    WHERE c.created_by = p_user_id OR cp.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_search_term" "text" DEFAULT NULL::"text") RETURNS TABLE("conv_id" "uuid", "title" "text", "conv_type" character varying, "last_message_at" timestamp with time zone, "participants" json, "last_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_conversations"("p_page" integer, "p_page_size" integer, "p_search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_email_for_notification"("user_uuid" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_email text;
BEGIN
    -- Get user email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$$;


ALTER FUNCTION "public"."get_user_email_for_notification"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_notifications"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_only_unread" boolean DEFAULT false) RETURNS TABLE("id" bigint, "type" "public"."notification_type", "role_target" "public"."notification_role", "title" "text", "description" "text", "is_read" boolean, "created_at" timestamp with time zone, "expires_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE 
    v_offset INT;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    v_offset := (p_page - 1) * p_page_size;

    RETURN QUERY 
    SELECT 
        n.id, 
        n.type, 
        n.role_target,
        n.title, 
        n.description, 
        n.is_read, 
        n.created_at, 
        n.expires_at,
        n.metadata
    FROM 
        notifications n
    WHERE 
        n.user_id = v_user_id 
        AND (p_only_unread = false OR n.is_read = false)
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY 
        n.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_notifications"("p_page" integer, "p_page_size" integer, "p_only_unread" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_push_subscriptions"("user_id" "uuid") RETURNS TABLE("id" "uuid", "endpoint" "text", "p256dh" "text", "auth" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = get_user_push_subscriptions.user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_push_subscriptions"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") IS 'Fixed: explicit jsonb type cast for result variable';



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
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_booking_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_handover_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_handover_completion"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_handover_completion"() IS 'Trigger function that handles booking completion when return handover sessions are completed. Updates booking status, early_return flag, actual_end_date, and sends notifications.';



CREATE OR REPLACE FUNCTION "public"."handle_handover_step_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_handover_step_completion"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_handover_step_completion"() IS 'Trigger function to handle handover step completion notifications';



CREATE OR REPLACE FUNCTION "public"."handle_new_message_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    sender_name TEXT;
    participant_ids UUID[];
    participant_id UUID;
    message_preview TEXT;
BEGIN
    -- Get sender name from profiles table, fallback to auth.users email if full_name is null
    SELECT COALESCE(p.full_name, au.email, 'Unknown User') INTO sender_name
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE au.id = NEW.sender_id;

    -- Get message preview (first 100 characters)
    message_preview := LEFT(NEW.content, 100);

    -- Get all participant IDs for this conversation (excluding sender)
    SELECT array_agg(cp.user_id) INTO participant_ids
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;

    -- Create notifications for each participant ONLY if there are participants
    IF participant_ids IS NOT NULL THEN
        FOREACH participant_id IN ARRAY participant_ids
        LOOP
            -- Create database notification
            INSERT INTO notifications (
                user_id,
                type,
                title,
                description,
                metadata,
                role_target,
                is_read
            ) VALUES (
                participant_id,
                'message_received'::notification_type,
                'New Message',
                COALESCE(sender_name, 'Someone') || ' sent you a message: ' || message_preview,
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'sender_name', COALESCE(sender_name, 'Unknown')
                ),
                NULL, -- Use NULL for user-specific notifications (was 'user' which is invalid enum)
                false
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_message_notification"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_message_notification"() IS 'Creates database notifications for new messages. Push notifications are handled at application layer to avoid cross-database reference errors.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger function that creates a profile record when a new user is created in auth.users. Properly extracts full_name and phone_number from raw_user_meta_data.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"("user_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_user_id uuid;
  user_email text;
  user_metadata jsonb;
  result json;
BEGIN
  -- If no user_id provided, this might be called as a trigger
  IF user_id IS NULL THEN
    -- This would be NEW.id in a trigger context, but we can't access that here
    RAISE EXCEPTION 'user_id parameter is required when calling this function directly';
  END IF;
  
  target_user_id := user_id;
  
  -- Get user details from auth.users (if accessible)
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- If we can't access auth.users, use provided data
  IF user_email IS NULL THEN
    user_email := 'unknown@example.com';
    user_metadata := '{}'::jsonb;
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    role,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    'renter',
    '+267 ' || LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  -- Log welcome email to email_delivery_logs
  INSERT INTO public.email_delivery_logs (
    message_id,
    recipient_email,
    sender_email,
    subject,
    provider,
    status,
    metadata,
    sent_at
  )
  VALUES (
    'welcome_' || target_user_id::text,
    user_email,
    'noreply@mobirides.com',
    'Welcome to MobiRides!',
    'resend',
    'sent',
    jsonb_build_object('user_id', target_user_id, 'email_type', 'welcome_email'),
    NOW()
  );
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', 'Profile created and welcome email logged successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'user_id', target_user_id,
      'error', SQLERRM,
      'message', 'Error processing new user'
    );
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"("user_id" "uuid") IS 'Function that creates a profile and logs welcome email for a given user ID';



CREATE OR REPLACE FUNCTION "public"."handle_user_restrictions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_restrictions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_bypass_session"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM verification_bypass_sessions 
        WHERE user_id = p_user_id 
        AND is_active = true 
        AND expires_at > NOW()
    );
END;
$$;


ALTER FUNCTION "public"."has_active_bypass_session"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_car_view_count"("car_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.cars 
  SET view_count = view_count + 1 
  WHERE id = car_id;
END;
$$;


ALTER FUNCTION "public"."increment_car_view_count"("car_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_promo_code_uses"("promo_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.promo_codes 
  SET current_uses = current_uses + 1 
  WHERE id = promo_id;
END;
$$;


ALTER FUNCTION "public"."increment_promo_code_uses"("promo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_conversation"("p_title" "text", "p_type" character varying, "p_participant_ids" "uuid"[]) RETURNS TABLE("conversation_id" "uuid", "participant_ids" "uuid"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."initialize_conversation"("p_title" "text", "p_type" character varying, "p_participant_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role::text IN ('admin', 'super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_admin"("_conversation_id" "uuid", "_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
      AND cp.is_admin = true
  );
$$;


ALTER FUNCTION "public"."is_conversation_admin"("_conversation_id" "uuid", "_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_creator"("_conversation_id" "uuid", "_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND c.created_by = _user_id
  );
$$;


ALTER FUNCTION "public"."is_conversation_creator"("_conversation_id" "uuid", "_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid", "_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  );
$$;


ALTER FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid", "_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_participant_secure"("conversation_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_conversation_participant_secure"("conversation_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_participant"("p_conversation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  -- Direct check on the table.
  -- Since this is SECURITY DEFINER, it bypasses RLS on conversation_participants.
  -- This prevents the recursion loop when called from an RLS policy.
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_participant"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_profile_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')  );
$$;


ALTER FUNCTION "public"."is_profile_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check admins table only for super admin
  IF EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin_from_admins"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid() AND a.is_super_admin = true
  );
$$;


ALTER FUNCTION "public"."is_super_admin_from_admins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text" DEFAULT NULL::"text", "p_resource_id" "text" DEFAULT NULL::"text", "p_details" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_details" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_details" "jsonb") IS 'RPC function to log admin activities. Fixed: properly casts resource_id to UUID.';



CREATE OR REPLACE FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text" DEFAULT NULL::"text", "p_resource_id" "uuid" DEFAULT NULL::"uuid", "p_details" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_admin_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;


ALTER FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only log if admin_activity_logs table exists
  -- This allows the admins table to be created before admin_activity_logs
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_activity_logs'
  ) THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (NEW.id, 'admin_created', jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin));
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (NEW.id, 'admin_updated', jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin));
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.admin_activity_logs (admin_id, action, details)
      VALUES (OLD.id, 'admin_deleted', jsonb_build_object('email', OLD.email));
    END IF;
  END IF;
  
  -- Always return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."log_admin_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_admin_changes"() IS 'Defensive trigger function that checks for admin_activity_logs table existence before logging. This prevents migration order dependency issues.';



CREATE OR REPLACE FUNCTION "public"."log_audit_event"("p_event_type" "public"."audit_event_type", "p_severity" "public"."audit_severity" DEFAULT 'medium'::"public"."audit_severity", "p_actor_id" "uuid" DEFAULT "auth"."uid"(), "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_session_id" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_location_data" "jsonb" DEFAULT NULL::"jsonb", "p_action_details" "jsonb" DEFAULT '{}'::"jsonb", "p_resource_type" "text" DEFAULT NULL::"text", "p_resource_id" "uuid" DEFAULT NULL::"uuid", "p_reason" "text" DEFAULT NULL::"text", "p_anomaly_flags" "jsonb" DEFAULT NULL::"jsonb", "p_compliance_tags" "text"[] DEFAULT NULL::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."log_audit_event"("p_event_type" "public"."audit_event_type", "p_severity" "public"."audit_severity", "p_actor_id" "uuid", "p_target_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_location_data" "jsonb", "p_action_details" "jsonb", "p_resource_type" "text", "p_resource_id" "uuid", "p_reason" "text", "p_anomaly_flags" "jsonb", "p_compliance_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_bypass_session_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO verification_bypass_logs (
        user_id, session_id, action, bypass_reason, client_ip, user_agent, created_at
    ) VALUES (
        NEW.user_id, NEW.id, 'created', NEW.bypass_reason, NEW.client_ip, NEW.user_agent, NOW()
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_bypass_session_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_bypass_session_deactivation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF OLD.is_active = true AND NEW.is_active = false THEN
        INSERT INTO verification_bypass_logs (
            user_id, session_id, action, bypass_reason, created_at
        ) VALUES (
            NEW.user_id, NEW.id, 'deactivated', NEW.bypass_reason, NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_bypass_session_deactivation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_bypass_session_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- This will be called when a bypass session is used for verification
    -- Can be triggered by application code
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_bypass_session_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_notification_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Log notification creation for debugging
    RAISE LOG 'Notification created: user_id=%, type=%, booking_id=%, content=%', 
        NEW.user_id, NEW.type, NEW.related_booking_id, LEFT(NEW.content, 50);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_notification_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notifications_read"("p_notification_ids" bigint[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_updated_count INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());

    UPDATE notifications
    SET is_read = true
    WHERE id = ANY(p_notification_ids)
    AND user_id = v_user_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_notifications_read"("p_notification_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_audit_log_modification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Allow inserts only
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Prevent updates and deletes
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$;


ALTER FUNCTION "public"."prevent_audit_log_modification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_due_earnings_releases"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Running process_due_earnings_releases...';
  
  FOR r IN
    SELECT b.id 
    FROM bookings b
    WHERE b.status = 'completed'
    AND b.actual_end_date < (NOW() - INTERVAL '24 hours') -- 24h buffer
    AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions wt 
      WHERE wt.booking_id = b.id AND wt.transaction_type = 'earnings_released'
    )
  LOOP
    BEGIN
      RAISE NOTICE 'Releasing earnings for booking %', r.id;
      PERFORM release_pending_earnings(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to release earnings for booking %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."process_due_earnings_releases"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_withdrawal_request"("p_host_id" "uuid", "p_amount" numeric, "p_payout_method" character varying, "p_payout_details" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_wallet_id UUID;
  v_available_balance NUMERIC;
  v_withdrawal_id UUID;
  v_min_withdrawal NUMERIC;
  v_balance_before NUMERIC;
BEGIN
  -- FIX: Correctly extract numeric value from JSONB (remove quotes)
  SELECT (value #>> '{}')::NUMERIC INTO v_min_withdrawal
  FROM payment_config WHERE key = 'minimum_withdrawal';
  
  v_min_withdrawal := COALESCE(v_min_withdrawal, 200);
  
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal is P%', v_min_withdrawal;
  END IF;
  
  SELECT id, balance
  INTO v_wallet_id, v_available_balance
  FROM host_wallets
  WHERE host_id = p_host_id
  FOR UPDATE;
  
  v_balance_before := v_available_balance;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: P%', v_available_balance;
  END IF;
  
  UPDATE host_wallets
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  INSERT INTO withdrawal_requests (
    host_id,
    wallet_id,
    amount,
    payout_method,
    payout_details,
    status
  )
  VALUES (
    p_host_id,
    v_wallet_id,
    p_amount,
    p_payout_method,
    p_payout_details,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after,
    metadata
  )
  SELECT 
    v_wallet_id,
    -p_amount,
    'withdrawal',
    'Withdrawal request ' || v_withdrawal_id::TEXT,
    v_balance_before,
    hw.balance,
    jsonb_build_object('withdrawal_request_id', v_withdrawal_id)
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN v_withdrawal_id;
END;
$$;


ALTER FUNCTION "public"."process_withdrawal_request"("p_host_id" "uuid", "p_amount" numeric, "p_payout_method" character varying, "p_payout_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_pending_earnings"("p_booking_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_host_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
  v_booking_status TEXT;
  v_balance_before NUMERIC;
BEGIN
  SELECT 
    c.owner_id,
    pt.host_earnings,
    b.status
  INTO v_host_id, v_amount, v_booking_status
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  LEFT JOIN payment_transactions pt ON b.payment_transaction_id = pt.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  IF v_booking_status != 'completed' THEN
    RAISE EXCEPTION 'Booking must be completed to release earnings';
  END IF;
  
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'No earnings to release for booking: %', p_booking_id;
  END IF;
  
  SELECT balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  
  UPDATE host_wallets
  SET 
    pending_balance = pending_balance - v_amount,
    balance = balance + v_amount,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for host: %', v_host_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    v_amount,
    'earnings_released',
    'Earnings released for booking ' || p_booking_id::TEXT,
    p_booking_id,
    v_balance_before,
    hw.balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."release_pending_earnings"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_admin_complete"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can remove administrators.';
  END IF;

  -- Determine new role for the user (host if they have cars, otherwise renter)
  IF EXISTS (SELECT 1 FROM cars WHERE owner_id = target_user_id) THEN
    v_new_role := 'host';
  ELSE
    v_new_role := 'renter';
  END IF;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_role
  WHERE id = target_user_id;

  -- Remove from admins table
  DELETE FROM admins
  WHERE id = target_user_id;
  
  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'remove_admin',
    'admin',
    target_user_id::text,
    jsonb_build_object('removed_admin_id', target_user_id, 'new_role', v_new_role)
  );
END;
$$;


ALTER FUNCTION "public"."remove_admin_complete"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_message_operation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- For star operations, update the messages table
  IF OLD.operation_type = 'star' THEN
    UPDATE messages 
    SET starred = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  -- For pin operations, update the messages table
  IF OLD.operation_type = 'pin' THEN
    UPDATE messages 
    SET pinned = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  -- For select operations, update the messages table
  IF OLD.operation_type = 'select' THEN
    UPDATE messages 
    SET selected = FALSE 
    WHERE id = OLD.message_id;
  END IF;
  
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."remove_message_operation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_push_subscription"("p_user_id" "uuid", "p_endpoint" "text", "p_p256dh_key" "text", "p_auth_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."save_push_subscription"("p_user_id" "uuid", "p_endpoint" "text", "p_p256dh_key" "text", "p_auth_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text" DEFAULT 'text'::"text", "p_related_car_id" "uuid" DEFAULT NULL::"uuid", "p_reply_to_message_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text", "p_related_car_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text", "p_related_car_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") IS 'Fixed: removed unused v_result variable';



CREATE OR REPLACE FUNCTION "public"."sync_message_operation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- For star operations, update the messages table
  IF NEW.operation_type = 'star' THEN
    UPDATE messages 
    SET starred = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  -- For pin operations, update the messages table
  IF NEW.operation_type = 'pin' THEN
    UPDATE messages 
    SET pinned = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  -- For select operations, update the messages table
  IF NEW.operation_type = 'select' THEN
    UPDATE messages 
    SET selected = TRUE 
    WHERE id = NEW.message_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_message_operation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_verification_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = NEW.overall_status
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_verification_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_message_reaction"("p_message_id" "uuid", "p_emoji" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_conversation_id UUID;
  v_metadata JSONB;
  v_reactions JSONB;
  v_new_reactions JSONB;
BEGIN
  -- Require authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING HINT = 'User must be signed in';
  END IF;

  -- Load message row
  SELECT conversation_id, metadata
    INTO v_conversation_id, v_metadata
  FROM public.conversation_messages
  WHERE id = p_message_id;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'message_not_found' USING HINT = 'Invalid message id';
  END IF;

  -- Ensure user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = v_conversation_id
      AND cp.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not_a_participant' USING HINT = 'User must be a participant to react';
  END IF;

  -- Current reactions array
  v_reactions := COALESCE(v_metadata->'reactions', '[]'::JSONB);

  -- Toggle: remove if exists, else add
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_reactions) AS r
    WHERE r->>'emoji' = p_emoji AND r->>'userId' = v_user_id::TEXT
  ) THEN
    v_new_reactions := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM jsonb_array_elements(v_reactions) AS elem
      WHERE NOT (elem->>'emoji' = p_emoji AND elem->>'userId' = v_user_id::TEXT)
    );
  ELSE
    v_new_reactions := v_reactions || jsonb_build_array(
      jsonb_build_object(
        'emoji', p_emoji,
        'userId', v_user_id::TEXT,
        'timestamp', NOW()
      )
    );
  END IF;

  -- Persist metadata with merged reactions
  UPDATE public.conversation_messages
  SET metadata = COALESCE(v_metadata, '{}'::JSONB) || jsonb_build_object('reactions', v_new_reactions)
  WHERE id = p_message_id;

  -- Return updated reactions
  RETURN (
    SELECT metadata->'reactions'
    FROM public.conversation_messages
    WHERE id = p_message_id
  );
END;
$$;


ALTER FUNCTION "public"."toggle_message_reaction"("p_message_id" "uuid", "p_emoji" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_cleanup_expired_confirmations"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Clean up expired tokens on every insert (with some probability to avoid overhead)
    IF random() < 0.1 THEN -- 10% chance to run cleanup
        PERFORM cleanup_expired_confirmations();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_cleanup_expired_confirmations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_role"("target_user_id" "uuid", "new_is_super_admin" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_profile_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can update administrator roles.';
  END IF;

  -- Determine new profile role
  IF new_is_super_admin THEN
    v_new_profile_role := 'super_admin';
  ELSE
    v_new_profile_role := 'admin';
  END IF;

  -- Update admins table
  UPDATE admins
  SET is_super_admin = new_is_super_admin
  WHERE id = target_user_id;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_profile_role
  WHERE id = target_user_id;

  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'update_admin_role',
    'admin',
    target_user_id::text,
    jsonb_build_object('updated_admin_id', target_user_id, 'new_is_super_admin', new_is_super_admin)
  );
END;
$$;


ALTER FUNCTION "public"."update_admin_role"("target_user_id" "uuid", "new_is_super_admin" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_campaign_delivery_logs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_campaign_delivery_logs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_handover_session_on_step_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  all_steps_completed BOOLEAN;
BEGIN
  -- Check if all steps are completed for this handover session
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO all_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = NEW.handover_session_id;
  
  -- Update handover session completion status if all steps are done
  IF all_steps_completed THEN
    UPDATE handover_sessions
    SET 
      handover_completed = TRUE,
      updated_at = NOW()
    WHERE id = NEW.handover_session_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_handover_session_on_step_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_insurance_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_insurance_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_message_delivery_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Auto-set delivered_at when status changes to 'delivered'
  IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = timezone('utc'::text, now());
  END IF;
  
  -- Auto-set read_at when status changes to 'read'
  IF NEW.delivery_status = 'read' AND OLD.delivery_status != 'read' AND NEW.read_at IS NULL THEN
    NEW.read_at = timezone('utc'::text, now());
    -- Also ensure delivered_at is set when marking as read
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at = timezone('utc'::text, now());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_message_delivery_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_message_operations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_message_operations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_expiration_policy"("p_notification_type" "public"."notification_type", "p_expiration_hours" integer DEFAULT NULL::integer, "p_auto_cleanup_enabled" boolean DEFAULT true) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.notification_expiration_policies (
        notification_type, default_expiration_hours, auto_cleanup_enabled, updated_at
    ) VALUES (
        p_notification_type, p_expiration_hours, p_auto_cleanup_enabled, NOW()
    )
    ON CONFLICT (notification_type) DO UPDATE SET
        default_expiration_hours = EXCLUDED.default_expiration_hours,
        auto_cleanup_enabled = EXCLUDED.auto_cleanup_enabled,
        updated_at = NOW();
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_notification_expiration_policy"("p_notification_type" "public"."notification_type", "p_expiration_hours" integer, "p_auto_cleanup_enabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_location"("user_id" "uuid", "lat" numeric, "lng" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE profiles
  SET 
    latitude = lat,
    longitude = lng,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_user_location"("user_id" "uuid", "lat" numeric, "lng" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_public_keys_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_public_keys_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_verification_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_verification_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_verification_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."update_verification_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_verification_step"("user_uuid" "uuid", "new_step" "public"."verification_step") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.user_verifications
    SET 
        current_step = new_step,
        last_updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_verification_step"("user_uuid" "uuid", "new_step" "public"."verification_step") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_verifications 
        WHERE id = verification_uuid AND user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") IS 'Security function to check if authenticated user owns a verification record';



CREATE OR REPLACE FUNCTION "public"."validate_admin_session"("p_session_token" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  session_record RECORD;
BEGIN
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token
  AND is_active = true
  AND expires_at > timezone('utc'::text, now());
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update last activity
  UPDATE public.admin_sessions
  SET last_activity = timezone('utc'::text, now())
  WHERE session_token = p_session_token;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."validate_admin_session"("p_session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_campaign_audience"("p_user_roles" "text"[] DEFAULT NULL::"text"[], "p_registration_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_registration_end" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_last_login_days" integer DEFAULT NULL::integer, "p_booking_count_min" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Count matching users
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN bookings b ON p.id = b.renter_id
  WHERE 
    (p_user_roles IS NULL OR p.role::TEXT = ANY(p_user_roles))
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_last_login_days IS NULL OR u.last_sign_in_at >= NOW() - (p_last_login_days || ' days')::INTERVAL)
    AND (p_booking_count_min IS NULL OR (
      SELECT COUNT(*) FROM bookings WHERE renter_id = p.id
    ) >= p_booking_count_min);
  
  v_result := jsonb_build_object(
    'is_valid', v_count > 0,
    'estimated_recipients', v_count,
    'warnings', CASE WHEN v_count = 0 THEN ARRAY['No users match the criteria']::TEXT[] ELSE ARRAY[]::TEXT[] END
  );
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."validate_campaign_audience"("p_user_roles" "text"[], "p_registration_start" timestamp with time zone, "p_registration_end" timestamp with time zone, "p_last_login_days" integer, "p_booking_count_min" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_car_verification_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.verification_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification_status: %. Must be pending, approved, or rejected.', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_car_verification_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_participant boolean;
  v_is_creator boolean;
BEGIN
  -- Validate authentication
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'error', 'authentication_required'
    );
  END IF;
  
  -- Check participant status
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) INTO v_is_participant;
  
  -- Check creator status
  SELECT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = p_conversation_id AND created_by = p_user_id
  ) INTO v_is_creator;
  
  RETURN jsonb_build_object(
    'has_access', (v_is_participant OR v_is_creator),
    'is_participant', v_is_participant,
    'is_creator', v_is_creator
  );
END;
$$;


ALTER FUNCTION "public"."validate_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_conversation_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Ensure direct conversations don't have duplicate participants
  IF NEW.type = 'direct' THEN
    -- Check if a direct conversation already exists between these users
    IF EXISTS (
      SELECT 1 FROM public.conversations c1
      JOIN public.conversation_participants cp1 ON c1.id = cp1.conversation_id
      JOIN public.conversation_participants cp2 ON c1.id = cp2.conversation_id
      WHERE c1.type = 'direct' 
      AND c1.id != NEW.id
      AND cp1.user_id = NEW.created_by
      AND cp2.user_id != NEW.created_by
      AND cp2.user_id IN (
        SELECT user_id FROM public.conversation_participants 
        WHERE conversation_id = NEW.id AND user_id != NEW.created_by
      )
    ) THEN
      RAISE EXCEPTION 'Direct conversation already exists between these users';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_conversation_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) IS 'Fixed: removed unused step_name_param parameter';



CREATE OR REPLACE FUNCTION "public"."verify_audit_chain_integrity"() RETURNS TABLE("audit_id" "uuid", "log_event_timestamp" timestamp with time zone, "expected_hash" "text", "actual_hash" "text", "chain_valid" boolean)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."verify_audit_chain_integrity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_conversation_policies"() RETURNS TABLE("test_name" "text", "status" "text", "details" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Test 1: Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS_ENABLED'::text,
        CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END::text,
        'Row Level Security status for conversations'::text
    FROM pg_class 
    WHERE relname = 'conversations' AND relnamespace = 'public'::regnamespace;
    
    -- Test 2: Count policies
    RETURN QUERY
    SELECT 
        'POLICY_COUNT'::text,
        CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END::text,
        'Number of policies on conversations: ' || COUNT(*)::text
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'conversations';
    
    -- Test 3: Check for recursion-prone function calls in policies
    RETURN QUERY
    SELECT 
        'NO_FUNCTION_CALLS'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Policies with function calls (should be 0): ' || COUNT(*)::text
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    AND (qual LIKE '%is_conversation_participant%' OR with_check LIKE '%is_conversation_participant%');
    
END;
$$;


ALTER FUNCTION "public"."verify_conversation_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_no_recursion_policies"() RETURNS TABLE("table_name" "text", "policy_count" bigint, "has_cross_references" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::text,
        COUNT(*)::bigint,
        bool_or(
            p.qual LIKE '%conversation_participants%' OR 
            p.qual LIKE '%conversations%' OR
            p.with_check LIKE '%conversation_participants%' OR
            p.with_check LIKE '%conversations%'
        ) AND p.tablename != 'conversation_participants' AND p.tablename != 'conversations'
    FROM pg_policies p
    WHERE p.schemaname = 'public' 
    AND p.tablename IN ('conversations', 'conversation_participants', 'conversation_messages')
    GROUP BY p.tablename;
END;
$$;


ALTER FUNCTION "public"."verify_no_recursion_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_no_recursive_policies"() RETURNS TABLE("table_name" "text", "policy_name" "text", "policy_qual" "text", "policy_with_check" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."verify_no_recursive_policies"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_no_recursive_policies"() IS 'Fixed: uses qual and with_check columns instead of non-existent definition column';



CREATE OR REPLACE FUNCTION "public"."wallet_topup"("p_amount" numeric, "p_payment_method" "text" DEFAULT NULL::"text", "p_payment_reference" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Ensure wallet exists
  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.host_wallets (host_id)
    VALUES (v_host_id)
    RETURNING id, balance INTO v_wallet_id, v_balance_before;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update wallet balance
  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as credit
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description, metadata
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'credit', p_amount, v_balance_before, v_balance_after,
    COALESCE('Wallet top-up via ' || COALESCE(p_payment_method, 'unknown'), 'Wallet top-up'),
    jsonb_strip_nulls(jsonb_build_object('payment_method', p_payment_method, 'payment_reference', p_payment_reference))
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_topup', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$$;


ALTER FUNCTION "public"."wallet_topup"("p_amount" numeric, "p_payment_method" "text", "p_payment_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wallet_withdraw"("p_amount" numeric, "p_description" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'wallet_not_found');
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as debit/withdrawal
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'withdrawal', p_amount, v_balance_before, v_balance_after,
    COALESCE(p_description, 'Wallet withdrawal')
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_withdraw', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$$;


ALTER FUNCTION "public"."wallet_withdraw"("p_amount" numeric, "p_description" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "archive"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "status" "public"."message_status" DEFAULT 'sent'::"public"."message_status",
    "related_car_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "migrated_to_conversation_id" "uuid",
    "replying_to_message_id" "uuid",
    "forwarded" boolean DEFAULT false,
    "forwarded_from" "jsonb",
    "forwarded_at" timestamp with time zone,
    "starred" boolean DEFAULT false,
    "pinned" boolean DEFAULT false,
    "selected" boolean DEFAULT false,
    CONSTRAINT "check_not_self_reply" CHECK (("id" <> "replying_to_message_id"))
);

ALTER TABLE ONLY "archive"."messages" REPLICA IDENTITY FULL;


ALTER TABLE "archive"."messages" OWNER TO "postgres";


COMMENT ON COLUMN "archive"."messages"."replying_to_message_id" IS 'ID of the message this message is replying to. NULL if not a reply.';



CREATE TABLE IF NOT EXISTS "archive"."messages_backup_20250930_093926" (
    "id" "uuid",
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "content" "text",
    "status" "public"."message_status",
    "related_car_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "migrated_to_conversation_id" "uuid"
);


ALTER TABLE "archive"."messages_backup_20250930_093926" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "archive"."notifications_backup" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."old_notification_type" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "related_car_id" "uuid",
    "related_booking_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "archive"."notifications_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_capabilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "capability_key" "text" NOT NULL,
    "can_create" boolean DEFAULT false,
    "can_read" boolean DEFAULT true,
    "can_update" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "capability" "text"
);


ALTER TABLE "public"."admin_capabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", ("now"() + '08:00:00'::interval)) NOT NULL,
    "last_activity" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."admin_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "is_super_admin" boolean DEFAULT false,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "failed_login_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "password_changed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "must_change_password" boolean DEFAULT false
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "public"."audit_event_type" NOT NULL,
    "severity" "public"."audit_severity" DEFAULT 'medium'::"public"."audit_severity" NOT NULL,
    "actor_id" "uuid",
    "target_id" "uuid",
    "session_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "location_data" "jsonb",
    "action_details" "jsonb" NOT NULL,
    "previous_hash" "text",
    "current_hash" "text",
    "event_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "reason" "text",
    "anomaly_flags" "jsonb",
    "compliance_tags" "text"[]
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."audit_analytics" WITH ("security_invoker"='true') AS
 SELECT "date_trunc"('day'::"text", "event_timestamp") AS "date",
    "event_type",
    "severity",
    "count"(*) AS "event_count",
    "count"(DISTINCT "actor_id") AS "unique_actors",
    "count"(DISTINCT "target_id") AS "unique_targets",
    "array_agg"(DISTINCT "compliance_tags") FILTER (WHERE ("compliance_tags" IS NOT NULL)) AS "compliance_tags"
   FROM "public"."audit_logs"
  GROUP BY ("date_trunc"('day'::"text", "event_timestamp")), "event_type", "severity"
  ORDER BY ("date_trunc"('day'::"text", "event_timestamp")) DESC, ("count"(*)) DESC;


ALTER VIEW "public"."audit_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_type" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "auth_tokens_token_type_check" CHECK (("token_type" = ANY (ARRAY['email_confirmation'::"text", 'password_reset'::"text"])))
);


ALTER TABLE "public"."auth_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."auth_tokens" IS 'Stores hashed authentication tokens for email confirmation and password reset';



COMMENT ON COLUMN "public"."auth_tokens"."token_hash" IS 'Hashed version of the authentication token (never store raw tokens)';



COMMENT ON COLUMN "public"."auth_tokens"."token_type" IS 'Type of token: email_confirmation or password_reset';



COMMENT ON COLUMN "public"."auth_tokens"."used_at" IS 'Timestamp when token was used (for single-use tokens)';



CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "featured_image" "text",
    "author_name" character varying(100) NOT NULL,
    "author_email" character varying(255) NOT NULL,
    "author_bio" "text",
    "author_image" "text",
    "category" character varying(100) NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "meta_description" character varying(160),
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "published_at" timestamp with time zone,
    "scheduled_for" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "read_time" integer DEFAULT 5,
    "view_count" integer DEFAULT 0,
    "social_image" "text",
    CONSTRAINT "blog_posts_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('published'::character varying)::"text", ('scheduled'::character varying)::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "total_price" numeric NOT NULL,
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "latitude" numeric,
    "longitude" numeric,
    "commission_amount" numeric(10,2) DEFAULT 0.00,
    "commission_status" character varying(20) DEFAULT 'pending'::character varying,
    "host_preparation_completed" boolean DEFAULT false,
    "renter_preparation_completed" boolean DEFAULT false,
    "preparation_reminder_sent" boolean DEFAULT false,
    "start_time" time without time zone DEFAULT '09:00:00'::time without time zone,
    "end_time" time without time zone DEFAULT '18:00:00'::time without time zone,
    "early_return" boolean DEFAULT false,
    "actual_end_date" timestamp with time zone,
    "is_test_booking" boolean DEFAULT false,
    "payment_status" character varying(30) DEFAULT 'unpaid'::character varying,
    "payment_deadline" timestamp with time zone,
    "payment_transaction_id" "uuid",
    "insurance_premium" numeric(10,2) DEFAULT 0,
    "insurance_policy_id" "uuid",
    "base_rental_price" numeric(10,2),
    "dynamic_pricing_multiplier" numeric(6,4) DEFAULT 1.0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "promo_code_id" "uuid",
    "destination_type" "text" DEFAULT 'local'::"text",
    CONSTRAINT "bookings_destination_type_check" CHECK (("destination_type" = ANY (ARRAY['local'::"text", 'out_of_zone'::"text", 'cross_border'::"text"]))),
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."total_price" IS 'Grand total: rental + insurance - discounts (what renter pays)';



COMMENT ON COLUMN "public"."bookings"."early_return" IS 'Flag to indicate if the booking was returned early';



COMMENT ON COLUMN "public"."bookings"."actual_end_date" IS 'Actual date and time when the booking was completed/returned';



COMMENT ON COLUMN "public"."bookings"."payment_status" IS 'Payment state: unpaid, awaiting_payment, paid, refunded, partially_refunded';



COMMENT ON COLUMN "public"."bookings"."payment_deadline" IS 'Deadline for renter to complete payment after host approval';



COMMENT ON COLUMN "public"."bookings"."base_rental_price" IS 'Price before dynamic pricing: price_per_day × days';



COMMENT ON COLUMN "public"."bookings"."dynamic_pricing_multiplier" IS 'Composite multiplier from all pricing rules';



COMMENT ON COLUMN "public"."bookings"."discount_amount" IS 'Total discount applied (promo codes, etc.)';



CREATE TABLE IF NOT EXISTS "public"."campaign_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "user_id" "uuid",
    "notification_id" bigint,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_delivery_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'opened'::"text", 'clicked'::"text"])))
);


ALTER TABLE "public"."campaign_delivery_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid",
    "blocked_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."car_blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."car_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "vehicle_type" "public"."vehicle_type" NOT NULL,
    "price_per_day" numeric(10,2) NOT NULL,
    "location" "text" NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(10,8),
    "transmission" "text" NOT NULL,
    "fuel" "text" NOT NULL,
    "seats" integer NOT NULL,
    "description" "text",
    "image_url" "text",
    "is_available" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "features" "text"[] DEFAULT '{}'::"text"[],
    "is_sharing_location" boolean DEFAULT false,
    "location_sharing_scope" "text" DEFAULT 'none'::"text",
    "last_location_update" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "verification_status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."cars" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cars"."features" IS 'Array of feature identifiers for the car';



CREATE TABLE IF NOT EXISTS "public"."commission_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rate" numeric(5,4) DEFAULT 0.1500 NOT NULL,
    "effective_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "effective_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."commission_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'text'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "edited" boolean DEFAULT false,
    "edited_at" timestamp with time zone,
    "reply_to_message_id" "uuid",
    "related_car_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "delivery_status" "public"."message_delivery_status" DEFAULT 'sent'::"public"."message_delivery_status" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "encrypted_content" "text",
    "encryption_key_id" "uuid",
    "is_encrypted" boolean DEFAULT false,
    CONSTRAINT "check_message_timestamp_order" CHECK (((("delivered_at" IS NULL) OR ("delivered_at" >= "sent_at")) AND (("read_at" IS NULL) OR ("read_at" >= COALESCE("delivered_at", "sent_at"))))),
    CONSTRAINT "check_not_self_reply" CHECK (("id" <> "reply_to_message_id")),
    CONSTRAINT "conversation_messages_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'video'::character varying, 'audio'::character varying, 'file'::character varying, 'system'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."conversation_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_messages" IS 'Conversation messages table with RLS policies restored. Users can only access messages in conversations they participate in.';



COMMENT ON COLUMN "public"."conversation_messages"."reply_to_message_id" IS 'ID of the message this message is replying to within the same conversation. NULL if not a reply.';



COMMENT ON COLUMN "public"."conversation_messages"."delivery_status" IS 'WhatsApp-style message delivery status: sent (single tick), delivered (double gray ticks), read (blue ticks)';



COMMENT ON COLUMN "public"."conversation_messages"."sent_at" IS 'Timestamp when message was sent to server';



COMMENT ON COLUMN "public"."conversation_messages"."delivered_at" IS 'Timestamp when message was delivered to recipient device';



COMMENT ON COLUMN "public"."conversation_messages"."read_at" IS 'Timestamp when message was read by recipient';



CREATE OR REPLACE VIEW "public"."conversation_messages_with_replies" WITH ("security_invoker"='true') AS
 SELECT "cm"."id",
    "cm"."conversation_id",
    "cm"."sender_id",
    "cm"."content",
    "cm"."message_type",
    "cm"."created_at",
    "cm"."updated_at",
    "cm"."edited",
    "cm"."edited_at",
    "cm"."reply_to_message_id",
    "cm"."related_car_id",
    "cm"."metadata",
    "cm"."delivery_status",
    "cm"."sent_at",
    "cm"."delivered_at",
    "cm"."read_at",
    "cm"."encrypted_content",
    "cm"."encryption_key_id",
    "cm"."is_encrypted",
    "reply"."id" AS "reply_original_id",
    "reply"."content" AS "reply_to_content",
    "reply"."sender_id" AS "reply_to_sender_id",
    "reply"."created_at" AS "reply_to_created_at",
    "reply"."message_type" AS "reply_to_message_type",
    ( SELECT "count"(*) AS "count"
           FROM "public"."conversation_messages" "r"
          WHERE ("r"."reply_to_message_id" = "cm"."id")) AS "reply_count",
        CASE
            WHEN ("reply"."content" IS NOT NULL) THEN
            CASE
                WHEN ("length"("reply"."content") <= 50) THEN "reply"."content"
                ELSE (SUBSTRING("reply"."content" FROM 1 FOR 47) || '...'::"text")
            END
            ELSE NULL::"text"
        END AS "reply_to_preview"
   FROM ("public"."conversation_messages" "cm"
     LEFT JOIN "public"."conversation_messages" "reply" ON (("cm"."reply_to_message_id" = "reply"."id")));


ALTER VIEW "public"."conversation_messages_with_replies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."conversation_messages_with_replies"."reply_to_content" IS 'Content of the original message being replied to';



COMMENT ON COLUMN "public"."conversation_messages_with_replies"."reply_to_sender_id" IS 'Sender ID of the original message being replied to';



COMMENT ON COLUMN "public"."conversation_messages_with_replies"."reply_count" IS 'Number of direct replies to this message';



COMMENT ON COLUMN "public"."conversation_messages_with_replies"."reply_to_preview" IS 'First 50 characters of the message being replied to';



CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_read_at" timestamp with time zone,
    "is_admin" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."conversation_participants" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_participants" IS 'Conversation participants table with fixed RLS policies. Users can see all participants in conversations they participate in, but can only manage their own participation records.';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "type" character varying(20) DEFAULT 'direct'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_message_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "conversations_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('direct'::character varying)::"text", ('group'::character varying)::"text"])))
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversations" IS 'RLS temporarily disabled for testing messaging functionality';



CREATE TABLE IF NOT EXISTS "public"."device_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_token" "text" NOT NULL,
    "device_type" "text" NOT NULL,
    "device_info" "jsonb",
    "is_active" boolean DEFAULT true,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "device_tokens_device_type_check" CHECK (("device_type" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."device_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_tokens" IS 'Stores device tokens for push notifications with lifecycle management';



COMMENT ON COLUMN "public"."device_tokens"."device_token" IS 'FCM or similar push notification device token';



COMMENT ON COLUMN "public"."device_tokens"."device_type" IS 'Type of device: ios, android, or web';



COMMENT ON COLUMN "public"."device_tokens"."device_info" IS 'Additional device information as JSON';



COMMENT ON COLUMN "public"."device_tokens"."is_active" IS 'Whether this device token is still active';



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "status" "public"."document_status" DEFAULT 'pending'::"public"."document_status" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "provider" "text" NOT NULL,
    "template_id" "text",
    "total_sent" integer DEFAULT 0,
    "total_delivered" integer DEFAULT 0,
    "total_bounced" integer DEFAULT 0,
    "total_complained" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "total_failed" integer DEFAULT 0,
    "delivery_rate" numeric(5,2) DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "complaint_rate" numeric(5,2) DEFAULT 0,
    "open_rate" numeric(5,2) DEFAULT 0,
    "click_rate" numeric(5,2) DEFAULT 0,
    "average_latency_ms" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_analytics_daily" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."email_analytics_summary" WITH ("security_invoker"='true') AS
 SELECT "provider",
    "date_trunc"('month'::"text", ("date")::timestamp with time zone) AS "month",
    "sum"("total_sent") AS "total_sent",
    "sum"("total_delivered") AS "total_delivered",
    "sum"("total_bounced") AS "total_bounced",
    "sum"("total_complained") AS "total_complained",
    "sum"("total_opened") AS "total_opened",
    "sum"("total_clicked") AS "total_clicked",
    "sum"("total_failed") AS "total_failed",
    "round"("avg"("delivery_rate"), 2) AS "avg_delivery_rate",
    "round"("avg"("bounce_rate"), 2) AS "avg_bounce_rate",
    "round"("avg"("complaint_rate"), 2) AS "avg_complaint_rate",
    "round"("avg"("open_rate"), 2) AS "avg_open_rate",
    "round"("avg"("click_rate"), 2) AS "avg_click_rate",
    "round"("avg"("average_latency_ms")) AS "avg_latency_ms"
   FROM "public"."email_analytics_daily"
  GROUP BY "provider", ("date_trunc"('month'::"text", ("date")::timestamp with time zone))
  ORDER BY ("date_trunc"('month'::"text", ("date")::timestamp with time zone)) DESC, "provider";


ALTER VIEW "public"."email_analytics_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_delivery_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "text" NOT NULL,
    "correlation_id" "uuid" DEFAULT "gen_random_uuid"(),
    "recipient_email" "text" NOT NULL,
    "sender_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "template_id" "text",
    "status" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "bounced_at" timestamp with time zone,
    "complained_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_delivery_logs_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"]))),
    CONSTRAINT "email_delivery_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'bounced'::"text", 'complained'::"text", 'opened'::"text", 'clicked'::"text"])))
);


ALTER TABLE "public"."email_delivery_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "operation_type" "text" NOT NULL,
    "latency_ms" integer NOT NULL,
    "success" boolean NOT NULL,
    "circuit_breaker_state" "text",
    "fallback_used" boolean DEFAULT false,
    "error_type" "text",
    "error_message" "text",
    "request_size_bytes" integer,
    "response_size_bytes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_performance_metrics_circuit_breaker_state_check" CHECK (("circuit_breaker_state" = ANY (ARRAY['CLOSED'::"text", 'OPEN'::"text", 'HALF_OPEN'::"text"]))),
    CONSTRAINT "email_performance_metrics_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['send'::"text", 'batch_send'::"text", 'webhook'::"text"]))),
    CONSTRAINT "email_performance_metrics_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);


ALTER TABLE "public"."email_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_suppressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email_address" "text" NOT NULL,
    "suppression_type" "text" NOT NULL,
    "reason" "text",
    "provider" "text" NOT NULL,
    "message_id" "text",
    "suppressed_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_suppressions_suppression_type_check" CHECK (("suppression_type" = ANY (ARRAY['bounce'::"text", 'complaint'::"text", 'unsubscribe'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."email_suppressions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "message_id" "text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "event_timestamp" timestamp with time zone NOT NULL,
    "webhook_received_at" timestamp with time zone DEFAULT "now"(),
    "raw_payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processing_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_webhook_events_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);


ALTER TABLE "public"."email_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_encryption" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_id" "uuid" NOT NULL,
    "message_id" "uuid",
    "encryption_key_encrypted" "text" NOT NULL,
    "file_hash" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_encryption" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "section" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_time" "text" DEFAULT '5 min'::"text",
    "is_popular" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "guides_role_check" CHECK (("role" = ANY (ARRAY['renter'::"text", 'host'::"text", 'shared'::"text"])))
);


ALTER TABLE "public"."guides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."handover_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "host_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "host_ready" boolean DEFAULT false,
    "renter_ready" boolean DEFAULT false,
    "host_location" "jsonb",
    "renter_location" "jsonb",
    "handover_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "handover_type" "public"."handover_type" DEFAULT 'pickup'::"public"."handover_type" NOT NULL,
    "current_step_order" integer DEFAULT 1,
    "waiting_for" "text",
    "handover_location_lat" double precision,
    "handover_location_lng" double precision,
    "handover_location_name" "text",
    "handover_location_type" "text",
    "is_interactive" boolean DEFAULT false,
    CONSTRAINT "handover_sessions_handover_location_type_check" CHECK (("handover_location_type" = ANY (ARRAY['car_location'::"text", 'renter_location'::"text", 'searched'::"text", 'custom_pin'::"text"]))),
    CONSTRAINT "handover_sessions_waiting_for_check" CHECK (("waiting_for" = ANY (ARRAY['host'::"text", 'renter'::"text", 'both'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."handover_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."handover_sessions"."handover_type" IS 'Type of handover session: pickup (start of rental) or return (end of rental)';



CREATE TABLE IF NOT EXISTS "public"."handover_step_completion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "handover_session_id" "uuid",
    "step_name" character varying(50) NOT NULL,
    "step_order" integer NOT NULL,
    "completed_by" "uuid",
    "is_completed" boolean DEFAULT false,
    "completion_data" "jsonb" DEFAULT '{}'::"jsonb",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "step_owner" "text",
    "host_completed" boolean DEFAULT false,
    "renter_completed" boolean DEFAULT false,
    "host_completed_at" timestamp with time zone,
    "renter_completed_at" timestamp with time zone,
    CONSTRAINT "handover_step_completion_step_owner_check" CHECK (("step_owner" = ANY (ARRAY['host'::"text", 'renter'::"text", 'both'::"text"])))
);

ALTER TABLE ONLY "public"."handover_step_completion" REPLICA IDENTITY FULL;


ALTER TABLE "public"."handover_step_completion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."host_wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "balance" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pending_balance" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."host_wallets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."host_wallets"."balance" IS 'Available balance that can be withdrawn';



COMMENT ON COLUMN "public"."host_wallets"."pending_balance" IS 'Earnings from active rentals, released after completion';



CREATE TABLE IF NOT EXISTS "public"."identity_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_identity_key" "text" NOT NULL,
    "private_identity_key_encrypted" "text" NOT NULL,
    "registration_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."identity_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."identity_verification_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "handover_session_id" "uuid",
    "verifier_id" "uuid",
    "verified_user_id" "uuid",
    "verification_photo_url" "text",
    "license_photo_url" "text",
    "verification_status" character varying(20) DEFAULT 'pending'::character varying,
    "verification_notes" "text",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "identity_verification_checks_verification_status_check" CHECK ((("verification_status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('verified'::character varying)::"text", ('failed'::character varying)::"text"])))
);

ALTER TABLE ONLY "public"."identity_verification_checks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."identity_verification_checks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_claim_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "performed_by" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "insurance_claim_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['submitted'::"text", 'reviewed'::"text", 'info_requested'::"text", 'info_provided'::"text", 'approved'::"text", 'rejected'::"text", 'paid'::"text", 'note_added'::"text", 'document_uploaded'::"text", 'status_changed'::"text"])))
);


ALTER TABLE "public"."insurance_claim_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_number" "text" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "incident_date" timestamp with time zone NOT NULL,
    "incident_type" "text" NOT NULL,
    "incident_description" "text" NOT NULL,
    "damage_description" "text" NOT NULL,
    "location" "text",
    "police_report_filed" boolean DEFAULT false,
    "police_report_number" "text",
    "police_station" "text",
    "estimated_damage_cost" numeric(10,2),
    "actual_damage_cost" numeric(10,2),
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "approved_amount" numeric(10,2),
    "excess_paid" numeric(10,2),
    "admin_fee" numeric(10,2) DEFAULT 150.00,
    "payout_amount" numeric(10,2),
    "total_claim_cost" numeric(10,2),
    "rejection_reason" "text",
    "evidence_urls" "text"[],
    "repair_quotes_urls" "text"[],
    "repair_invoices_urls" "text"[],
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "more_info_requested_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "admin_notes" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payu_claim_reference" character varying(100),
    "external_status" character varying(50),
    "excess_requested" boolean DEFAULT false,
    "excess_amount_due" numeric(10,2),
    "excess_payment_date" timestamp with time zone,
    "renter_liability_amount" numeric(10,2),
    "renter_liability_paid" boolean DEFAULT false,
    CONSTRAINT "insurance_claims_incident_type_check" CHECK (("incident_type" = ANY (ARRAY['minor_damage'::"text", 'collision'::"text", 'theft'::"text", 'vandalism'::"text", 'fire'::"text", 'weather'::"text", 'third_party'::"text"]))),
    CONSTRAINT "insurance_claims_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'under_review'::"text", 'more_info_needed'::"text", 'approved'::"text", 'rejected'::"text", 'paid'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."insurance_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_commission_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "uuid",
    "mobirides_percentage" numeric(5,4) DEFAULT 0.10 NOT NULL,
    "payu_percentage" numeric(5,4) DEFAULT 0.90 NOT NULL,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."insurance_commission_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "premium_percentage" numeric(5,2) NOT NULL,
    "coverage_cap" numeric(10,2),
    "excess_amount" numeric(10,2),
    "covers_minor_damage" boolean DEFAULT false,
    "covers_major_incidents" boolean DEFAULT false,
    "features" "text"[] NOT NULL,
    "exclusions" "text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "insurance_packages_name_check" CHECK (("name" = ANY (ARRAY['no_coverage'::"text", 'basic'::"text", 'standard'::"text", 'premium'::"text"]))),
    CONSTRAINT "insurance_packages_premium_percentage_check" CHECK ((("premium_percentage" >= (0)::numeric) AND ("premium_percentage" <= (1)::numeric)))
);


ALTER TABLE "public"."insurance_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_rate" numeric(10,2) NOT NULL,
    "coverage_percentage" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "insurance_plans_coverage_percentage_check" CHECK ((("coverage_percentage" >= 0) AND ("coverage_percentage" <= 100)))
);


ALTER TABLE "public"."insurance_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "policy_number" "text" NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "renter_id" "uuid" NOT NULL,
    "car_id" "uuid" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "rental_amount_per_day" numeric(10,2) NOT NULL,
    "premium_per_day" numeric(10,2) NOT NULL,
    "number_of_days" integer NOT NULL,
    "total_premium" numeric(10,2) NOT NULL,
    "coverage_cap" numeric(10,2),
    "excess_amount" numeric(10,2),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "terms_accepted_at" timestamp with time zone NOT NULL,
    "terms_version" "text" DEFAULT 'v1.0-2025-11'::"text" NOT NULL,
    "policy_document_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payu_remittance_status" character varying(20) DEFAULT 'pending'::character varying,
    "payu_remittance_date" timestamp with time zone,
    "payu_remittance_reference" character varying(100),
    "mobirides_commission" numeric(10,2),
    "payu_amount" numeric(10,2),
    CONSTRAINT "insurance_policies_number_of_days_check" CHECK (("number_of_days" > 0)),
    CONSTRAINT "insurance_policies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'cancelled'::"text", 'claimed'::"text"]))),
    CONSTRAINT "valid_policy_dates" CHECK (("end_date" > "start_date"))
);


ALTER TABLE "public"."insurance_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."license_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "front_image_path" "text",
    "back_image_path" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "license_number" "text",
    "expiry_date" "date",
    "date_of_birth" "date",
    "country_of_issue" "text",
    CONSTRAINT "license_verifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."license_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "latitude" character varying,
    "longitude" character varying
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."notification_campaign_status" DEFAULT 'draft'::"public"."notification_campaign_status" NOT NULL,
    "target_user_roles" "text"[] DEFAULT '{}'::"text"[],
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "action_url" "text",
    "action_text" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "scheduled_for" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "total_recipients" integer DEFAULT 0,
    "successful_sends" integer DEFAULT 0,
    "failed_sends" integer DEFAULT 0,
    "registration_start" timestamp with time zone,
    "registration_end" timestamp with time zone,
    "last_login_days" integer,
    "booking_count_min" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_cleanup_log" (
    "id" bigint NOT NULL,
    "deleted_count" integer DEFAULT 0 NOT NULL,
    "cleanup_details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_cleanup_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_cleanup_log" IS 'Logs notification cleanup operations for monitoring';



CREATE SEQUENCE IF NOT EXISTS "public"."notification_cleanup_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notification_cleanup_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_cleanup_log_id_seq" OWNED BY "public"."notification_cleanup_log"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_expiration_policies" (
    "id" bigint NOT NULL,
    "notification_type" "public"."notification_type" NOT NULL,
    "default_expiration_hours" integer,
    "auto_cleanup_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_expiration_policies" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_expiration_policies" IS 'Defines expiration policies for different notification types';



CREATE SEQUENCE IF NOT EXISTS "public"."notification_expiration_policies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notification_expiration_policies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_expiration_policies_id_seq" OWNED BY "public"."notification_expiration_policies"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "booking_notifications" boolean DEFAULT true,
    "payment_notifications" boolean DEFAULT true,
    "marketing_notifications" boolean DEFAULT false,
    "notification_frequency" "text" DEFAULT 'instant'::"text",
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "notification_preferences_notification_frequency_check" CHECK (("notification_frequency" = ANY (ARRAY['instant'::"text", 'hourly'::"text", 'daily'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "role_target" "public"."notification_role" DEFAULT 'system_wide'::"public"."notification_role",
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "content" "text" GENERATED ALWAYS AS (COALESCE((("title" || ': '::"text") || "description"), "title", "description", 'Notification'::"text")) STORED,
    "related_booking_id" "uuid",
    "related_car_id" "uuid",
    CONSTRAINT "notifications_content_or_description_required" CHECK ((("content" IS NOT NULL) OR ("description" IS NOT NULL)))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."payment_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BWP'::character varying,
    "payment_method" character varying(50) NOT NULL,
    "payment_provider" character varying(50) NOT NULL,
    "provider_transaction_id" character varying(100),
    "provider_pay_request_id" character varying(50),
    "provider_reference" character varying(100),
    "status" character varying(30) DEFAULT 'initiated'::character varying NOT NULL,
    "platform_commission" numeric(10,2),
    "host_earnings" numeric(10,2),
    "commission_rate" numeric(5,4),
    "provider_response" "jsonb",
    "error_message" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "payment_transactions_amount_positive" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "payer_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BWP'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "provider" "text",
    "provider_reference" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('succeeded'::character varying)::"text", ('failed'::character varying)::"text", ('refunded'::character varying)::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "payout_method" character varying(50) NOT NULL,
    "details_encrypted" "jsonb" NOT NULL,
    "display_name" character varying(100),
    "is_default" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payout_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pending_confirmations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "token" "text" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone_number" "text",
    "password" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pending_confirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "verification_code" "text",
    "is_verified" boolean DEFAULT false,
    "attempt_count" integer DEFAULT 0,
    "last_attempt_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:10:00'::interval)
);


ALTER TABLE "public"."phone_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "premium" numeric(10,2) NOT NULL,
    "selected_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."policy_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pre_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key_id" integer NOT NULL,
    "public_key" "text" NOT NULL,
    "private_key_encrypted" "text" NOT NULL,
    "is_signed" boolean DEFAULT false,
    "signature" "text",
    "is_used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pre_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."premium_remittance_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_date" "date" NOT NULL,
    "total_policies" integer NOT NULL,
    "total_premium_collected" numeric(12,2) NOT NULL,
    "mobirides_commission_total" numeric(12,2) NOT NULL,
    "payu_amount_total" numeric(12,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "remitted_by" "uuid",
    "remitted_at" timestamp with time zone,
    "payu_confirmation_reference" character varying(100),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."premium_remittance_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'renter'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "phone_number" "text",
    "is_sharing_location" boolean DEFAULT false,
    "location_sharing_scope" "text" DEFAULT 'all'::"text",
    "latitude" numeric,
    "longitude" numeric,
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "id_photo_url" "text",
    "email_confirmed" boolean DEFAULT false,
    "email_confirmed_at" timestamp with time zone,
    "failed_login_attempts" integer DEFAULT 0,
    "account_locked_until" timestamp with time zone,
    "last_login_attempt" timestamp with time zone,
    "verification_status" "public"."verification_status" DEFAULT 'not_started'::"public"."verification_status",
    "verification_completed_at" timestamp with time zone,
    "verification_rejected_reason" "text",
    "marketing_notifications" boolean DEFAULT false,
    "tutorial_completed" boolean DEFAULT false,
    "tutorial_dismissed_at" timestamp with time zone,
    "tutorial_version" integer DEFAULT 1
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with RLS enabled for security';



COMMENT ON COLUMN "public"."profiles"."phone_number" IS 'User phone number';



COMMENT ON COLUMN "public"."profiles"."email_confirmed" IS 'Whether the user has confirmed their email address';



COMMENT ON COLUMN "public"."profiles"."email_confirmed_at" IS 'Timestamp when email was confirmed';



COMMENT ON COLUMN "public"."profiles"."failed_login_attempts" IS 'Counter for failed login attempts';



COMMENT ON COLUMN "public"."profiles"."account_locked_until" IS 'Timestamp until which account is locked due to failed attempts';



COMMENT ON COLUMN "public"."profiles"."last_login_attempt" IS 'Timestamp of last login attempt';



CREATE TABLE IF NOT EXISTS "public"."promo_code_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid",
    "user_id" "uuid",
    "booking_id" "uuid",
    "discount_applied" numeric(10,2) NOT NULL,
    "original_amount" numeric(10,2),
    "final_amount" numeric(10,2),
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_code_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "discount_amount" numeric(10,2) NOT NULL,
    "discount_type" character varying(20) DEFAULT 'fixed'::character varying NOT NULL,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "description" "text",
    "terms_conditions" "text",
    "min_booking_amount" numeric(10,2),
    "max_discount_amount" numeric(10,2),
    "applicable_vehicle_types" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_health_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "total_requests" integer DEFAULT 0,
    "successful_requests" integer DEFAULT 0,
    "failed_requests" integer DEFAULT 0,
    "average_latency_ms" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0,
    "circuit_breaker_state" "text",
    "consecutive_failures" integer DEFAULT 0,
    "last_failure_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "health_check_status" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "provider_health_metrics_circuit_breaker_state_check" CHECK (("circuit_breaker_state" = ANY (ARRAY['CLOSED'::"text", 'OPEN'::"text", 'HALF_OPEN'::"text"]))),
    CONSTRAINT "provider_health_metrics_provider_check" CHECK (("provider" = ANY (ARRAY['sendgrid'::"text", 'resend'::"text"])))
);


ALTER TABLE "public"."provider_health_metrics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."provider_performance_summary" WITH ("security_invoker"='true') AS
 SELECT "p"."provider",
    "p"."success_rate",
    "p"."average_latency_ms",
    "p"."circuit_breaker_state",
    "p"."consecutive_failures",
    "p"."last_failure_at",
    "p"."last_success_at",
    "p"."health_check_status",
    "count"("e"."id") AS "recent_events_24h"
   FROM ("public"."provider_health_metrics" "p"
     LEFT JOIN "public"."email_webhook_events" "e" ON ((("e"."provider" = "p"."provider") AND ("e"."webhook_received_at" >= ("now"() - '24:00:00'::interval)))))
  GROUP BY "p"."provider", "p"."success_rate", "p"."average_latency_ms", "p"."circuit_breaker_state", "p"."consecutive_failures", "p"."last_failure_at", "p"."last_success_at", "p"."health_check_status";


ALTER VIEW "public"."provider_performance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "attempts" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "action" character varying(50),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."rate_limits" IS 'Tracks rate limiting for authentication endpoints to prevent abuse';



COMMENT ON COLUMN "public"."rate_limits"."identifier" IS 'IP address or user ID for rate limiting';



COMMENT ON COLUMN "public"."rate_limits"."endpoint" IS 'API endpoint being rate limited';



COMMENT ON COLUMN "public"."rate_limits"."attempts" IS 'Number of attempts in current window';



COMMENT ON COLUMN "public"."rate_limits"."window_start" IS 'Start of current rate limiting window';



COMMENT ON COLUMN "public"."rate_limits"."action" IS 'Action being rate limited (login, register, forgot_password, etc.)';



COMMENT ON COLUMN "public"."rate_limits"."expires_at" IS 'When the rate limit expires';



CREATE TABLE IF NOT EXISTS "public"."real_time_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "host_id" "uuid" NOT NULL,
    "trip_id" "uuid",
    "latitude" numeric NOT NULL,
    "longitude" numeric NOT NULL,
    "heading" numeric,
    "speed" numeric,
    "accuracy" numeric,
    "sharing_scope" "text" DEFAULT 'none'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '1 day'::interval)
);


ALTER TABLE "public"."real_time_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "car_id" "uuid",
    "booking_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "review_type" "public"."review_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "review_images" "text"[] DEFAULT '{}'::"text"[],
    "category_ratings" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'published'::"text",
    "response" "text",
    "response_at" timestamp with time zone,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_cars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "car_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."saved_cars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signal_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_user_id" "uuid" NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "identity_key" "text" NOT NULL,
    "signed_pre_key" "text" NOT NULL,
    "one_time_pre_keys" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."signal_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_guide_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "guide_id" "uuid" NOT NULL,
    "completed_steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_guide_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_public_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_public_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_restrictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "restriction_type" "public"."restriction_type_enum" NOT NULL,
    "reason" "text",
    "active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "now"(),
    "ends_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_restrictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tutorial_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "step_key" "text" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_tutorial_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_step" "public"."verification_step" DEFAULT 'personal_info'::"public"."verification_step",
    "overall_status" "public"."verification_status" DEFAULT 'not_started'::"public"."verification_status",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "last_updated_at" timestamp with time zone DEFAULT "now"(),
    "personal_info" "jsonb",
    "personal_info_completed" boolean DEFAULT false,
    "documents_completed" boolean DEFAULT false,
    "selfie_completed" boolean DEFAULT false,
    "phone_verified" boolean DEFAULT false,
    "address_confirmed" boolean DEFAULT false,
    "admin_notes" "text",
    "rejection_reasons" "text"[]
);


ALTER TABLE "public"."user_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_condition_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "handover_session_id" "uuid",
    "booking_id" "uuid",
    "car_id" "uuid",
    "reporter_id" "uuid",
    "report_type" character varying(20) NOT NULL,
    "vehicle_photos" "jsonb" DEFAULT '[]'::"jsonb",
    "damage_reports" "jsonb" DEFAULT '[]'::"jsonb",
    "fuel_level" integer,
    "mileage" integer,
    "exterior_condition_notes" "text",
    "interior_condition_notes" "text",
    "additional_notes" "text",
    "digital_signature_data" "text",
    "is_acknowledged" boolean DEFAULT false,
    "acknowledged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vehicle_condition_reports_fuel_level_check" CHECK ((("fuel_level" >= 0) AND ("fuel_level" <= 100))),
    CONSTRAINT "vehicle_condition_reports_report_type_check" CHECK ((("report_type")::"text" = ANY (ARRAY[('pickup'::character varying)::"text", ('return'::character varying)::"text"])))
);

ALTER TABLE ONLY "public"."vehicle_condition_reports" REPLICA IDENTITY FULL;


ALTER TABLE "public"."vehicle_condition_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "from_owner_id" "uuid" NOT NULL,
    "to_owner_id" "uuid" NOT NULL,
    "transfer_reason" "text" NOT NULL,
    "transfer_notes" "text",
    "transferred_by" "uuid",
    "transferred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vehicle_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_address" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "verification_id" "uuid" NOT NULL,
    "street_address" "text" NOT NULL,
    "area_suburb" "text" NOT NULL,
    "city" "text" NOT NULL,
    "postal_code" "text",
    "country" "text" DEFAULT 'Botswana'::"text" NOT NULL,
    "confirmation_method" "public"."verification_method" NOT NULL,
    "is_confirmed" boolean DEFAULT false NOT NULL,
    "confirmed_at" timestamp with time zone,
    "confirmed_by" "uuid",
    "supporting_document_id" "uuid",
    "validation_notes" "text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_address" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_bypass_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "action" "text" NOT NULL,
    "bypass_reason" "text",
    "client_ip" "text",
    "user_agent" "text",
    "additional_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_bypass_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_bypass_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "bypass_reason" "text" NOT NULL,
    "client_ip" "text",
    "user_agent" "text",
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_bypass_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "public"."document_type" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "document_number" "text",
    "expiry_date" "date",
    "status" "public"."verification_status" DEFAULT 'pending_review'::"public"."verification_status",
    "rejection_reason" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone
);


ALTER TABLE "public"."verification_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "transaction_type" character varying(50) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "balance_before" numeric(10,2) NOT NULL,
    "balance_after" numeric(10,2) NOT NULL,
    "description" "text",
    "payment_method" character varying(50),
    "payment_reference" character varying(100),
    "status" character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "commission_rate" numeric(5,4),
    "booking_reference" character varying(50),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "wallet_transactions_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('completed'::character varying)::"text", ('failed'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."wallet_transactions"."transaction_type" IS 'Type of transaction: credit, debit, commission, refund, withdrawal, or insurance_payout';



CREATE TABLE IF NOT EXISTS "public"."withdrawal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BWP'::character varying,
    "payout_method" character varying(50) NOT NULL,
    "payout_details" "jsonb" NOT NULL,
    "status" character varying(30) DEFAULT 'pending'::character varying,
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "provider_reference" character varying(100),
    "provider_response" "jsonb",
    "failure_reason" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "withdrawal_requests_amount_positive" CHECK (("amount" >= (200)::numeric))
);


ALTER TABLE "public"."withdrawal_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."notification_cleanup_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_cleanup_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification_expiration_policies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_expiration_policies_id_seq"'::"regclass");



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "archive"."notifications_backup"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_capabilities"
    ADD CONSTRAINT "admin_capabilities_admin_id_capability_key_key" UNIQUE ("admin_id", "capability_key");



ALTER TABLE ONLY "public"."admin_capabilities"
    ADD CONSTRAINT "admin_capabilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_tokens"
    ADD CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_delivery_logs"
    ADD CONSTRAINT "campaign_delivery_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car_blocked_dates"
    ADD CONSTRAINT "car_blocked_dates_car_id_blocked_date_key" UNIQUE ("car_id", "blocked_date");



ALTER TABLE ONLY "public"."car_blocked_dates"
    ADD CONSTRAINT "car_blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."car_images"
    ADD CONSTRAINT "car_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_rates"
    ADD CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_device_token_key" UNIQUE ("user_id", "device_token");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_analytics_daily"
    ADD CONSTRAINT "email_analytics_daily_date_provider_template_id_key" UNIQUE ("date", "provider", "template_id");



ALTER TABLE ONLY "public"."email_analytics_daily"
    ADD CONSTRAINT "email_analytics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_delivery_logs"
    ADD CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_performance_metrics"
    ADD CONSTRAINT "email_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_suppressions"
    ADD CONSTRAINT "email_suppressions_email_address_key" UNIQUE ("email_address");



ALTER TABLE ONLY "public"."email_suppressions"
    ADD CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_webhook_events"
    ADD CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_encryption"
    ADD CONSTRAINT "file_encryption_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guides"
    ADD CONSTRAINT "guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."handover_sessions"
    ADD CONSTRAINT "handover_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."handover_step_completion"
    ADD CONSTRAINT "handover_step_completion_handover_session_id_step_name_key" UNIQUE ("handover_session_id", "step_name");



ALTER TABLE ONLY "public"."handover_step_completion"
    ADD CONSTRAINT "handover_step_completion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."host_wallets"
    ADD CONSTRAINT "host_wallets_host_id_key" UNIQUE ("host_id");



ALTER TABLE ONLY "public"."host_wallets"
    ADD CONSTRAINT "host_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."identity_keys"
    ADD CONSTRAINT "identity_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."identity_keys"
    ADD CONSTRAINT "identity_keys_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."identity_verification_checks"
    ADD CONSTRAINT "identity_verification_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_claim_activities"
    ADD CONSTRAINT "insurance_claim_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_commission_rates"
    ADD CONSTRAINT "insurance_commission_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_packages"
    ADD CONSTRAINT "insurance_packages_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."insurance_packages"
    ADD CONSTRAINT "insurance_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_plans"
    ADD CONSTRAINT "insurance_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_policy_number_key" UNIQUE ("policy_number");



ALTER TABLE ONLY "public"."license_verifications"
    ADD CONSTRAINT "license_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_cleanup_log"
    ADD CONSTRAINT "notification_cleanup_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_expiration_policies"
    ADD CONSTRAINT "notification_expiration_policies_notification_type_key" UNIQUE ("notification_type");



ALTER TABLE ONLY "public"."notification_expiration_policies"
    ADD CONSTRAINT "notification_expiration_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_config"
    ADD CONSTRAINT "payment_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."payment_config"
    ADD CONSTRAINT "payment_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_details"
    ADD CONSTRAINT "payout_details_one_default_per_host" EXCLUDE USING "btree" ("host_id" WITH =) WHERE (("is_default" = true));



ALTER TABLE ONLY "public"."payout_details"
    ADD CONSTRAINT "payout_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pending_confirmations"
    ADD CONSTRAINT "pending_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pending_confirmations"
    ADD CONSTRAINT "pending_confirmations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."phone_verifications"
    ADD CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_verifications"
    ADD CONSTRAINT "phone_verifications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."policy_selections"
    ADD CONSTRAINT "policy_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_keys"
    ADD CONSTRAINT "pre_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_keys"
    ADD CONSTRAINT "pre_keys_user_id_key_id_key" UNIQUE ("user_id", "key_id");



ALTER TABLE ONLY "public"."premium_remittance_batches"
    ADD CONSTRAINT "premium_remittance_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_promo_code_id_user_id_key" UNIQUE ("promo_code_id", "user_id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_health_metrics"
    ADD CONSTRAINT "provider_health_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_health_metrics"
    ADD CONSTRAINT "provider_health_metrics_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_identifier_endpoint_key" UNIQUE ("identifier", "endpoint");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_time_locations"
    ADD CONSTRAINT "real_time_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_cars"
    ADD CONSTRAINT "saved_cars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_cars"
    ADD CONSTRAINT "saved_cars_user_id_car_id_key" UNIQUE ("user_id", "car_id");



ALTER TABLE ONLY "public"."signal_sessions"
    ADD CONSTRAINT "signal_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."signal_sessions"
    ADD CONSTRAINT "signal_sessions_user_id_contact_user_id_key" UNIQUE ("user_id", "contact_user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "unique_conversation_participant" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "uq_user_roles_user" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_guide_progress"
    ADD CONSTRAINT "user_guide_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_guide_progress"
    ADD CONSTRAINT "user_guide_progress_user_id_guide_id_key" UNIQUE ("user_id", "guide_id");



ALTER TABLE ONLY "public"."user_public_keys"
    ADD CONSTRAINT "user_public_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_restrictions"
    ADD CONSTRAINT "user_restrictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tutorial_progress"
    ADD CONSTRAINT "user_tutorial_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tutorial_progress"
    ADD CONSTRAINT "user_tutorial_progress_user_id_step_key_key" UNIQUE ("user_id", "step_key");



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."vehicle_condition_reports"
    ADD CONSTRAINT "vehicle_condition_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_transfers"
    ADD CONSTRAINT "vehicle_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_address"
    ADD CONSTRAINT "verification_address_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_address"
    ADD CONSTRAINT "verification_address_verification_id_key" UNIQUE ("verification_id");



ALTER TABLE ONLY "public"."verification_bypass_logs"
    ADD CONSTRAINT "verification_bypass_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_bypass_sessions"
    ADD CONSTRAINT "verification_bypass_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_bypass_sessions"
    ADD CONSTRAINT "verification_bypass_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."verification_documents"
    ADD CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_documents"
    ADD CONSTRAINT "verification_documents_user_id_document_type_key" UNIQUE ("user_id", "document_type");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_messages_created_at" ON "archive"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_forwarded" ON "archive"."messages" USING "btree" ("forwarded") WHERE ("forwarded" = true);



CREATE INDEX "idx_messages_pinned" ON "archive"."messages" USING "btree" ("pinned") WHERE ("pinned" = true);



CREATE INDEX "idx_messages_receiver_id" ON "archive"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_receiver_status" ON "archive"."messages" USING "btree" ("receiver_id", "status");



CREATE INDEX "idx_messages_replies_by_original" ON "archive"."messages" USING "btree" ("replying_to_message_id") WHERE ("replying_to_message_id" IS NOT NULL);



CREATE INDEX "idx_messages_replying_to" ON "archive"."messages" USING "btree" ("replying_to_message_id");



CREATE INDEX "idx_messages_sender_id" ON "archive"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_messages_sender_receiver" ON "archive"."messages" USING "btree" ("sender_id", "receiver_id");



CREATE INDEX "idx_messages_starred" ON "archive"."messages" USING "btree" ("starred") WHERE ("starred" = true);



CREATE INDEX "idx_notifications_user_read_date" ON "archive"."notifications_backup" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "admin_capabilities_admin_key_idx" ON "public"."admin_capabilities" USING "btree" ("admin_id", "capability_key");



CREATE INDEX "idx_admin_activity_logs_action" ON "public"."admin_activity_logs" USING "btree" ("action");



CREATE INDEX "idx_admin_activity_logs_admin_id" ON "public"."admin_activity_logs" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_activity_logs_created_at" ON "public"."admin_activity_logs" USING "btree" ("created_at");



CREATE INDEX "idx_admin_activity_logs_resource" ON "public"."admin_activity_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_admin_capabilities_admin_id" ON "public"."admin_capabilities" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_capabilities_capability" ON "public"."admin_capabilities" USING "btree" ("capability");



CREATE INDEX "idx_admin_sessions_admin_id" ON "public"."admin_sessions" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_sessions_expires_at" ON "public"."admin_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_admin_sessions_is_active" ON "public"."admin_sessions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_admin_sessions_session_token" ON "public"."admin_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_admin_sessions_token" ON "public"."admin_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_admins_created_at" ON "public"."admins" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admins_email" ON "public"."admins" USING "btree" ("email");



CREATE INDEX "idx_admins_is_super_admin" ON "public"."admins" USING "btree" ("is_super_admin");



CREATE INDEX "idx_audit_logs_actor_id" ON "public"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_logs_compliance_tags" ON "public"."audit_logs" USING "gin" ("compliance_tags");



CREATE INDEX "idx_audit_logs_event_timestamp" ON "public"."audit_logs" USING "btree" ("event_timestamp" DESC);



CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING "btree" ("event_type");



CREATE INDEX "idx_audit_logs_resource_type_id" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_session_id" ON "public"."audit_logs" USING "btree" ("session_id");



CREATE INDEX "idx_audit_logs_severity" ON "public"."audit_logs" USING "btree" ("severity");



CREATE INDEX "idx_audit_logs_target_id" ON "public"."audit_logs" USING "btree" ("target_id");



CREATE INDEX "idx_auth_tokens_expires_at" ON "public"."auth_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_auth_tokens_token_hash" ON "public"."auth_tokens" USING "btree" ("token_hash");



CREATE INDEX "idx_auth_tokens_type" ON "public"."auth_tokens" USING "btree" ("token_type");



CREATE INDEX "idx_auth_tokens_user_id" ON "public"."auth_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_blog_posts_author_email" ON "public"."blog_posts" USING "btree" ("author_email");



CREATE INDEX "idx_blog_posts_category" ON "public"."blog_posts" USING "btree" ("category");



CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at");



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");



CREATE INDEX "idx_bookings_actual_end_date" ON "public"."bookings" USING "btree" ("actual_end_date");



CREATE INDEX "idx_bookings_car_id" ON "public"."bookings" USING "btree" ("car_id");



CREATE INDEX "idx_bookings_car_status" ON "public"."bookings" USING "btree" ("car_id", "status");



CREATE INDEX "idx_bookings_created_at_desc" ON "public"."bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bookings_date_range" ON "public"."bookings" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_bookings_dates" ON "public"."bookings" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_bookings_early_return" ON "public"."bookings" USING "btree" ("early_return") WHERE ("early_return" = true);



CREATE INDEX "idx_bookings_renter_id" ON "public"."bookings" USING "btree" ("renter_id");



CREATE INDEX "idx_bookings_renter_status" ON "public"."bookings" USING "btree" ("renter_id", "status");



CREATE INDEX "idx_bookings_test_booking" ON "public"."bookings" USING "btree" ("is_test_booking");



CREATE INDEX "idx_campaign_delivery_logs_campaign" ON "public"."campaign_delivery_logs" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaign_delivery_logs_notification" ON "public"."campaign_delivery_logs" USING "btree" ("notification_id");



CREATE INDEX "idx_campaign_delivery_logs_status" ON "public"."campaign_delivery_logs" USING "btree" ("status");



CREATE INDEX "idx_campaign_delivery_logs_user" ON "public"."campaign_delivery_logs" USING "btree" ("user_id");



CREATE INDEX "idx_car_images_car_id" ON "public"."car_images" USING "btree" ("car_id");



CREATE INDEX "idx_car_images_is_primary" ON "public"."car_images" USING "btree" ("is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_car_images_primary" ON "public"."car_images" USING "btree" ("car_id", "is_primary");



CREATE INDEX "idx_cars_features" ON "public"."cars" USING "gin" ("features");



CREATE INDEX "idx_cars_location" ON "public"."cars" USING "btree" ("latitude", "longitude") WHERE (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL));



CREATE INDEX "idx_cars_owner_available" ON "public"."cars" USING "btree" ("owner_id", "is_available");



CREATE INDEX "idx_cars_owner_id" ON "public"."cars" USING "btree" ("owner_id");



CREATE INDEX "idx_claim_activities_claim" ON "public"."insurance_claim_activities" USING "btree" ("claim_id");



CREATE INDEX "idx_claim_activities_date" ON "public"."insurance_claim_activities" USING "btree" ("created_at");



CREATE INDEX "idx_commission_rates_effective_from" ON "public"."commission_rates" USING "btree" ("effective_from");



CREATE INDEX "idx_conversation_messages_car_related" ON "public"."conversation_messages" USING "btree" ("related_car_id", "conversation_id") WHERE ("related_car_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_conversation_messages_car_related" IS 'Optimizes car-context message queries (partial index for efficiency)';



CREATE INDEX "idx_conversation_messages_composite" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_conversation_messages_conv_recent" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_conv_recent" IS 'Optimizes last message lookup for conversation previews';



CREATE INDEX "idx_conversation_messages_conv_sender" ON "public"."conversation_messages" USING "btree" ("conversation_id", "sender_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_conv_sender" IS 'Optimizes message queries by conversation and sender with chronological ordering';



CREATE INDEX "idx_conversation_messages_conversation" ON "public"."conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_messages_conversation_created" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_conversation_messages_conversation_id" ON "public"."conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_messages_conversation_reply" ON "public"."conversation_messages" USING "btree" ("conversation_id", "reply_to_message_id");



CREATE INDEX "idx_conversation_messages_conversation_sender" ON "public"."conversation_messages" USING "btree" ("conversation_id", "sender_id");



CREATE INDEX "idx_conversation_messages_conversation_status" ON "public"."conversation_messages" USING "btree" ("conversation_id", "delivery_status");



CREATE INDEX "idx_conversation_messages_count" ON "public"."conversation_messages" USING "btree" ("conversation_id");



COMMENT ON INDEX "public"."idx_conversation_messages_count" IS 'Optimizes message count queries for conversation statistics';



CREATE INDEX "idx_conversation_messages_created_at" ON "public"."conversation_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_conversation_messages_delivered_at" ON "public"."conversation_messages" USING "btree" ("delivered_at") WHERE ("delivered_at" IS NOT NULL);



CREATE INDEX "idx_conversation_messages_delivery_pagination" ON "public"."conversation_messages" USING "btree" ("conversation_id", "delivery_status", "created_at" DESC);



CREATE INDEX "idx_conversation_messages_delivery_status" ON "public"."conversation_messages" USING "btree" ("delivery_status");



CREATE INDEX "idx_conversation_messages_encrypted" ON "public"."conversation_messages" USING "btree" ("is_encrypted");



CREATE INDEX "idx_conversation_messages_metadata" ON "public"."conversation_messages" USING "gin" ("metadata") WHERE ("metadata" IS NOT NULL);



COMMENT ON INDEX "public"."idx_conversation_messages_metadata" IS 'Optimizes message metadata searches using GIN index for JSON operations';



CREATE INDEX "idx_conversation_messages_pagination" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_pagination" IS 'Optimizes cursor-based pagination for infinite scroll in chat messages';



CREATE INDEX "idx_conversation_messages_read_at" ON "public"."conversation_messages" USING "btree" ("read_at") WHERE ("read_at" IS NOT NULL);



CREATE INDEX "idx_conversation_messages_reply_to" ON "public"."conversation_messages" USING "btree" ("reply_to_message_id");



CREATE INDEX "idx_conversation_messages_sender" ON "public"."conversation_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_conversation_messages_sender_id" ON "public"."conversation_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_conversation_messages_sender_pagination" ON "public"."conversation_messages" USING "btree" ("conversation_id", "sender_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_sender_pagination" IS 'Optimizes sender-filtered message queries with pagination';



CREATE INDEX "idx_conversation_messages_sent_at" ON "public"."conversation_messages" USING "btree" ("sent_at");



CREATE INDEX "idx_conversation_messages_type_conv" ON "public"."conversation_messages" USING "btree" ("message_type", "conversation_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_type_conv" IS 'Optimizes message type filtering within conversations';



CREATE INDEX "idx_conversation_messages_type_pagination" ON "public"."conversation_messages" USING "btree" ("conversation_id", "message_type", "created_at" DESC);



COMMENT ON INDEX "public"."idx_conversation_messages_type_pagination" IS 'Optimizes message type filtering with pagination support';



CREATE INDEX "idx_conversation_participants_composite" ON "public"."conversation_participants" USING "btree" ("conversation_id", "user_id");



COMMENT ON INDEX "public"."idx_conversation_participants_composite" IS 'Optimizes participant lookup queries and existence checks';



CREATE INDEX "idx_conversation_participants_conversation" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_conversation_id" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_conversation_user" ON "public"."conversation_participants" USING "btree" ("conversation_id", "user_id");



CREATE INDEX "idx_conversation_participants_lookup" ON "public"."conversation_participants" USING "btree" ("conversation_id", "user_id");



CREATE INDEX "idx_conversation_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_participants_user_conv" ON "public"."conversation_participants" USING "btree" ("user_id", "conversation_id");



COMMENT ON INDEX "public"."idx_conversation_participants_user_conv" IS 'Optimizes RLS policy checks and user participation queries';



CREATE INDEX "idx_conversation_participants_user_conversation" ON "public"."conversation_participants" USING "btree" ("user_id", "conversation_id");



CREATE INDEX "idx_conversation_participants_user_id" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_active" ON "public"."conversations" USING "btree" ("updated_at" DESC, "type");



COMMENT ON INDEX "public"."idx_conversations_active" IS 'Optimizes conversation listing with type filtering and recency ordering';



CREATE INDEX "idx_conversations_created_by" ON "public"."conversations" USING "btree" ("created_by");



CREATE INDEX "idx_conversations_creator_updated" ON "public"."conversations" USING "btree" ("created_by", "updated_at" DESC);



CREATE INDEX "idx_conversations_type_created_by" ON "public"."conversations" USING "btree" ("type", "created_by");



COMMENT ON INDEX "public"."idx_conversations_type_created_by" IS 'Optimizes queries filtering conversations by type and creator';



CREATE INDEX "idx_conversations_type_updated_at" ON "public"."conversations" USING "btree" ("type", "updated_at" DESC);



COMMENT ON INDEX "public"."idx_conversations_type_updated_at" IS 'Optimizes conversation listing with type filtering and recency ordering';



CREATE INDEX "idx_conversations_updated" ON "public"."conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_conversations_updated_at" ON "public"."conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_device_tokens_active" ON "public"."device_tokens" USING "btree" ("is_active");



CREATE INDEX "idx_device_tokens_device_token" ON "public"."device_tokens" USING "btree" ("device_token");



CREATE INDEX "idx_device_tokens_is_active" ON "public"."device_tokens" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_device_tokens_user_id" ON "public"."device_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_documents_status" ON "public"."documents" USING "btree" ("status");



CREATE INDEX "idx_documents_user_id" ON "public"."documents" USING "btree" ("user_id");



CREATE INDEX "idx_email_analytics_daily_date" ON "public"."email_analytics_daily" USING "btree" ("date");



CREATE INDEX "idx_email_analytics_daily_provider" ON "public"."email_analytics_daily" USING "btree" ("provider");



CREATE INDEX "idx_email_analytics_daily_template" ON "public"."email_analytics_daily" USING "btree" ("template_id");



CREATE INDEX "idx_email_delivery_logs_correlation_id" ON "public"."email_delivery_logs" USING "btree" ("correlation_id");



CREATE INDEX "idx_email_delivery_logs_message_id" ON "public"."email_delivery_logs" USING "btree" ("message_id");



CREATE INDEX "idx_email_delivery_logs_provider" ON "public"."email_delivery_logs" USING "btree" ("provider");



CREATE INDEX "idx_email_delivery_logs_recipient" ON "public"."email_delivery_logs" USING "btree" ("recipient_email");



CREATE INDEX "idx_email_delivery_logs_sent_at" ON "public"."email_delivery_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_email_delivery_logs_status" ON "public"."email_delivery_logs" USING "btree" ("status");



CREATE INDEX "idx_email_performance_metrics_created_at" ON "public"."email_performance_metrics" USING "btree" ("created_at");



CREATE INDEX "idx_email_performance_metrics_provider" ON "public"."email_performance_metrics" USING "btree" ("provider");



CREATE INDEX "idx_email_performance_metrics_success" ON "public"."email_performance_metrics" USING "btree" ("success");



CREATE INDEX "idx_email_suppressions_email" ON "public"."email_suppressions" USING "btree" ("email_address");



CREATE INDEX "idx_email_suppressions_provider" ON "public"."email_suppressions" USING "btree" ("provider");



CREATE INDEX "idx_email_suppressions_type" ON "public"."email_suppressions" USING "btree" ("suppression_type");



CREATE INDEX "idx_email_webhook_events_message_id" ON "public"."email_webhook_events" USING "btree" ("message_id");



CREATE INDEX "idx_email_webhook_events_processed" ON "public"."email_webhook_events" USING "btree" ("processed");



CREATE INDEX "idx_email_webhook_events_provider" ON "public"."email_webhook_events" USING "btree" ("provider");



CREATE INDEX "idx_email_webhook_events_timestamp" ON "public"."email_webhook_events" USING "btree" ("event_timestamp");



CREATE INDEX "idx_file_encryption_message_id" ON "public"."file_encryption" USING "btree" ("message_id");



CREATE INDEX "idx_handover_sessions_booking_type" ON "public"."handover_sessions" USING "btree" ("booking_id", "handover_type");



CREATE INDEX "idx_identity_keys_user_id" ON "public"."identity_keys" USING "btree" ("user_id");



CREATE INDEX "idx_insurance_claims_booking" ON "public"."insurance_claims" USING "btree" ("booking_id");



CREATE INDEX "idx_insurance_claims_policy" ON "public"."insurance_claims" USING "btree" ("policy_id");



CREATE INDEX "idx_insurance_claims_renter" ON "public"."insurance_claims" USING "btree" ("renter_id");



CREATE INDEX "idx_insurance_claims_status" ON "public"."insurance_claims" USING "btree" ("status");



CREATE INDEX "idx_insurance_claims_submitted" ON "public"."insurance_claims" USING "btree" ("submitted_at");



CREATE INDEX "idx_insurance_policies_booking" ON "public"."insurance_policies" USING "btree" ("booking_id");



CREATE INDEX "idx_insurance_policies_dates" ON "public"."insurance_policies" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_insurance_policies_renter" ON "public"."insurance_policies" USING "btree" ("renter_id");



CREATE INDEX "idx_insurance_policies_status" ON "public"."insurance_policies" USING "btree" ("status");



CREATE INDEX "idx_license_verifications_status" ON "public"."license_verifications" USING "btree" ("status");



CREATE INDEX "idx_license_verifications_user_id" ON "public"."license_verifications" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_message_reactions_unique" ON "public"."message_reactions" USING "btree" ("message_id", "user_id", "emoji");



CREATE INDEX "idx_notification_cleanup_log_created_at" ON "public"."notification_cleanup_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notification_expiration_policies_type" ON "public"."notification_expiration_policies" USING "btree" ("notification_type");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_expires_at" ON "public"."notifications" USING "btree" ("expires_at");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_related_booking_id" ON "public"."notifications" USING "btree" ("related_booking_id") WHERE ("related_booking_id" IS NOT NULL);



CREATE INDEX "idx_notifications_related_car_id" ON "public"."notifications" USING "btree" ("related_car_id") WHERE ("related_car_id" IS NOT NULL);



CREATE INDEX "idx_notifications_role_target" ON "public"."notifications" USING "btree" ("role_target");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_type_created_at" ON "public"."notifications" USING "btree" ("type", "created_at");



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_notifications_user_created_at" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_notifications_user_type_booking" ON "public"."notifications" USING "btree" ("user_id", "type", "related_booking_id");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_payment_transactions_booking" ON "public"."payment_transactions" USING "btree" ("booking_id");



CREATE INDEX "idx_payment_transactions_created" ON "public"."payment_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_transactions_provider_ref" ON "public"."payment_transactions" USING "btree" ("provider_transaction_id");



CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "idx_payment_transactions_user" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_payments_booking_id" ON "public"."payments" USING "btree" ("booking_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payout_details_default" ON "public"."payout_details" USING "btree" ("host_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_payout_details_host" ON "public"."payout_details" USING "btree" ("host_id");



CREATE INDEX "idx_pending_confirmations_email" ON "public"."pending_confirmations" USING "btree" ("email");



CREATE INDEX "idx_pending_confirmations_expires_at" ON "public"."pending_confirmations" USING "btree" ("expires_at");



CREATE INDEX "idx_pending_confirmations_token" ON "public"."pending_confirmations" USING "btree" ("token");



CREATE INDEX "idx_phone_verifications_phone" ON "public"."phone_verifications" USING "btree" ("phone_number");



CREATE INDEX "idx_policy_selections_booking" ON "public"."policy_selections" USING "btree" ("booking_id");



CREATE INDEX "idx_policy_selections_plan" ON "public"."policy_selections" USING "btree" ("plan_id");



CREATE INDEX "idx_pre_keys_unused" ON "public"."pre_keys" USING "btree" ("user_id", "is_used") WHERE ("is_used" = false);



CREATE INDEX "idx_pre_keys_user_id" ON "public"."pre_keys" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_account_locked" ON "public"."profiles" USING "btree" ("account_locked_until");



CREATE INDEX "idx_profiles_coordinates" ON "public"."profiles" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_profiles_email_confirmed" ON "public"."profiles" USING "btree" ("email_confirmed");



CREATE INDEX "idx_profiles_full_name_search" ON "public"."profiles" USING "btree" ("full_name");



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_profiles_id_lookup" ON "public"."profiles" USING "btree" ("id");



COMMENT ON INDEX "public"."idx_profiles_id_lookup" IS 'Optimizes profile lookups in participant queries';



CREATE INDEX "idx_profiles_location_sharing" ON "public"."profiles" USING "btree" ("is_sharing_location");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_verification_status" ON "public"."profiles" USING "btree" ("verification_status");



CREATE INDEX "idx_provider_health_metrics_provider" ON "public"."provider_health_metrics" USING "btree" ("provider");



CREATE INDEX "idx_provider_health_metrics_updated_at" ON "public"."provider_health_metrics" USING "btree" ("updated_at");



CREATE INDEX "idx_push_subscriptions_user_id" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_rate_limits_action" ON "public"."rate_limits" USING "btree" ("action");



CREATE INDEX "idx_rate_limits_endpoint" ON "public"."rate_limits" USING "btree" ("endpoint");



CREATE INDEX "idx_rate_limits_expires_at" ON "public"."rate_limits" USING "btree" ("expires_at");



CREATE INDEX "idx_rate_limits_identifier" ON "public"."rate_limits" USING "btree" ("identifier");



CREATE INDEX "idx_rate_limits_window_start" ON "public"."rate_limits" USING "btree" ("window_start");



CREATE INDEX "idx_real_time_locations_car_id" ON "public"."real_time_locations" USING "btree" ("car_id");



CREATE INDEX "idx_real_time_locations_created_at" ON "public"."real_time_locations" USING "btree" ("created_at");



CREATE INDEX "idx_real_time_locations_host_id" ON "public"."real_time_locations" USING "btree" ("host_id");



CREATE INDEX "idx_real_time_locations_trip_id" ON "public"."real_time_locations" USING "btree" ("trip_id");



CREATE INDEX "idx_reviews_booking_id" ON "public"."reviews" USING "btree" ("booking_id");



CREATE INDEX "idx_reviews_car_id" ON "public"."reviews" USING "btree" ("car_id");



CREATE INDEX "idx_reviews_review_type" ON "public"."reviews" USING "btree" ("review_type");



CREATE INDEX "idx_reviews_reviewee_id" ON "public"."reviews" USING "btree" ("reviewee_id");



CREATE INDEX "idx_reviews_reviewer_id" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_reviews_status" ON "public"."reviews" USING "btree" ("status");



CREATE INDEX "idx_saved_cars_car_id" ON "public"."saved_cars" USING "btree" ("car_id");



CREATE INDEX "idx_saved_cars_user_id" ON "public"."saved_cars" USING "btree" ("user_id");



CREATE INDEX "idx_signal_sessions_user_contact" ON "public"."signal_sessions" USING "btree" ("user_id", "contact_user_id");



CREATE UNIQUE INDEX "idx_unique_active_handover_session" ON "public"."handover_sessions" USING "btree" ("booking_id", "handover_type", "renter_id") WHERE ("handover_completed" = false);



CREATE INDEX "idx_user_public_keys_created_at" ON "public"."user_public_keys" USING "btree" ("created_at");



CREATE UNIQUE INDEX "idx_user_public_keys_user_id" ON "public"."user_public_keys" USING "btree" ("user_id");



CREATE INDEX "idx_user_restrictions_active" ON "public"."user_restrictions" USING "btree" ("active");



CREATE INDEX "idx_user_restrictions_restriction_type" ON "public"."user_restrictions" USING "btree" ("restriction_type");



CREATE INDEX "idx_user_restrictions_user_id" ON "public"."user_restrictions" USING "btree" ("user_id");



CREATE INDEX "idx_user_verifications_status" ON "public"."user_verifications" USING "btree" ("overall_status");



CREATE INDEX "idx_user_verifications_step" ON "public"."user_verifications" USING "btree" ("current_step");



CREATE INDEX "idx_verification_address_confirmed" ON "public"."verification_address" USING "btree" ("is_confirmed");



CREATE INDEX "idx_verification_bypass_logs_action" ON "public"."verification_bypass_logs" USING "btree" ("action");



CREATE INDEX "idx_verification_bypass_logs_created_at" ON "public"."verification_bypass_logs" USING "btree" ("created_at");



CREATE INDEX "idx_verification_bypass_logs_session_id" ON "public"."verification_bypass_logs" USING "btree" ("session_id");



CREATE INDEX "idx_verification_bypass_logs_user_id" ON "public"."verification_bypass_logs" USING "btree" ("user_id");



CREATE INDEX "idx_verification_bypass_sessions_active" ON "public"."verification_bypass_sessions" USING "btree" ("is_active");



CREATE INDEX "idx_verification_bypass_sessions_expires" ON "public"."verification_bypass_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_verification_bypass_sessions_session_token" ON "public"."verification_bypass_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_verification_bypass_sessions_user_id" ON "public"."verification_bypass_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_verification_documents_status" ON "public"."verification_documents" USING "btree" ("status");



CREATE INDEX "idx_verification_documents_type" ON "public"."verification_documents" USING "btree" ("document_type");



CREATE INDEX "idx_verification_documents_user" ON "public"."verification_documents" USING "btree" ("user_id");



CREATE INDEX "idx_wallet_transactions_booking_id" ON "public"."wallet_transactions" USING "btree" ("booking_id");



CREATE INDEX "idx_wallet_transactions_wallet_date" ON "public"."wallet_transactions" USING "btree" ("wallet_id", "created_at" DESC);



CREATE INDEX "idx_withdrawal_requests_created" ON "public"."withdrawal_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_withdrawal_requests_host" ON "public"."withdrawal_requests" USING "btree" ("host_id");



CREATE INDEX "idx_withdrawal_requests_status" ON "public"."withdrawal_requests" USING "btree" ("status");



CREATE INDEX "notification_campaigns_created_by_idx" ON "public"."notification_campaigns" USING "btree" ("created_by");



CREATE INDEX "notification_campaigns_schedule_idx" ON "public"."notification_campaigns" USING "btree" ("scheduled_for") WHERE ("scheduled_for" IS NOT NULL);



CREATE INDEX "notification_campaigns_status_idx" ON "public"."notification_campaigns" USING "btree" ("status");



CREATE UNIQUE INDEX "unique_primary_image_per_car" ON "public"."car_images" USING "btree" ("car_id") WHERE ("is_primary" = true);



CREATE INDEX "vehicle_transfers_from_owner_idx" ON "public"."vehicle_transfers" USING "btree" ("from_owner_id");



CREATE INDEX "vehicle_transfers_to_owner_idx" ON "public"."vehicle_transfers" USING "btree" ("to_owner_id");



CREATE INDEX "vehicle_transfers_transferred_at_idx" ON "public"."vehicle_transfers" USING "btree" ("transferred_at");



CREATE INDEX "vehicle_transfers_vehicle_id_idx" ON "public"."vehicle_transfers" USING "btree" ("vehicle_id");



CREATE OR REPLACE TRIGGER "log_notification_trigger" AFTER INSERT ON "archive"."notifications_backup" FOR EACH ROW EXECUTE FUNCTION "public"."log_notification_creation"();



CREATE OR REPLACE TRIGGER "trigger_check_circular_reply" BEFORE INSERT OR UPDATE ON "archive"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."check_circular_reply"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "archive"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "admin_changes_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."admins" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_changes"();



CREATE OR REPLACE TRIGGER "audit_logs_immutable" BEFORE DELETE OR UPDATE ON "public"."audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_modification"();



CREATE OR REPLACE TRIGGER "audit_user_roles_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_user_role_changes"();



CREATE OR REPLACE TRIGGER "booking_status_change_trigger" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_booking_status_change"();



CREATE OR REPLACE TRIGGER "cleanup_expired_confirmations_trigger" AFTER INSERT ON "public"."pending_confirmations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_cleanup_expired_confirmations"();



CREATE OR REPLACE TRIGGER "enforce_step_dependencies_trigger" BEFORE UPDATE ON "public"."handover_step_completion" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_step_dependencies"();



CREATE OR REPLACE TRIGGER "ensure_conversation_integrity_trigger" AFTER DELETE ON "public"."conversation_participants" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_conversation_integrity"();



CREATE OR REPLACE TRIGGER "handle_user_restrictions_updated_at" BEFORE UPDATE ON "public"."user_restrictions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_restrictions_updated_at"();



CREATE OR REPLACE TRIGGER "handover_step_completion_trigger" AFTER UPDATE ON "public"."handover_step_completion" FOR EACH ROW EXECUTE FUNCTION "public"."handle_handover_step_completion"();



CREATE OR REPLACE TRIGGER "message_notification_trigger" AFTER INSERT ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message_notification"();



CREATE OR REPLACE TRIGGER "notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_preferences_timestamp"();



CREATE OR REPLACE TRIGGER "on_conversation_created" AFTER INSERT ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."add_conversation_creator_as_participant"();



CREATE OR REPLACE TRIGGER "on_verification_status_change" AFTER INSERT OR UPDATE OF "overall_status" ON "public"."user_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_verification_status"();



CREATE OR REPLACE TRIGGER "set_campaign_delivery_logs_updated_at" BEFORE UPDATE ON "public"."campaign_delivery_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_campaign_delivery_logs_updated_at"();



CREATE OR REPLACE TRIGGER "trg_validate_car_verification_status" BEFORE INSERT OR UPDATE OF "verification_status" ON "public"."cars" FOR EACH ROW EXECUTE FUNCTION "public"."validate_car_verification_status"();



CREATE OR REPLACE TRIGGER "trigger_check_circular_reply_conversation" BEFORE INSERT OR UPDATE ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."check_circular_reply_conversation"();



CREATE OR REPLACE TRIGGER "trigger_clean_expired_locations" AFTER INSERT ON "public"."real_time_locations" FOR EACH STATEMENT EXECUTE FUNCTION "public"."clean_expired_locations"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_expired_notifications" AFTER INSERT OR UPDATE ON "public"."notifications" FOR EACH STATEMENT EXECUTE FUNCTION "public"."cleanup_expired_notifications"();



CREATE OR REPLACE TRIGGER "trigger_handle_booking_status_change" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_booking_status_change"();



CREATE OR REPLACE TRIGGER "trigger_handle_handover_completion" AFTER UPDATE ON "public"."handover_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_handover_completion"();



COMMENT ON TRIGGER "trigger_handle_handover_completion" ON "public"."handover_sessions" IS 'Trigger that automatically completes bookings and handles early return logic when return handover sessions are marked as completed.';



CREATE OR REPLACE TRIGGER "trigger_log_bypass_session_creation" AFTER INSERT ON "public"."verification_bypass_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."log_bypass_session_creation"();



CREATE OR REPLACE TRIGGER "trigger_log_bypass_session_deactivation" AFTER UPDATE ON "public"."verification_bypass_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."log_bypass_session_deactivation"();



CREATE OR REPLACE TRIGGER "trigger_update_message_delivery_status" BEFORE UPDATE ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_message_delivery_status"();



CREATE OR REPLACE TRIGGER "trigger_update_user_public_keys_updated_at" BEFORE UPDATE ON "public"."user_public_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_public_keys_updated_at"();



CREATE OR REPLACE TRIGGER "update_auth_tokens_updated_at" BEFORE UPDATE ON "public"."auth_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_car_images_updated_at" BEFORE UPDATE ON "public"."car_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cars_updated_at" BEFORE UPDATE ON "public"."cars" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_commission_rates_updated_at" BEFORE UPDATE ON "public"."commission_rates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_timestamp_trigger" AFTER INSERT ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_timestamp"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_device_tokens_updated_at" BEFORE UPDATE ON "public"."device_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_email_analytics_daily_updated_at" BEFORE UPDATE ON "public"."email_analytics_daily" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_email_delivery_logs_updated_at" BEFORE UPDATE ON "public"."email_delivery_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_handover_session_trigger" AFTER UPDATE ON "public"."handover_step_completion" FOR EACH ROW EXECUTE FUNCTION "public"."update_handover_session_on_step_completion"();



CREATE OR REPLACE TRIGGER "update_identity_keys_updated_at" BEFORE UPDATE ON "public"."identity_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_insurance_claims_updated_at" BEFORE UPDATE ON "public"."insurance_claims" FOR EACH ROW EXECUTE FUNCTION "public"."update_insurance_updated_at"();



CREATE OR REPLACE TRIGGER "update_insurance_packages_updated_at" BEFORE UPDATE ON "public"."insurance_packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_insurance_updated_at"();



CREATE OR REPLACE TRIGGER "update_insurance_policies_updated_at" BEFORE UPDATE ON "public"."insurance_policies" FOR EACH ROW EXECUTE FUNCTION "public"."update_insurance_updated_at"();



CREATE OR REPLACE TRIGGER "update_license_verifications_updated_at" BEFORE UPDATE ON "public"."license_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provider_health_metrics_updated_at" BEFORE UPDATE ON "public"."provider_health_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_push_subscriptions_updated_at" BEFORE UPDATE ON "public"."push_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rate_limits_updated_at" BEFORE UPDATE ON "public"."rate_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_saved_cars_updated_at" BEFORE UPDATE ON "public"."saved_cars" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_signal_sessions_updated_at" BEFORE UPDATE ON "public"."signal_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_guide_progress_updated_at" BEFORE UPDATE ON "public"."user_guide_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_verifications_updated_at" BEFORE UPDATE ON "public"."user_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_columns"();



CREATE OR REPLACE TRIGGER "update_verification_address_updated_at" BEFORE UPDATE ON "public"."verification_address" FOR EACH ROW EXECUTE FUNCTION "public"."update_verification_columns"();



CREATE OR REPLACE TRIGGER "validate_conversation_creation_trigger" AFTER INSERT ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."validate_conversation_creation"();



CREATE OR REPLACE TRIGGER "verification_completion_trigger" BEFORE UPDATE ON "public"."user_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."check_verification_completion"();



CREATE OR REPLACE TRIGGER "verification_insert_trigger" BEFORE INSERT ON "public"."user_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."check_verification_completion"();



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_migrated_to_conversation_id_fkey" FOREIGN KEY ("migrated_to_conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_related_car_id_fkey" FOREIGN KEY ("related_car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_replying_to_message_id_fkey" FOREIGN KEY ("replying_to_message_id") REFERENCES "archive"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "archive"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "archive"."notifications_backup"
    ADD CONSTRAINT "notifications_related_booking_id_fkey" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "archive"."notifications_backup"
    ADD CONSTRAINT "notifications_related_car_id_fkey" FOREIGN KEY ("related_car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "archive"."notifications_backup"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_capabilities"
    ADD CONSTRAINT "admin_capabilities_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_capabilities"
    ADD CONSTRAINT "admin_capabilities_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."auth_tokens"
    ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."campaign_delivery_logs"
    ADD CONSTRAINT "campaign_delivery_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_delivery_logs"
    ADD CONSTRAINT "campaign_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."car_blocked_dates"
    ADD CONSTRAINT "car_blocked_dates_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."car_blocked_dates"
    ADD CONSTRAINT "car_blocked_dates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."car_images"
    ADD CONSTRAINT "car_images_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_related_car_id_fkey" FOREIGN KEY ("related_car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."conversation_messages"("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."file_encryption"
    ADD CONSTRAINT "file_encryption_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "fk_conversation_messages_sender_id" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."handover_sessions"
    ADD CONSTRAINT "handover_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."handover_sessions"
    ADD CONSTRAINT "handover_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."handover_sessions"
    ADD CONSTRAINT "handover_sessions_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."handover_step_completion"
    ADD CONSTRAINT "handover_step_completion_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."handover_step_completion"
    ADD CONSTRAINT "handover_step_completion_handover_session_id_fkey" FOREIGN KEY ("handover_session_id") REFERENCES "public"."handover_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."host_wallets"
    ADD CONSTRAINT "host_wallets_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."identity_keys"
    ADD CONSTRAINT "identity_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."identity_verification_checks"
    ADD CONSTRAINT "identity_verification_checks_handover_session_id_fkey" FOREIGN KEY ("handover_session_id") REFERENCES "public"."handover_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."identity_verification_checks"
    ADD CONSTRAINT "identity_verification_checks_verified_user_id_fkey" FOREIGN KEY ("verified_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."identity_verification_checks"
    ADD CONSTRAINT "identity_verification_checks_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insurance_claim_activities"
    ADD CONSTRAINT "insurance_claim_activities_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."insurance_claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insurance_claim_activities"
    ADD CONSTRAINT "insurance_claim_activities_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."insurance_policies"("id");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."insurance_claims"
    ADD CONSTRAINT "insurance_claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."insurance_commission_rates"
    ADD CONSTRAINT "insurance_commission_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."insurance_packages"("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."license_verifications"
    ADD CONSTRAINT "license_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_booking_id_fkey" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_car_id_fkey" FOREIGN KEY ("related_car_id") REFERENCES "public"."cars"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_config"
    ADD CONSTRAINT "payment_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_details"
    ADD CONSTRAINT "payout_details_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."phone_verifications"
    ADD CONSTRAINT "phone_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_selections"
    ADD CONSTRAINT "policy_selections_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_selections"
    ADD CONSTRAINT "policy_selections_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."policy_selections"
    ADD CONSTRAINT "policy_selections_selected_by_fkey" FOREIGN KEY ("selected_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pre_keys"
    ADD CONSTRAINT "pre_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."premium_remittance_batches"
    ADD CONSTRAINT "premium_remittance_batches_remitted_by_fkey" FOREIGN KEY ("remitted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_time_locations"
    ADD CONSTRAINT "real_time_locations_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_time_locations"
    ADD CONSTRAINT "real_time_locations_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_time_locations"
    ADD CONSTRAINT "real_time_locations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_cars"
    ADD CONSTRAINT "saved_cars_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_cars"
    ADD CONSTRAINT "saved_cars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signal_sessions"
    ADD CONSTRAINT "signal_sessions_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signal_sessions"
    ADD CONSTRAINT "signal_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_guide_progress"
    ADD CONSTRAINT "user_guide_progress_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_guide_progress"
    ADD CONSTRAINT "user_guide_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_public_keys"
    ADD CONSTRAINT "user_public_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_restrictions"
    ADD CONSTRAINT "user_restrictions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_restrictions"
    ADD CONSTRAINT "user_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tutorial_progress"
    ADD CONSTRAINT "user_tutorial_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_verifications"
    ADD CONSTRAINT "user_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_condition_reports"
    ADD CONSTRAINT "vehicle_condition_reports_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_condition_reports"
    ADD CONSTRAINT "vehicle_condition_reports_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_condition_reports"
    ADD CONSTRAINT "vehicle_condition_reports_handover_session_id_fkey" FOREIGN KEY ("handover_session_id") REFERENCES "public"."handover_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_condition_reports"
    ADD CONSTRAINT "vehicle_condition_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_transfers"
    ADD CONSTRAINT "vehicle_transfers_from_owner_id_fkey" FOREIGN KEY ("from_owner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_transfers"
    ADD CONSTRAINT "vehicle_transfers_to_owner_id_fkey" FOREIGN KEY ("to_owner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_transfers"
    ADD CONSTRAINT "vehicle_transfers_transferred_by_fkey" FOREIGN KEY ("transferred_by") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_transfers"
    ADD CONSTRAINT "vehicle_transfers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_address"
    ADD CONSTRAINT "verification_address_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."verification_address"
    ADD CONSTRAINT "verification_address_supporting_document_id_fkey" FOREIGN KEY ("supporting_document_id") REFERENCES "public"."verification_documents"("id");



ALTER TABLE ONLY "public"."verification_address"
    ADD CONSTRAINT "verification_address_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."user_verifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_bypass_logs"
    ADD CONSTRAINT "verification_bypass_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."verification_bypass_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_bypass_logs"
    ADD CONSTRAINT "verification_bypass_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_bypass_sessions"
    ADD CONSTRAINT "verification_bypass_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_documents"
    ADD CONSTRAINT "verification_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."host_wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."host_wallets"("id");



CREATE POLICY "Admins can view all messages" ON "archive"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Users can create notifications" ON "archive"."notifications_backup" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert their own messages" ON "archive"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own messages" ON "archive"."messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"())) WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notifications" ON "archive"."notifications_backup" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own messages" ON "archive"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own notifications" ON "archive"."notifications_backup" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "archive"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "archive"."notifications_backup" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins and super admins can create restrictions" ON "public"."user_restrictions" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))) OR (EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true))))));



CREATE POLICY "Admins and super admins can update restrictions" ON "public"."user_restrictions" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))) OR (EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true))))));



CREATE POLICY "Admins and super admins can view all restrictions" ON "public"."user_restrictions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))) OR (EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true))))));



CREATE POLICY "Admins can create activity logs" ON "public"."admin_activity_logs" FOR INSERT WITH CHECK (("admin_id" = "auth"."uid"()));



CREATE POLICY "Admins can create their own sessions" ON "public"."admin_sessions" FOR INSERT WITH CHECK (("admin_id" = "auth"."uid"()));



CREATE POLICY "Admins can insert their own activity logs" ON "public"."admin_activity_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "admin_id"));



CREATE POLICY "Admins can insert their own sessions" ON "public"."admin_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "admin_id"));



CREATE POLICY "Admins can insert vehicle transfers" ON "public"."vehicle_transfers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage all address verifications" ON "public"."verification_address" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."role")::"text" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "Admins can manage all claims" ON "public"."insurance_claims" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all documents" ON "public"."verification_documents" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."role")::"text" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "Admins can manage all phone verifications" ON "public"."phone_verifications" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."role")::"text" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "Admins can manage all verifications" ON "public"."user_verifications" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."role")::"text" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "Admins can manage campaigns" ON "public"."notification_campaigns" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND (("admins"."is_super_admin" = true) OR ("admins"."id" = "notification_campaigns"."created_by"))))));



CREATE POLICY "Admins can manage payment config" ON "public"."payment_config" USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"public"."user_role")))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"())))));



CREATE POLICY "Admins can manage promo codes" ON "public"."promo_codes" USING (((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'super_admin'::"public"."user_role")))))));



CREATE POLICY "Admins can update all cars" ON "public"."cars" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all documents" ON "public"."verification_documents" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update all license verifications" ON "public"."license_verifications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update all verifications" ON "public"."user_verifications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update their own sessions" ON "public"."admin_sessions" FOR UPDATE USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Admins can view all address verifications" ON "public"."verification_address" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all car images" ON "public"."car_images" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all claim activities" ON "public"."insurance_claim_activities" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all claims" ON "public"."insurance_claims" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all documents" ON "public"."verification_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all insurance policies" ON "public"."insurance_policies" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all license verifications" ON "public"."license_verifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all payment transactions" ON "public"."payment_transactions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"public"."user_role")))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"())))));



CREATE POLICY "Admins can view all phone verifications" ON "public"."phone_verifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all promo usage" ON "public"."promo_code_usage" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'super_admin'::"public"."user_role")))))));



CREATE POLICY "Admins can view all verifications" ON "public"."user_verifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view their own activity logs" ON "public"."admin_activity_logs" FOR SELECT USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Admins can view their own capabilities" ON "public"."admin_capabilities" FOR SELECT USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "Admins can view their own sessions" ON "public"."admin_sessions" FOR SELECT USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Admins can view vehicle transfers" ON "public"."vehicle_transfers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "Allow hosts and renters to create handover sessions" ON "public"."handover_sessions" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "host_id") OR ("auth"."uid"() = "renter_id")));



CREATE POLICY "Allow public read access to cars" ON "public"."cars" FOR SELECT USING (true);



CREATE POLICY "Anyone can read payment config" ON "public"."payment_config" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active plans" ON "public"."insurance_plans" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Anyone can view active promo codes" ON "public"."promo_codes" FOR SELECT USING ((("is_active" = true) AND (("valid_until" IS NULL) OR ("valid_until" > "now"()))));



CREATE POLICY "Anyone can view available cars" ON "public"."cars" FOR SELECT USING (("is_available" = true));



CREATE POLICY "Anyone can view blocked dates" ON "public"."car_blocked_dates" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read email analytics" ON "public"."email_analytics_daily" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read guides" ON "public"."guides" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read provider health" ON "public"."provider_health_metrics" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view basic profile info" ON "public"."profiles" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND true));



CREATE POLICY "Booking participants can view locations" ON "public"."real_time_locations" FOR SELECT USING ((("host_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."cars" "c" ON (("c"."id" = "b"."car_id")))
  WHERE (("b"."status" = 'confirmed'::"public"."booking_status") AND ((("b"."renter_id" = "auth"."uid"()) AND ("c"."owner_id" = "real_time_locations"."host_id")) OR (("c"."owner_id" = "auth"."uid"()) AND ("real_time_locations"."host_id" = "auth"."uid"()))))))));



CREATE POLICY "Car images are viewable by everyone" ON "public"."car_images" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Car owners can update their car locations" ON "public"."cars" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Car owners can view bookings for their cars" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "bookings"."car_id") AND ("cars"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Car owners can view claims for their cars" ON "public"."insurance_claims" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."cars" "c" ON (("c"."id" = "b"."car_id")))
  WHERE (("b"."id" = "insurance_claims"."booking_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Car owners can view policies for their cars" ON "public"."insurance_policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "insurance_policies"."car_id") AND ("cars"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Car owners or admins can delete their car images" ON "public"."car_images" FOR DELETE USING (("public"."is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_images"."car_id") AND ("cars"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Car owners or admins can insert their car images" ON "public"."car_images" FOR INSERT WITH CHECK (("public"."is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_images"."car_id") AND ("cars"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Car owners or admins can update their car images" ON "public"."car_images" FOR UPDATE USING (("public"."is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_images"."car_id") AND ("cars"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Cars are viewable by everyone" ON "public"."cars" FOR SELECT USING (true);



CREATE POLICY "Commission rates are viewable by authenticated users" ON "public"."commission_rates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Commission rates are viewable by everyone" ON "public"."commission_rates" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."notifications" FOR SELECT USING (true);



CREATE POLICY "Hosts can create their own withdrawal requests" ON "public"."withdrawal_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "host_id"));



CREATE POLICY "Hosts can insert their own locations" ON "public"."real_time_locations" FOR INSERT WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can manage their own cars" ON "public"."cars" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Hosts can manage their own payout details" ON "public"."payout_details" USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Hosts can update bookings for their cars" ON "public"."bookings" FOR UPDATE USING (("auth"."uid"() = ( SELECT "cars"."owner_id"
   FROM "public"."cars"
  WHERE ("cars"."id" = "bookings"."car_id"))));



CREATE POLICY "Hosts can update their own locations" ON "public"."real_time_locations" FOR UPDATE USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can update their own wallet" ON "public"."host_wallets" FOR UPDATE USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view bookings for their cars" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = ( SELECT "cars"."owner_id"
   FROM "public"."cars"
  WHERE ("cars"."id" = "bookings"."car_id"))));



CREATE POLICY "Hosts can view host-only notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'host_only'::"public"."notification_role") AND ((("related_car_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "cars"."owner_id"
   FROM "public"."cars"
  WHERE ("cars"."id" = "notifications"."related_car_id")))) OR (("related_booking_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "c"."owner_id"
   FROM ("public"."cars" "c"
     JOIN "public"."bookings" "b" ON (("c"."id" = "b"."car_id")))
  WHERE ("b"."id" = "notifications"."related_booking_id")))) OR (("related_car_id" IS NULL) AND ("related_booking_id" IS NULL)))));



COMMENT ON POLICY "Hosts can view host-only notifications" ON "public"."notifications" IS 'Allows car owners to view host-only notifications related to their cars or bookings';



CREATE POLICY "Hosts can view their own transactions" ON "public"."wallet_transactions" FOR SELECT USING (("wallet_id" IN ( SELECT "host_wallets"."id"
   FROM "public"."host_wallets"
  WHERE ("host_wallets"."host_id" = "auth"."uid"()))));



CREATE POLICY "Hosts can view their own wallet" ON "public"."host_wallets" FOR SELECT USING (("host_id" = "auth"."uid"()));



CREATE POLICY "Hosts can view their own withdrawal requests" ON "public"."withdrawal_requests" FOR SELECT USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Insurance packages are viewable by everyone" ON "public"."insurance_packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Only admins can insert commission rates" ON "public"."commission_rates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Only admins can manage insurance packages" ON "public"."insurance_packages" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Only admins can update commission rates" ON "public"."commission_rates" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Owners can manage blocked dates" ON "public"."car_blocked_dates" USING ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_blocked_dates"."car_id") AND ("cars"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Public can view published blog posts" ON "public"."blog_posts" FOR SELECT USING (((("status")::"text" = 'published'::"text") AND ("published_at" <= "now"())));



CREATE POLICY "Public can view published car reviews" ON "public"."reviews" FOR SELECT USING (((("status" IS NULL) OR ("status" = 'published'::"text")) AND ("review_type" = 'car'::"public"."review_type")));



CREATE POLICY "Renters can create bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "renter_id"));



CREATE POLICY "Renters can view renter-only notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'renter_only'::"public"."notification_role") AND ((("related_booking_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "bookings"."renter_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "notifications"."related_booking_id")))) OR ("related_booking_id" IS NULL))));



COMMENT ON POLICY "Renters can view renter-only notifications" ON "public"."notifications" IS 'Allows renters to view renter-only notifications related to their bookings';



CREATE POLICY "Renters can view their own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("renter_id" = "auth"."uid"()));



CREATE POLICY "Reviews are viewable by everyone" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Service role can create notifications" ON "public"."notifications" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all notifications" ON "public"."notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage auth tokens" ON "public"."auth_tokens" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage email analytics" ON "public"."email_analytics_daily" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage email delivery logs" ON "public"."email_delivery_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage email performance metrics" ON "public"."email_performance_metrics" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage email suppressions" ON "public"."email_suppressions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage pending confirmations" ON "public"."pending_confirmations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage provider health metrics" ON "public"."provider_health_metrics" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage rate limits" ON "public"."rate_limits" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage webhook events" ON "public"."email_webhook_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages all payments" ON "public"."payments" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role manages selections" ON "public"."policy_selections" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Super admins can manage all capabilities" ON "public"."admin_capabilities" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND ("admins"."is_super_admin" = true)))));



CREATE POLICY "Super admins can update any car" ON "public"."cars" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND ("admins"."is_super_admin" = true)))));



CREATE POLICY "Super admins can view all activity logs" ON "public"."admin_activity_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND ("admins"."is_super_admin" = true)))));



CREATE POLICY "Super admins can view all sessions" ON "public"."admin_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND ("admins"."is_super_admin" = true)))));



CREATE POLICY "Super admins can view audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true)))));



CREATE POLICY "Super admins manage capabilities" ON "public"."admin_capabilities" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."id" = "auth"."uid"()) AND ("a"."is_super_admin" = true)))));



CREATE POLICY "System can create claim activities" ON "public"."insurance_claim_activities" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create insurance policies during booking" ON "public"."insurance_policies" FOR INSERT WITH CHECK (("renter_id" = "auth"."uid"()));



CREATE POLICY "System can insert bypass logs" ON "public"."verification_bypass_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



COMMENT ON POLICY "System can insert notifications" ON "public"."notifications" IS 'Allows the backend system to create notifications for users';



CREATE POLICY "System can update policy status" ON "public"."insurance_policies" FOR UPDATE USING ((("renter_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Users can access file encryption data for their messages" ON "public"."file_encryption" USING ((EXISTS ( SELECT 1
   FROM ("public"."conversation_messages" "cm"
     JOIN "public"."conversation_participants" "cp" ON (("cm"."conversation_id" = "cp"."conversation_id")))
  WHERE (("cm"."id" = "file_encryption"."message_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can add images to their own cars" ON "public"."car_images" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_images"."car_id") AND ("cars"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can add reactions to messages they can see" ON "public"."message_reactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."conversation_messages" "cm"
     JOIN "public"."conversation_participants" "cp" ON (("cm"."conversation_id" = "cp"."conversation_id")))
  WHERE (("cm"."id" = "message_reactions"."message_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "renter_id"));



CREATE POLICY "Users can create bypass sessions" ON "public"."verification_bypass_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create condition reports for their handovers" ON "public"."vehicle_condition_reports" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."handover_sessions" "hs"
  WHERE (("hs"."id" = "vehicle_condition_reports"."handover_session_id") AND (("hs"."host_id" = "auth"."uid"()) OR ("hs"."renter_id" = "auth"."uid"()))))) AND ("reporter_id" = "auth"."uid"())));



CREATE POLICY "Users can create handover sessions for their bookings" ON "public"."handover_sessions" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "bookings"."renter_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "handover_sessions"."booking_id")
UNION
 SELECT "profiles"."id"
   FROM (("public"."profiles"
     JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
     JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
  WHERE ("bookings"."id" = "handover_sessions"."booking_id"))));



CREATE POLICY "Users can create handover steps for their sessions" ON "public"."handover_step_completion" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "handover_step_completion"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can create identity checks for their handovers" ON "public"."identity_verification_checks" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."handover_sessions" "hs"
  WHERE (("hs"."id" = "identity_verification_checks"."handover_session_id") AND (("hs"."host_id" = "auth"."uid"()) OR ("hs"."renter_id" = "auth"."uid"()))))) AND ("verifier_id" = "auth"."uid"())));



CREATE POLICY "Users can create identity verification checks for their handove" ON "public"."identity_verification_checks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "identity_verification_checks"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can create own address verification" ON "public"."verification_address" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "uv"."user_id"
   FROM "public"."user_verifications" "uv"
  WHERE ("uv"."id" = "verification_address"."verification_id"))));



CREATE POLICY "Users can create own phone verification" ON "public"."phone_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own verification" ON "public"."user_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "reviews"."booking_id") AND ("bookings"."status" = 'completed'::"public"."booking_status") AND ((("bookings"."renter_id" = "auth"."uid"()) AND ("reviews"."reviewer_id" = "auth"."uid"())) OR (EXISTS ( SELECT 1
           FROM "public"."cars"
          WHERE (("cars"."id" = "bookings"."car_id") AND ("cars"."owner_id" = "auth"."uid"()) AND ("reviews"."reviewer_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can create their own car listings" ON "public"."cars" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can create their own cars" ON "public"."cars" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can create their own payment transactions" ON "public"."payment_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own wallet" ON "public"."host_wallets" FOR INSERT WITH CHECK (("auth"."uid"() = "host_id"));



CREATE POLICY "Users can create vehicle condition reports for their bookings" ON "public"."vehicle_condition_reports" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     LEFT JOIN "public"."cars" "c" ON (("b"."car_id" = "c"."id")))
  WHERE (("b"."id" = "vehicle_condition_reports"."booking_id") AND (("b"."renter_id" = "auth"."uid"()) OR ("c"."owner_id" = "auth"."uid"()))))) AND ("reporter_id" = "auth"."uid"())));



CREATE POLICY "Users can create wallet transactions" ON "public"."wallet_transactions" FOR INSERT WITH CHECK (("wallet_id" IN ( SELECT "host_wallets"."id"
   FROM "public"."host_wallets"
  WHERE ("host_wallets"."host_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own address verification" ON "public"."verification_address" FOR DELETE USING (("auth"."uid"() IN ( SELECT "uv"."user_id"
   FROM "public"."user_verifications" "uv"
  WHERE ("uv"."id" = "verification_address"."verification_id"))));



CREATE POLICY "Users can delete own documents" ON "public"."verification_documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own phone verification" ON "public"."phone_verifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own tutorial progress" ON "public"."user_tutorial_progress" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own verification" ON "public"."user_verifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own car images" ON "public"."car_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "car_images"."car_id") AND ("cars"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own car listings" ON "public"."cars" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete their own device tokens" ON "public"."device_tokens" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own messages" ON "public"."conversation_messages" FOR DELETE TO "authenticated" USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own reviews" ON "public"."reviews" FOR DELETE USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own saved cars" ON "public"."saved_cars" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."conversation_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own progress" ON "public"."user_guide_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tutorial progress" ON "public"."user_tutorial_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert reviews for their bookings" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "reviews"."booking_id") AND ("b"."renter_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."cars" "c" ON (("b"."car_id" = "c"."id")))
  WHERE (("b"."id" = "reviews"."booking_id") AND ("c"."owner_id" = "auth"."uid"())))))));



CREATE POLICY "Users can insert their own device tokens" ON "public"."device_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own license verification" ON "public"."license_verifications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own notification preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own promo usage" ON "public"."promo_code_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own saved cars" ON "public"."saved_cars" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage handover steps for their sessions" ON "public"."handover_step_completion" USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions" "hs"
  WHERE (("hs"."id" = "handover_step_completion"."handover_session_id") AND (("hs"."host_id" = "auth"."uid"()) OR ("hs"."renter_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage their own device tokens" ON "public"."device_tokens" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own identity keys" ON "public"."identity_keys" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own location data" ON "public"."locations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own pre-keys" ON "public"."pre_keys" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own public key" ON "public"."user_public_keys" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own push subscriptions" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own sessions" ON "public"."signal_sessions" USING ((("user_id" = "auth"."uid"()) OR ("contact_user_id" = "auth"."uid"())));



CREATE POLICY "Users can mark own notifications as read" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK (("is_read" = true));



CREATE POLICY "Users can read all identity keys" ON "public"."identity_keys" FOR SELECT USING (true);



CREATE POLICY "Users can read all public keys" ON "public"."user_public_keys" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read own progress" ON "public"."user_guide_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own tutorial progress" ON "public"."user_tutorial_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read unused pre-keys" ON "public"."pre_keys" FOR SELECT USING (("is_used" = false));



CREATE POLICY "Users can remove their own reactions" ON "public"."message_reactions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can save cars" ON "public"."saved_cars" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit claims for their active policies" ON "public"."insurance_claims" FOR INSERT WITH CHECK ((("renter_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."insurance_policies"
  WHERE (("insurance_policies"."id" = "insurance_claims"."policy_id") AND ("insurance_policies"."renter_id" = "auth"."uid"()) AND ("insurance_policies"."status" = ANY (ARRAY['active'::"text", 'expired'::"text"])))))));



CREATE POLICY "Users can unsave cars" ON "public"."saved_cars" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update bookings they are involved with" ON "public"."bookings" FOR UPDATE USING ((("auth"."uid"() = "renter_id") OR (EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."id" = "bookings"."car_id") AND ("cars"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update handover steps for their sessions" ON "public"."handover_step_completion" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "handover_step_completion"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can update identity verification checks for their handove" ON "public"."identity_verification_checks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "identity_verification_checks"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can update own address verification" ON "public"."verification_address" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "uv"."user_id"
   FROM "public"."user_verifications" "uv"
  WHERE ("uv"."id" = "verification_address"."verification_id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "uv"."user_id"
   FROM "public"."user_verifications" "uv"
  WHERE ("uv"."id" = "verification_address"."verification_id"))));



CREATE POLICY "Users can update own bypass sessions" ON "public"."verification_bypass_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own documents" ON "public"."verification_documents" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own phone verification" ON "public"."phone_verifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."user_guide_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own verification" ON "public"."user_verifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."bookings" FOR UPDATE USING (("auth"."uid"() = "renter_id"));



CREATE POLICY "Users can update their own car listings" ON "public"."cars" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update their own condition reports" ON "public"."vehicle_condition_reports" FOR UPDATE USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own device tokens" ON "public"."device_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own documents" ON "public"."documents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own handover sessions" ON "public"."handover_sessions" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "bookings"."renter_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "handover_sessions"."booking_id")
UNION
 SELECT "profiles"."id"
   FROM (("public"."profiles"
     JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
     JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
  WHERE ("bookings"."id" = "handover_sessions"."booking_id"))));



CREATE POLICY "Users can update their own license verification" ON "public"."license_verifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notification preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own reviews" ON "public"."reviews" FOR UPDATE USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own submitted claims" ON "public"."insurance_claims" FOR UPDATE USING ((("renter_id" = "auth"."uid"()) AND ("status" = 'submitted'::"text")));



CREATE POLICY "Users can update vehicle condition reports for their bookings" ON "public"."vehicle_condition_reports" FOR UPDATE USING (("reporter_id" = "auth"."uid"())) WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can upload own documents" ON "public"."verification_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can upload their own documents" ON "public"."documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view activities for their claims" ON "public"."insurance_claim_activities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."insurance_claims"
  WHERE (("insurance_claims"."id" = "insurance_claim_activities"."claim_id") AND ("insurance_claims"."renter_id" = "auth"."uid"())))));



CREATE POLICY "Users can view condition reports for their handovers" ON "public"."vehicle_condition_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions" "hs"
  WHERE (("hs"."id" = "vehicle_condition_reports"."handover_session_id") AND (("hs"."host_id" = "auth"."uid"()) OR ("hs"."renter_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view handover steps for their sessions" ON "public"."handover_step_completion" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "handover_step_completion"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can view identity checks for their handovers" ON "public"."identity_verification_checks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions" "hs"
  WHERE (("hs"."id" = "identity_verification_checks"."handover_session_id") AND (("hs"."host_id" = "auth"."uid"()) OR ("hs"."renter_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view identity verification checks for their handover " ON "public"."identity_verification_checks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."handover_sessions"
  WHERE (("handover_sessions"."id" = "identity_verification_checks"."handover_session_id") AND ("auth"."uid"() IN ( SELECT "bookings"."renter_id"
           FROM "public"."bookings"
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")
        UNION
         SELECT "profiles"."id"
           FROM (("public"."profiles"
             JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
             JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
          WHERE ("bookings"."id" = "handover_sessions"."booking_id")))))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."conversation_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "conversation_messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own address verification" ON "public"."verification_address" FOR SELECT USING (("auth"."uid"() IN ( SELECT "uv"."user_id"
   FROM "public"."user_verifications" "uv"
  WHERE ("uv"."id" = "verification_address"."verification_id"))));



COMMENT ON POLICY "Users can view own address verification" ON "public"."verification_address" IS 'Allow authenticated users to view their own address verification records';



CREATE POLICY "Users can view own bypass logs" ON "public"."verification_bypass_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own bypass sessions" ON "public"."verification_bypass_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own documents" ON "public"."verification_documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "Users can view own documents" ON "public"."verification_documents" IS 'Allow authenticated users to view their own uploaded documents';



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own phone verification" ON "public"."phone_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "Users can view own phone verification" ON "public"."phone_verifications" IS 'Allow authenticated users to view their own phone verification records';



CREATE POLICY "Users can view own verification" ON "public"."user_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "Users can view own verification" ON "public"."user_verifications" IS 'Allow authenticated users to view their own verification records';



CREATE POLICY "Users can view published reviews" ON "public"."reviews" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Users can view reactions for messages they can see" ON "public"."message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."conversation_messages" "cm"
     JOIN "public"."conversation_participants" "cp" ON (("cm"."conversation_id" = "cp"."conversation_id")))
  WHERE (("cm"."id" = "message_reactions"."message_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view system-wide notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'system_wide'::"public"."notification_role")));



COMMENT ON POLICY "Users can view system-wide notifications" ON "public"."notifications" IS 'Allows users to view notifications with system_wide role_target';



CREATE POLICY "Users can view their own auth tokens" ON "public"."auth_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "renter_id"));



CREATE POLICY "Users can view their own claims" ON "public"."insurance_claims" FOR SELECT USING (("renter_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own device tokens" ON "public"."device_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own documents" ON "public"."documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own handover sessions" ON "public"."handover_sessions" FOR SELECT USING (("auth"."uid"() IN ( SELECT "bookings"."renter_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "handover_sessions"."booking_id")
UNION
 SELECT "profiles"."id"
   FROM (("public"."profiles"
     JOIN "public"."cars" ON (("profiles"."id" = "cars"."owner_id")))
     JOIN "public"."bookings" ON (("cars"."id" = "bookings"."car_id")))
  WHERE ("bookings"."id" = "handover_sessions"."booking_id"))));



CREATE POLICY "Users can view their own insurance policies" ON "public"."insurance_policies" FOR SELECT USING (("renter_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own license verification" ON "public"."license_verifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own notification preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment transactions" ON "public"."payment_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own promo usage" ON "public"."promo_code_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reviews" ON "public"."reviews" FOR SELECT USING ((("reviewer_id" = "auth"."uid"()) OR ("reviewee_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own reviews and booking reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("reviewer_id" = "auth"."uid"()) OR ("reviewee_id" = "auth"."uid"()) OR ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "reviews"."booking_id") AND ("b"."renter_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."cars" "c" ON (("b"."car_id" = "c"."id")))
  WHERE (("b"."id" = "reviews"."booking_id") AND ("c"."owner_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can view their own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own saved cars" ON "public"."saved_cars" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wallet" ON "public"."host_wallets" FOR SELECT USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Users can view their wallet transactions" ON "public"."wallet_transactions" FOR SELECT USING (("wallet_id" IN ( SELECT "host_wallets"."id"
   FROM "public"."host_wallets"
  WHERE ("host_wallets"."host_id" = "auth"."uid"()))));



CREATE POLICY "Users can view vehicle condition reports for their bookings" ON "public"."vehicle_condition_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     LEFT JOIN "public"."cars" "c" ON (("b"."car_id" = "c"."id")))
  WHERE (("b"."id" = "vehicle_condition_reports"."booking_id") AND (("b"."renter_id" = "auth"."uid"()) OR ("c"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Users view their own payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "payer_id"));



CREATE POLICY "Users view their own selections" ON "public"."policy_selections" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "selected_by"));



ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_capabilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_manage_expiration_policies" ON "public"."notification_expiration_policies" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_read_cleanup_log" ON "public"."notification_cleanup_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."admin_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins_read_policy_final" ON "public"."admins" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_read_expiration_policies" ON "public"."notification_expiration_policies" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_posts_authenticated_delete_own" ON "public"."blog_posts" FOR DELETE TO "authenticated" USING ((("author_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "blog_posts_authenticated_insert_own" ON "public"."blog_posts" FOR INSERT TO "authenticated" WITH CHECK ((("author_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "blog_posts_authenticated_update_own" ON "public"."blog_posts" FOR UPDATE TO "authenticated" USING ((("author_email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))) WITH CHECK ((("author_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "blog_posts_author_select_own" ON "public"."blog_posts" FOR SELECT TO "authenticated" USING ((("author_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "blog_posts_published_select" ON "public"."blog_posts" FOR SELECT USING (((("status")::"text" = 'published'::"text") AND ("published_at" IS NOT NULL) AND ("published_at" <= "now"())));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_delivery_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_delivery_logs_admin_all" ON "public"."campaign_delivery_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "campaign_delivery_logs_user_read" ON "public"."campaign_delivery_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."car_blocked_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commission_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_messages_delete_policy" ON "public"."conversation_messages" FOR DELETE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "conversation_messages_insert_policy" ON "public"."conversation_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND "public"."is_conversation_participant"("conversation_id")));



CREATE POLICY "conversation_messages_select_policy" ON "public"."conversation_messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR "public"."is_conversation_participant"("conversation_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "conversation_messages_update_policy" ON "public"."conversation_messages" FOR UPDATE USING (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_participants_select_policy" ON "public"."conversation_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_conversation_participant"("conversation_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "conversation_participants_update_policy" ON "public"."conversation_participants" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_select_policy" ON "public"."conversations" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR "public"."is_conversation_participant"("id") OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."device_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_analytics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_delivery_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_suppressions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."file_encryption" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."handover_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."handover_step_completion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."host_wallets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hosts_view_host_only_notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'host_only'::"public"."notification_role") AND ((("related_car_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "cars"."owner_id"
   FROM "public"."cars"
  WHERE ("cars"."id" = "notifications"."related_car_id")))) OR (("related_booking_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "c"."owner_id"
   FROM ("public"."cars" "c"
     JOIN "public"."bookings" "b" ON (("c"."id" = "b"."car_id")))
  WHERE ("b"."id" = "notifications"."related_booking_id")))) OR (("related_car_id" IS NULL) AND ("related_booking_id" IS NULL)))));



COMMENT ON POLICY "hosts_view_host_only_notifications" ON "public"."notifications" IS 'Allows car owners to view host-only notifications related to their cars or bookings';



ALTER TABLE "public"."identity_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."identity_verification_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_claim_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."license_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_cleanup_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_expiration_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_policy" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_insert_policy" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "notifications_select_policy" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_update_policy" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."payment_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payout_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pending_confirmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_own_delete" ON "public"."profiles" FOR DELETE USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_own_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_own_read" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_own_update" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_public_car_owner_read" ON "public"."profiles" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."cars"
  WHERE (("cars"."owner_id" = "profiles"."id") AND ("cars"."is_available" = true)))));



CREATE POLICY "profiles_read_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "profiles_read_all" ON "public"."profiles" IS 'Allows all authenticated users to read profile information';



ALTER TABLE "public"."promo_code_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_health_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_time_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "renters_view_renter_only_notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'renter_only'::"public"."notification_role") AND ((("related_booking_id" IS NOT NULL) AND ("auth"."uid"() = ( SELECT "bookings"."renter_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "notifications"."related_booking_id")))) OR ("related_booking_id" IS NULL))));



COMMENT ON POLICY "renters_view_renter_only_notifications" ON "public"."notifications" IS 'Allows renters to view renter-only notifications related to their bookings';



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_cars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."signal_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_guide_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_public_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_restrictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tutorial_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_verifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_view_system_wide_notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("role_target" = 'system_wide'::"public"."notification_role")));



COMMENT ON POLICY "users_view_system_wide_notifications" ON "public"."notifications" IS 'Allows users to view notifications with system_wide role_target';



ALTER TABLE "public"."vehicle_condition_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_bypass_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_bypass_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view_conversation_peers" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING ("public"."is_participant"("conversation_id"));



CREATE POLICY "view_conversations_as_participant" ON "public"."conversations" FOR SELECT TO "authenticated" USING ("public"."is_participant"("id"));



CREATE POLICY "view_own_participation" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawal_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "archive"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cars";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."handover_sessions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."handover_step_completion";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."identity_verification_checks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message_reactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."phone_verifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_verifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."vehicle_condition_reports";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."verification_documents";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."message_delivery_status" TO "authenticated";


























































































































































































GRANT ALL ON FUNCTION "public"."add_conversation_creator_as_participant"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_conversation_creator_as_participant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_conversation_creator_as_participant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_handover_step"("p_session_id" "uuid", "p_completed_step_name" "text", "p_user_id" "uuid", "p_user_role" "text", "p_completion_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."advance_handover_step"("p_session_id" "uuid", "p_completed_step_name" "text", "p_user_id" "uuid", "p_user_role" "text", "p_completion_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_handover_step"("p_session_id" "uuid", "p_completed_step_name" "text", "p_user_id" "uuid", "p_user_role" "text", "p_completion_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_conversation_query_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_conversation_query_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_conversation_query_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_user_role_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_user_role_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_user_role_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_uid_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_uid_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_uid_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_car_rating"("car_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_car_rating"("car_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_car_rating"("car_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_category_ratings"("p_car_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_category_ratings"("p_car_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_category_ratings"("p_car_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_commission"("booking_total" numeric, "rate" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_commission"("booking_total" numeric, "rate" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_commission"("booking_total" numeric, "rate" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_handover_progress"("handover_session_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_handover_progress"("handover_session_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_handover_progress"("handover_session_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_renter_category_ratings"("p_renter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_renter_category_ratings"("p_renter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_renter_category_ratings"("p_renter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_rating"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_rating"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_rating"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_circular_reply"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_circular_reply"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_circular_reply"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_circular_reply_conversation"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_circular_reply_conversation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_circular_reply_conversation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_host_wallet_balance"("host_uuid" "uuid", "required_commission" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."check_host_wallet_balance"("host_uuid" "uuid", "required_commission" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_host_wallet_balance"("host_uuid" "uuid", "required_commission" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_verification_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_verification_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_verification_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_verification_completion"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_verification_completion"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_verification_completion"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_expired_locations"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_expired_locations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_expired_locations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_admin_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_admin_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_admin_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_bypass_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_bypass_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_bypass_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_confirmations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_confirmations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_confirmations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications_enhanced"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications_enhanced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications_enhanced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_verification_temp"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_verification_temp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_verification_temp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_notification"("p_booking_id" "uuid", "p_renter_notification_type" "public"."notification_type", "p_host_notification_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_check_column_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_check_column_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_check_column_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_claim_notification"("p_user_id" "uuid", "p_claim_number" "text", "p_status" "text", "p_is_new_claim" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_secure"("p_title" "text", "p_type" "text", "p_participant_ids" "uuid"[], "p_created_by_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_secure"("p_title" "text", "p_type" "text", "p_participant_ids" "uuid"[], "p_created_by_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_secure"("p_title" "text", "p_type" "text", "p_participant_ids" "uuid"[], "p_created_by_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_with_participants"("p_created_by" "uuid", "p_participant_ids" "uuid"[], "p_title" "text", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_with_participants"("p_created_by" "uuid", "p_participant_ids" "uuid"[], "p_title" "text", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_with_participants"("p_created_by" "uuid", "p_participant_ids" "uuid"[], "p_title" "text", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_booking_id" "uuid", "p_handover_type" "text", "p_location" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_booking_id" "uuid", "p_handover_type" "text", "p_location" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_booking_id" "uuid", "p_handover_type" "text", "p_location" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_handover_type" "text", "p_car_brand" "text", "p_car_model" "text", "p_location" "text", "p_status" "text", "p_step_name" "text", "p_progress_percentage" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_handover_type" "text", "p_car_brand" "text", "p_car_model" "text", "p_location" "text", "p_status" "text", "p_step_name" "text", "p_progress_percentage" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_handover_notification"("p_user_id" "uuid", "p_handover_type" "text", "p_car_brand" "text", "p_car_model" "text", "p_location" "text", "p_status" "text", "p_step_name" "text", "p_progress_percentage" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_handover_progress_notification"("p_handover_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_handover_step_notification"("p_handover_session_id" "uuid", "p_step_name" "text", "p_completed_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_message_notification"("p_recipient_id" "uuid", "p_sender_name" "text", "p_message_preview" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_message_notification"("p_recipient_id" "uuid", "p_sender_name" "text", "p_message_preview" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_message_notification"("p_recipient_id" "uuid", "p_sender_name" "text", "p_message_preview" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_navigation_notification"("p_booking_id" "uuid", "p_notification_type" "text", "p_user_id" "uuid", "p_location_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_campaign"("p_campaign_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_campaign"("p_campaign_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_campaign"("p_campaign_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_content" "text", "p_role_target" "public"."notification_role", "p_related_booking_id" "uuid", "p_related_car_id" "uuid", "p_related_user_id" "uuid", "p_priority" integer, "p_metadata" "jsonb", "p_custom_expiration_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_content" "text", "p_role_target" "public"."notification_role", "p_related_booking_id" "uuid", "p_related_car_id" "uuid", "p_related_user_id" "uuid", "p_priority" integer, "p_metadata" "jsonb", "p_custom_expiration_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_with_expiration"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_content" "text", "p_role_target" "public"."notification_role", "p_related_booking_id" "uuid", "p_related_car_id" "uuid", "p_related_user_id" "uuid", "p_priority" integer, "p_metadata" "jsonb", "p_custom_expiration_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_notification"("p_user_id" "uuid", "p_payment_type" "text", "p_amount" numeric, "p_booking_id" "uuid", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_notification"("p_user_id" "uuid", "p_payment_type" "text", "p_amount" numeric, "p_booking_id" "uuid", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_notification"("p_user_id" "uuid", "p_payment_type" "text", "p_amount" numeric, "p_booking_id" "uuid", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_renter_arrival_notification"("p_booking_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_title" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_host_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_host_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_host_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_wallet_transaction_id" "uuid", "p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "anon";
GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_wallet_transaction_id" "uuid", "p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_wallet_notification"("p_wallet_transaction_id" "uuid", "p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_description" "text", "p_metadata" "jsonb", "p_role_target" "public"."notification_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."credit_pending_earnings"("p_booking_id" "uuid", "p_host_earnings" numeric, "p_platform_commission" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."credit_pending_earnings"("p_booking_id" "uuid", "p_host_earnings" numeric, "p_platform_commission" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."credit_pending_earnings"("p_booking_id" "uuid", "p_host_earnings" numeric, "p_platform_commission" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_message_content"("p_cipher" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_message_content"("p_cipher" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_message_content"("p_cipher" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_notifications"("p_days_old" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_notifications"("p_days_old" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_notifications"("p_days_old" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_message_content"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_message_content"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_message_content"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_step_dependencies"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_step_dependencies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_step_dependencies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_conversation_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_conversation_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_conversation_integrity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_insurance_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_insurance_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_insurance_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_unpaid_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_unpaid_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_unpaid_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_audit_hash"("event_type" "public"."audit_event_type", "actor_id" "uuid", "target_id" "uuid", "action_details" "jsonb", "event_timestamp" timestamp with time zone, "previous_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_audit_hash"("event_type" "public"."audit_event_type", "actor_id" "uuid", "target_id" "uuid", "action_details" "jsonb", "event_timestamp" timestamp with time zone, "previous_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_audit_hash"("event_type" "public"."audit_event_type", "actor_id" "uuid", "target_id" "uuid", "action_details" "jsonb", "event_timestamp" timestamp with time zone, "previous_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_claim_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_policy_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_policy_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_policy_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bypass_statistics"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_bypass_statistics"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bypass_statistics"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campaign_analytics"("p_campaign_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_campaign_analytics"("p_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campaign_analytics"("p_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_encryption_key"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_encryption_key"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_encryption_key"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marketing_recipients"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_marketing_recipients"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marketing_recipients"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notification_expiration_info"("p_notification_type" "public"."notification_type") TO "anon";
GRANT ALL ON FUNCTION "public"."get_notification_expiration_info"("p_notification_type" "public"."notification_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notification_expiration_info"("p_notification_type" "public"."notification_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_profile"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_profile"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_profile"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reply_chain"("p_message_id" "uuid", "p_max_depth" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reply_counts"("conversation_id_param" "uuid", "message_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_page" integer, "p_page_size" integer, "p_search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_page" integer, "p_page_size" integer, "p_search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_page" integer, "p_page_size" integer, "p_search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_email_for_notification"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_email_for_notification"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_email_for_notification"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_page" integer, "p_page_size" integer, "p_only_unread" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_page" integer, "p_page_size" integer, "p_only_unread" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_page" integer, "p_page_size" integer, "p_only_unread" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_push_subscriptions"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_push_subscriptions"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_push_subscriptions"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_review_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_booking_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_booking_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_booking_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_handover_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_handover_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_handover_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_handover_step_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_handover_step_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_handover_step_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."handle_new_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_restrictions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_restrictions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_restrictions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_bypass_session"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_active_bypass_session"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_bypass_session"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_car_view_count"("car_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_car_view_count"("car_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_car_view_count"("car_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_promo_code_uses"("promo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_promo_code_uses"("promo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_promo_code_uses"("promo_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_conversation"("p_title" "text", "p_type" character varying, "p_participant_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_conversation"("p_title" "text", "p_type" character varying, "p_participant_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_conversation"("p_title" "text", "p_type" character varying, "p_participant_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_admin"("_conversation_id" "uuid", "_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_admin"("_conversation_id" "uuid", "_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_admin"("_conversation_id" "uuid", "_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_creator"("_conversation_id" "uuid", "_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_creator"("_conversation_id" "uuid", "_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_creator"("_conversation_id" "uuid", "_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid", "_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid", "_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("_conversation_id" "uuid", "_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_participant_secure"("conversation_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_participant_secure"("conversation_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_participant_secure"("conversation_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_participant"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_participant"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_participant"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_profile_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_profile_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_profile_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin_from_admins"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin_from_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin_from_admins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "text", "p_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_admin_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "public"."audit_event_type", "p_severity" "public"."audit_severity", "p_actor_id" "uuid", "p_target_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_location_data" "jsonb", "p_action_details" "jsonb", "p_resource_type" "text", "p_resource_id" "uuid", "p_reason" "text", "p_anomaly_flags" "jsonb", "p_compliance_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "public"."audit_event_type", "p_severity" "public"."audit_severity", "p_actor_id" "uuid", "p_target_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_location_data" "jsonb", "p_action_details" "jsonb", "p_resource_type" "text", "p_resource_id" "uuid", "p_reason" "text", "p_anomaly_flags" "jsonb", "p_compliance_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_event_type" "public"."audit_event_type", "p_severity" "public"."audit_severity", "p_actor_id" "uuid", "p_target_id" "uuid", "p_session_id" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_location_data" "jsonb", "p_action_details" "jsonb", "p_resource_type" "text", "p_resource_id" "uuid", "p_reason" "text", "p_anomaly_flags" "jsonb", "p_compliance_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bypass_session_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_bypass_session_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bypass_session_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bypass_session_deactivation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_bypass_session_deactivation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bypass_session_deactivation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bypass_session_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_bypass_session_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bypass_session_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_notification_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_notification_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_notification_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_audit_log_modification"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_audit_log_modification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_audit_log_modification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_due_earnings_releases"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_due_earnings_releases"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_due_earnings_releases"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_withdrawal_request"("p_host_id" "uuid", "p_amount" numeric, "p_payout_method" character varying, "p_payout_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_withdrawal_request"("p_host_id" "uuid", "p_amount" numeric, "p_payout_method" character varying, "p_payout_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_withdrawal_request"("p_host_id" "uuid", "p_amount" numeric, "p_payout_method" character varying, "p_payout_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_pending_earnings"("p_booking_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."release_pending_earnings"("p_booking_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_pending_earnings"("p_booking_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_admin_complete"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_admin_complete"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_admin_complete"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_message_operation"() TO "anon";
GRANT ALL ON FUNCTION "public"."remove_message_operation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_message_operation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."save_push_subscription"("p_user_id" "uuid", "p_endpoint" "text", "p_p256dh_key" "text", "p_auth_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."save_push_subscription"("p_user_id" "uuid", "p_endpoint" "text", "p_p256dh_key" "text", "p_auth_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_push_subscription"("p_user_id" "uuid", "p_endpoint" "text", "p_p256dh_key" "text", "p_auth_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text", "p_related_car_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text", "p_related_car_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_conversation_message"("p_conversation_id" "uuid", "p_content" "text", "p_message_type" "text", "p_related_car_id" "uuid", "p_reply_to_message_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_message_operation"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_message_operation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_message_operation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_verification_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_verification_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_verification_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_message_reaction"("p_message_id" "uuid", "p_emoji" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_message_reaction"("p_message_id" "uuid", "p_emoji" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_message_reaction"("p_message_id" "uuid", "p_emoji" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_cleanup_expired_confirmations"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_cleanup_expired_confirmations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_cleanup_expired_confirmations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_role"("target_user_id" "uuid", "new_is_super_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_role"("target_user_id" "uuid", "new_is_super_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_role"("target_user_id" "uuid", "new_is_super_admin" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_campaign_delivery_logs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_campaign_delivery_logs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_campaign_delivery_logs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_handover_session_on_step_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_handover_session_on_step_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_handover_session_on_step_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_insurance_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_insurance_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_insurance_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_message_delivery_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_message_delivery_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message_delivery_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_message_operations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_message_operations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message_operations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_expiration_policy"("p_notification_type" "public"."notification_type", "p_expiration_hours" integer, "p_auto_cleanup_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_expiration_policy"("p_notification_type" "public"."notification_type", "p_expiration_hours" integer, "p_auto_cleanup_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_expiration_policy"("p_notification_type" "public"."notification_type", "p_expiration_hours" integer, "p_auto_cleanup_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_location"("user_id" "uuid", "lat" numeric, "lng" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_location"("user_id" "uuid", "lat" numeric, "lng" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_location"("user_id" "uuid", "lat" numeric, "lng" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_public_keys_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_public_keys_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_public_keys_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_verification_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_verification_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_verification_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_verification_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_verification_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_verification_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_verification_step"("user_uuid" "uuid", "new_step" "public"."verification_step") TO "anon";
GRANT ALL ON FUNCTION "public"."update_verification_step"("user_uuid" "uuid", "new_step" "public"."verification_step") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_verification_step"("user_uuid" "uuid", "new_step" "public"."verification_step") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_verification"("verification_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_campaign_audience"("p_user_roles" "text"[], "p_registration_start" timestamp with time zone, "p_registration_end" timestamp with time zone, "p_last_login_days" integer, "p_booking_count_min" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_campaign_audience"("p_user_roles" "text"[], "p_registration_start" timestamp with time zone, "p_registration_end" timestamp with time zone, "p_last_login_days" integer, "p_booking_count_min" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_campaign_audience"("p_user_roles" "text"[], "p_registration_start" timestamp with time zone, "p_registration_end" timestamp with time zone, "p_last_login_days" integer, "p_booking_count_min" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_car_verification_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_car_verification_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_car_verification_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_conversation_access"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_conversation_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_conversation_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_conversation_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_step_dependencies"("handover_session_id_param" "uuid", "step_order_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_audit_chain_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_audit_chain_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_audit_chain_integrity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_conversation_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_conversation_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_conversation_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_no_recursion_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_no_recursion_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_no_recursion_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_no_recursive_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_no_recursive_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_no_recursive_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."wallet_topup"("p_amount" numeric, "p_payment_method" "text", "p_payment_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."wallet_topup"("p_amount" numeric, "p_payment_method" "text", "p_payment_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallet_topup"("p_amount" numeric, "p_payment_method" "text", "p_payment_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."wallet_withdraw"("p_amount" numeric, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."wallet_withdraw"("p_amount" numeric, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallet_withdraw"("p_amount" numeric, "p_description" "text") TO "service_role";












GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages" TO "service_role";



GRANT SELECT("replying_to_message_id") ON TABLE "archive"."messages" TO "anon";
GRANT SELECT("replying_to_message_id"),UPDATE("replying_to_message_id") ON TABLE "archive"."messages" TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages_backup_20250930_093926" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages_backup_20250930_093926" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."messages_backup_20250930_093926" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."notifications_backup" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."notifications_backup" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "archive"."notifications_backup" TO "service_role";





















GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_activity_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_activity_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_activity_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_capabilities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_capabilities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_capabilities" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admin_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admins" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admins" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."admins" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_analytics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_analytics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_analytics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."auth_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."auth_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."auth_tokens" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."blog_posts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."blog_posts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."blog_posts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bookings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bookings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bookings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."campaign_delivery_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."campaign_delivery_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."campaign_delivery_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."car_blocked_dates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."car_blocked_dates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."car_blocked_dates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."car_images" TO "anon";
GRANT ALL ON TABLE "public"."car_images" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."car_images" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cars" TO "anon";
GRANT ALL ON TABLE "public"."cars" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cars" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."commission_rates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."commission_rates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."commission_rates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages_with_replies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages_with_replies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_messages_with_replies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversation_participants" TO "service_role";
GRANT SELECT ON TABLE "public"."conversation_participants" TO "anon";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."conversations" TO "service_role";
GRANT SELECT ON TABLE "public"."conversations" TO "anon";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."device_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."device_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."device_tokens" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_daily" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_daily" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_daily" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_summary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_analytics_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_delivery_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_delivery_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_delivery_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_performance_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_performance_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_performance_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_suppressions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_suppressions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_suppressions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_webhook_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_webhook_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."email_webhook_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."file_encryption" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."file_encryption" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."file_encryption" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."guides" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."guides" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."guides" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_step_completion" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_step_completion" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."handover_step_completion" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."host_wallets" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."host_wallets" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."host_wallets" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_keys" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_keys" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_keys" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_verification_checks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_verification_checks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."identity_verification_checks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claim_activities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claim_activities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claim_activities" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claims" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claims" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_claims" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_commission_rates" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_commission_rates" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_commission_rates" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_packages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_packages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_packages" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_policies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."insurance_policies" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."license_verifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."license_verifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."license_verifications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."locations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."message_reactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."message_reactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."message_reactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_campaigns" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_campaigns" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_campaigns" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_cleanup_log" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_cleanup_log" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_cleanup_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_cleanup_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_cleanup_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_cleanup_log_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_expiration_policies" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_expiration_policies" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_expiration_policies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_expiration_policies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_expiration_policies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_expiration_policies_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_preferences" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notification_preferences" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_config" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_config" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_config" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_transactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payment_transactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payout_details" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payout_details" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."payout_details" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pending_confirmations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pending_confirmations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pending_confirmations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phone_verifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phone_verifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phone_verifications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_selections" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_selections" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."policy_selections" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pre_keys" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pre_keys" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pre_keys" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."premium_remittance_batches" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."premium_remittance_batches" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."premium_remittance_batches" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_code_usage" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_code_usage" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_code_usage" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_codes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_codes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."promo_codes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_health_metrics" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_health_metrics" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_health_metrics" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_performance_summary" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_performance_summary" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."provider_performance_summary" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."rate_limits" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."rate_limits" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."rate_limits" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."real_time_locations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."real_time_locations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."real_time_locations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reviews" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reviews" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reviews" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."saved_cars" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."saved_cars" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."saved_cars" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."signal_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."signal_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."signal_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_guide_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_guide_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_guide_progress" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_public_keys" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_public_keys" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_public_keys" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_restrictions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_restrictions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_restrictions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_roles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_roles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_roles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tutorial_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tutorial_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_tutorial_progress" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_verifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_verifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_verifications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_condition_reports" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_condition_reports" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_condition_reports" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_transfers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_transfers" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vehicle_transfers" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_address" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_address" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_address" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_sessions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_sessions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_bypass_sessions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_documents" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_documents" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."verification_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wallet_transactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."withdrawal_requests" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."withdrawal_requests" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."withdrawal_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";
































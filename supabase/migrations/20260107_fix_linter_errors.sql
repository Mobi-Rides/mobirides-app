-- Migration: Fix Supabase Linter Errors
-- This migration fixes 16 function errors and 4 warnings identified by the linter
-- Date: 2026-01-07

-- =====================================================
-- SECTION 0: Ensure wallet_transactions.metadata column exists
-- =====================================================

-- Add metadata column to wallet_transactions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_transactions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- =====================================================
-- SECTION 1: Drop obsolete functions (user approved)
-- =====================================================

-- Drop legacy message migration functions (reference deleted messages table)
DROP FUNCTION IF EXISTS public.migrate_legacy_messages();
DROP FUNCTION IF EXISTS public.migrate_legacy_messages_to_conversations();

-- Drop cleanup_expired_tokens (references non-existent expires_at column)
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens();


-- =====================================================
-- SECTION 2: Fix check_column_exists (ambiguous table_name)
-- Must DROP first because we're renaming parameters
-- =====================================================

DROP FUNCTION IF EXISTS public.check_column_exists(text, text);

CREATE OR REPLACE FUNCTION public.check_column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
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


-- =====================================================
-- SECTION 3: Fix save_push_subscription (ambiguous user_id)
-- Must DROP first because we're renaming parameters
-- =====================================================

DROP FUNCTION IF EXISTS public.save_push_subscription(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.save_push_subscription(
  p_user_id uuid,
  p_endpoint text,
  p_p256dh_key text,
  p_auth_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.save_push_subscription(uuid, text, text, text) TO authenticated;


-- =====================================================
-- SECTION 4: Fix log_admin_activity (UUID cast for resource_id)
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

COMMENT ON FUNCTION public.log_admin_activity(UUID, TEXT, TEXT, TEXT, JSONB) IS 
  'RPC function to log admin activities. Fixed: properly casts resource_id to UUID.';


-- =====================================================
-- SECTION 5: Fix create_navigation_notification (generated column)
-- The notifications.content column is generated, so we cannot insert into it
-- =====================================================

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
    
    -- Insert notification WITHOUT the generated content column
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
    )
    ON CONFLICT (user_id, type, related_booking_id) 
    DO UPDATE SET 
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        created_at = NOW();
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create navigation notification: %', SQLERRM;
END;
$$;


-- =====================================================
-- SECTION 6: Fix create_notification_with_expiration (remove related_user_id)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification_with_expiration(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_role_target notification_role DEFAULT 'system_wide',
    p_related_booking_id UUID DEFAULT NULL,
    p_related_car_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL, -- Kept for API compatibility, but ignored
    p_priority INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}',
    p_custom_expiration_hours INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Validate priority range
    IF p_priority < 1 OR p_priority > 5 THEN
        RAISE EXCEPTION 'Priority must be between 1 and 5';
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
    
    -- Insert notification WITHOUT related_user_id (column doesn't exist)
    INSERT INTO public.notifications (
        user_id, type, title, description, role_target,
        related_booking_id, related_car_id,
        priority, metadata, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_role_target,
        p_related_booking_id, p_related_car_id,
        p_priority, p_metadata, expiration_timestamp
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification_with_expiration(uuid, notification_type, text, text, text, notification_role, uuid, uuid, uuid, integer, jsonb, integer) TO authenticated;


-- =====================================================
-- SECTION 7: Fix create_conversation_with_participants (use VARCHAR, not enum)
-- Must DROP first due to signature change
-- =====================================================

DROP FUNCTION IF EXISTS public.create_conversation_with_participants(uuid, uuid[], text, text);

CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  p_created_by uuid,
  p_participant_ids uuid[],
  p_title text DEFAULT NULL,
  p_type text DEFAULT 'direct'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants(uuid, uuid[], text, text) TO authenticated;


-- =====================================================
-- SECTION 8: Fix initialize_conversation (unnest reference in CASE)
-- Must DROP first due to return type change
-- =====================================================

DROP FUNCTION IF EXISTS public.initialize_conversation(text, character varying, uuid[]);

CREATE OR REPLACE FUNCTION public.initialize_conversation(
  p_title text,
  p_type character varying,
  p_participant_ids uuid[]
)
RETURNS TABLE(
  conversation_id uuid,
  participant_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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


-- =====================================================
-- SECTION 9: Fix verify_audit_chain_integrity (disambiguate event_timestamp)
-- Must DROP first due to return type column name change
-- =====================================================

DROP FUNCTION IF EXISTS public.verify_audit_chain_integrity();

CREATE OR REPLACE FUNCTION public.verify_audit_chain_integrity()
RETURNS TABLE(
    audit_id uuid,
    log_event_timestamp timestamptz,
    expected_hash text,
    actual_hash text,
    chain_valid boolean
) AS $$
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
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.verify_audit_chain_integrity() TO authenticated;


-- =====================================================
-- SECTION 10: Fix verify_no_recursive_policies (use correct pg_policies columns)
-- pg_policies has: schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- NOT 'definition'
-- Must DROP first due to return type change
-- =====================================================

DROP FUNCTION IF EXISTS public.verify_no_recursive_policies();

CREATE OR REPLACE FUNCTION public.verify_no_recursive_policies()
RETURNS TABLE(
    table_name text,
    policy_name text,
    policy_qual text,
    policy_with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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


-- =====================================================
-- SECTION 11: Fix get_user_conversations (disambiguate conversation_id)
-- Must DROP first due to return type column name change
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_conversations(integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_user_conversations(
    p_page integer DEFAULT 1,
    p_page_size integer DEFAULT 20,
    p_search_term text DEFAULT NULL
)
RETURNS TABLE(
    conv_id uuid,
    title text,
    conv_type varchar,
    last_message_at timestamptz,
    participants json,
    last_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_user_conversations(integer, integer, text) TO authenticated;


-- =====================================================
-- SECTION 12: Fix create_handover_progress_notification (b.user_id -> b.renter_id)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_handover_progress_notification(
    p_handover_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    session_record record;
    booking_record record;
    car_record record;
    progress_percentage integer;
    current_step text;
BEGIN
    -- Get handover session details with CORRECT column (renter_id, not user_id)
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
    
    -- Calculate progress (function may not exist, so use a default)
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_percentage;
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

GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO anon;


-- =====================================================
-- SECTION 13: Fix create_handover_step_notification (b.user_id -> b.renter_id)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_handover_step_notification(
    p_handover_session_id uuid,
    p_step_name text,
    p_completed_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    session_record record;
    car_record record;
    other_user_id uuid;
    progress_percentage integer;
BEGIN
    -- Get handover session details with CORRECT column (renter_id, not user_id)
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
    
    -- Calculate progress
    BEGIN
        SELECT calculate_handover_progress(p_handover_session_id) INTO progress_percentage;
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

GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO anon;


-- =====================================================
-- Migration completed
-- =====================================================

COMMENT ON FUNCTION public.check_column_exists(text, text) IS 'Fixed: renamed parameters to avoid ambiguity with information_schema columns';
COMMENT ON FUNCTION public.verify_no_recursive_policies() IS 'Fixed: uses qual and with_check columns instead of non-existent definition column';
COMMENT ON FUNCTION public.create_handover_progress_notification(uuid) IS 'Fixed: uses b.renter_id instead of non-existent b.user_id';
COMMENT ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) IS 'Fixed: uses b.renter_id instead of non-existent b.user_id';

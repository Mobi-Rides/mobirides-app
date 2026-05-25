-- Migration: Campaign broadcast enhancements
-- Description: Add detailed recipient selection support, audit joins constraint, correct filters on immediate send, and verify roles from both profiles and user_roles table.

-- 1. Safely add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'campaign_delivery_logs_user_id_fkey' AND table_name = 'campaign_delivery_logs'
  ) THEN
    ALTER TABLE public.campaign_delivery_logs
    ADD CONSTRAINT campaign_delivery_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Create the get_campaign_audience_details function
CREATE OR REPLACE FUNCTION public.get_campaign_audience_details(
  p_user_roles text[] DEFAULT NULL::text[],
  p_registration_start timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_registration_end timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_last_login_days integer DEFAULT NULL::integer,
  p_booking_count_min integer DEFAULT NULL::integer
) RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  bookings_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    u.email::TEXT,
    p.full_name,
    p.role::TEXT,
    p.created_at,
    u.last_sign_in_at,
    COALESCE((SELECT COUNT(*) FROM bookings WHERE renter_id = p.id), 0)::BIGINT AS bookings_count
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE 
    (
      p_user_roles IS NULL 
      OR p.role::TEXT = ANY(p_user_roles) 
      OR ur.role::TEXT = ANY(p_user_roles)
    )
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_last_login_days IS NULL OR u.last_sign_in_at >= NOW() - (p_last_login_days || ' days')::INTERVAL)
    AND (p_booking_count_min IS NULL OR (
      SELECT COUNT(*) FROM bookings WHERE renter_id = p.id
    ) >= p_booking_count_min);
END;
$$;

-- Grant permissions for get_campaign_audience_details
GRANT ALL ON FUNCTION public.get_campaign_audience_details(text[], timestamp with time zone, timestamp with time zone, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.get_campaign_audience_details(text[], timestamp with time zone, timestamp with time zone, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_campaign_audience_details(text[], timestamp with time zone, timestamp with time zone, integer, integer) TO service_role;

-- 3. Overwrite validate_campaign_audience to search both profiles and user_roles
CREATE OR REPLACE FUNCTION public.validate_campaign_audience(
  p_user_roles text[] DEFAULT NULL::text[],
  p_registration_start timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_registration_end timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_last_login_days integer DEFAULT NULL::integer,
  p_booking_count_min integer DEFAULT NULL::integer
) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Count matching users
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE 
    (
      p_user_roles IS NULL 
      OR p.role::TEXT = ANY(p_user_roles) 
      OR ur.role::TEXT = ANY(p_user_roles)
    )
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

-- 4. Overwrite create_notification_campaign to support individual selections and filter checks
CREATE OR REPLACE FUNCTION public.create_notification_campaign(p_campaign_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
      LEFT JOIN public.user_roles ur ON p.id = ur.user_id
      WHERE 
        -- If specific users are provided, only send to them
        (
          p_campaign_data->'selected_user_ids' IS NOT NULL 
          AND p.id::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'selected_user_ids')))
        )
        OR
        (
          p_campaign_data->'selected_user_ids' IS NULL
          AND (
            p_campaign_data->'user_roles' IS NULL 
            OR p.role::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles')))
            OR ur.role::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles')))
          )
          AND (p_campaign_data->>'registration_start' IS NULL OR p.created_at >= (p_campaign_data->>'registration_start')::TIMESTAMPTZ)
          AND (p_campaign_data->>'registration_end' IS NULL OR p.created_at <= (p_campaign_data->>'registration_end')::TIMESTAMPTZ)
          AND (p_campaign_data->>'last_login_days' IS NULL OR u.last_sign_in_at >= NOW() - ((p_campaign_data->>'last_login_days')::INTEGER || ' days')::INTERVAL)
          AND (p_campaign_data->>'booking_count_min' IS NULL OR (
            SELECT COUNT(*) FROM bookings WHERE renter_id = p.id
          ) >= (p_campaign_data->>'booking_count_min')::INTEGER)
        )
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

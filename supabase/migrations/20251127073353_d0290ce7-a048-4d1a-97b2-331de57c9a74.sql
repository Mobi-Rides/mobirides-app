-- Fix function return type conflict by dropping and recreating
-- This resolves the "cannot change return type of existing function" error

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_notification_campaign(jsonb);

-- Recreate with correct return type
CREATE OR REPLACE FUNCTION public.create_notification_campaign(p_campaign_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
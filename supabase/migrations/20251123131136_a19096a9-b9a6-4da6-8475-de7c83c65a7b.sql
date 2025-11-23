-- Function to create wallet notifications
CREATE OR REPLACE FUNCTION public.create_wallet_notification(
  p_host_id uuid,
  p_type text,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content text;
  v_notification_type public.notification_type;
BEGIN
  -- Generate content based on type
  CASE p_type
    WHEN 'topup' THEN
      v_content := 'Your wallet has been topped up with P' || p_amount::text;
      v_notification_type := 'wallet_topup';
    WHEN 'deduction' THEN
      v_content := 'P' || p_amount::text || ' commission deducted from your wallet';
      v_notification_type := 'wallet_deduction';
    WHEN 'payment_received' THEN
      v_content := 'Payment of P' || p_amount::text || ' received';
      v_notification_type := 'payment_received';
    ELSE
      v_content := COALESCE(p_description, 'Wallet transaction of P' || p_amount::text);
      v_notification_type := 'wallet_deduction';
  END CASE;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, 
    type, 
    title,
    description,
    is_read
  ) VALUES (
    p_host_id,
    v_notification_type,
    'Wallet Transaction',
    v_content,
    false
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create wallet notification: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_wallet_notification(uuid, text, numeric, text) TO authenticated;
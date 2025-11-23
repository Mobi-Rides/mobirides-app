-- Function to save push subscription
CREATE OR REPLACE FUNCTION public.save_push_subscription(
  user_id uuid,
  endpoint text,
  p256dh_key text,
  auth_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (user_id, endpoint, p256dh_key, auth_key)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    endpoint = EXCLUDED.endpoint,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    updated_at = now();
END;
$$;

-- Function to get user push subscriptions
CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(user_id uuid)
RETURNS TABLE(
  id uuid,
  endpoint text,
  p256dh text,
  auth text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = get_user_push_subscriptions.user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.save_push_subscription(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions(uuid) TO authenticated;
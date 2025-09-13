-- Create helper functions for push notifications to avoid type issues

-- Function to save push subscription
CREATE OR REPLACE FUNCTION public.save_push_subscription(
  user_id UUID,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT
) RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user push subscriptions
CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(user_id UUID)
RETURNS TABLE(
  id UUID,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = get_user_push_subscriptions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
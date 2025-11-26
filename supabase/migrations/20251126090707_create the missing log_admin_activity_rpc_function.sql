-- Create the missing log_admin_activity RPC function
-- This function is called by the application to log admin activities

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
BEGIN
  -- Try to get IP address and user agent from request headers
  -- These will be NULL if not available in the context
  BEGIN
    v_ip_address := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
  END;
  
  BEGIN
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;
  
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
    p_resource_id,
    p_details,
    v_ip_address,
    v_user_agent,
    NOW()
  );
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.log_admin_activity(UUID, TEXT, TEXT, TEXT, JSONB) IS 
  'RPC function to log admin activities. Captures IP address and user agent when available from request context.';
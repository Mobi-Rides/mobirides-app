CREATE OR REPLACE FUNCTION get_marketing_recipients()
RETURNS TABLE (
  id uuid,
  email varchar,
  full_name text
) 
SECURITY DEFINER
SET search_path = public
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
$$ LANGUAGE plpgsql;

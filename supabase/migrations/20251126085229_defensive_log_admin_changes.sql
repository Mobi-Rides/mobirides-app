-- Make log_admin_changes function defensive to handle cases where admin_activity_logs doesn't exist yet
-- This prevents migration failures when admins table is created before admin_activity_logs table

CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Add comment explaining the defensive pattern
COMMENT ON FUNCTION public.log_admin_changes() IS 
  'Defensive trigger function that checks for admin_activity_logs table existence before logging. This prevents migration order dependency issues.';
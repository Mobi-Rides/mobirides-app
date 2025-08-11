-- Phase 1: Admin Security and Consistency Fixes

-- 1. Drop and recreate the is_admin function with proper security
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create a more secure is_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid
  );
$$;

-- 2. Create admin session management table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now() + interval '8 hours'),
  last_activity timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address inet,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_sessions
CREATE POLICY "Admins can view their own sessions"
ON public.admin_sessions
FOR SELECT
USING (admin_id = auth.uid());

CREATE POLICY "Admins can create their own sessions"
ON public.admin_sessions
FOR INSERT
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their own sessions"
ON public.admin_sessions
FOR UPDATE
USING (admin_id = auth.uid());

-- 3. Create admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_activity_logs
CREATE POLICY "Super admins can view all activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Admins can view their own activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (admin_id = auth.uid());

CREATE POLICY "Admins can create activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (admin_id = auth.uid());

-- 4. Create function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 5. Create function to cleanup expired admin sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE expires_at < timezone('utc'::text, now()) 
  AND is_active = true;
END;
$$;

-- 6. Create function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 7. Update admins table to include security fields
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at);

-- 9. Create trigger to log admin changes
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_activity(
      NEW.id,
      'admin_created',
      'admin',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_admin_activity(
      NEW.id,
      'admin_updated',
      'admin',
      NEW.id,
      jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_admin_activity(
      OLD.id,
      'admin_deleted',
      'admin',
      OLD.id,
      jsonb_build_object('deleted_data', to_jsonb(OLD))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS admin_changes_log ON public.admins;
CREATE TRIGGER admin_changes_log
  AFTER INSERT OR UPDATE OR DELETE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_changes();
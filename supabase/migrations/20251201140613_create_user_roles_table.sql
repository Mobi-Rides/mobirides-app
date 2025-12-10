-- MOBI-501-1: Create user_roles table schema with RLS and audit logging

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_roles_user UNIQUE (user_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles"
  ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- updated_at trigger
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
  CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- Audit logging trigger using log_audit_event()
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := NEW.user_id,
      p_action_details := jsonb_build_object('role', NEW.role, 'assigned_by', NEW.assigned_by)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := NEW.user_id,
      p_action_details := jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role, 'assigned_by', NEW.assigned_by)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      p_event_type := 'system_config_changed',
      p_severity := 'high',
      p_target_id := OLD.user_id,
      p_action_details := jsonb_build_object('role_removed', OLD.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
  CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_user_role_changes();
END $$;


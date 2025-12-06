-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  must_change_password BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
CREATE POLICY "Anyone can view admin list"
  ON public.admins
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
CREATE POLICY "Super admins can create new admins"
  ON public.admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
CREATE POLICY "Super admins can update admin records"
  ON public.admins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
CREATE POLICY "Super admins can delete admin records"
  ON public.admins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Create function to log admin changes (if not exists)
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
       SELECT 1 FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'admin_activity_logs'
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin changes logging
DROP TRIGGER IF EXISTS admin_changes_log ON public.admins;
CREATE TRIGGER admin_changes_log
  AFTER INSERT OR UPDATE OR DELETE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_changes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_super_admin ON public.admins(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON public.admins(created_at DESC);
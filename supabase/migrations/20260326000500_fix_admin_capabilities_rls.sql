-- Restore RLS policies for admin_capabilities dropped by remote schema sync (20260319212624)

DROP POLICY IF EXISTS "Admins can view their own capabilities" ON public.admin_capabilities;
DROP POLICY IF EXISTS "Super admins can manage all capabilities" ON public.admin_capabilities;

CREATE POLICY "Admins can view their own capabilities"
  ON public.admin_capabilities FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Super admins can manage all capabilities"
  ON public.admin_capabilities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true)
  );

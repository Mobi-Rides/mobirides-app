-- Restore RLS policies for admin_activity_logs dropped by remote schema sync (20260319212624)

CREATE POLICY "Admins can view their own activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Super admins can view all activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid() AND admins.is_super_admin = true
    )
  );

CREATE POLICY "Admins can insert their own activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Adjust RLS policies on user_restrictions to allow profiles with role 'admin' or 'super_admin'
-- Use text cast to avoid enum literal issues
DO $$ BEGIN
  -- Ensure table exists
  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_restrictions';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_restrictions table does not exist';
  END IF;

  -- Drop existing policies to replace them
  DROP POLICY IF EXISTS "Admins and super admins can view all restrictions" ON public.user_restrictions;
  DROP POLICY IF EXISTS "Admins and super admins can insert restrictions" ON public.user_restrictions;
  DROP POLICY IF EXISTS "Admins and super admins can update restrictions" ON public.user_restrictions;

  -- Recreate policies including profiles.role::text in ('admin','super_admin') OR admins.is_super_admin = true
  CREATE POLICY "Admins and super admins can view all restrictions" ON public.user_restrictions
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
      ) OR
      EXISTS (
        SELECT 1 FROM public.admins a
        WHERE a.id = auth.uid() AND a.is_super_admin = true
      )
    );

  CREATE POLICY "Admins and super admins can insert restrictions" ON public.user_restrictions
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
      ) OR
      EXISTS (
        SELECT 1 FROM public.admins a
        WHERE a.id = auth.uid() AND a.is_super_admin = true
      )
    );

  CREATE POLICY "Admins and super admins can update restrictions" ON public.user_restrictions
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
      ) OR
      EXISTS (
        SELECT 1 FROM public.admins a
        WHERE a.id = auth.uid() AND a.is_super_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text IN ('admin','super_admin')
      ) OR
      EXISTS (
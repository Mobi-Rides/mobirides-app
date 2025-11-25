-- Fix RLS policies on user_restrictions to include super_admin role in profiles
DO $$ BEGIN
  -- Ensure table exists and RLS is enabled
  PERFORM 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_restrictions';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_restrictions table does not exist';
  END IF;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins and super admins can view all restrictions" ON public.user_restrictions;
  DROP POLICY IF EXISTS "Admins and super admins can insert restrictions" ON public.user_restrictions;
  DROP POLICY IF EXISTS "Admins and super admins can update restrictions" ON public.user_restrictions;

  -- Recreate policies to include profiles.role IN ('admin','super_admin') OR admins.is_super_admin = true
  CREATE POLICY "Admins and super admins can view all restrictions" ON public.user_restrictions
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
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
        WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
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
        WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
      ) OR
      EXISTS (
        SELECT 1 FROM public.admins a
        WHERE a.id = auth.uid() AND a.is_super_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
      ) OR
      EXISTS (
        SELECT 1 FROM public.admins a
        WHERE a.id = auth.uid() AND a.is_super_admin = true
      )
    );
END $$;
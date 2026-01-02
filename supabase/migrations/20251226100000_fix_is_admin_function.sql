-- Restore the correct is_admin function implementation
-- The previous migration incorrectly changed it to check raw_app_meta_data
-- The correct implementation checks the admins table and profiles.role column

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role::text IN ('admin', 'super_admin')
  );
$$;

-- Also ensure the no-argument version is consistent
-- This checks profiles for the current authenticated user
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

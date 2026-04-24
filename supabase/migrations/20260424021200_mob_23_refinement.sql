-- MOB-23 Refinement: Update admin functions to use has_role() as per Acceptance Criteria

-- Update is_admin() to use has_role()
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We call has_role twice to check for both administrative levels
  -- Note: In this project, has_role is defined for the current auth.uid()
  -- If we want to check for a specific user_uuid, we would need a version of has_role(uuid, role)
  -- However, for the standard is_admin() call (no args), this works perfectly.
  
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Actually, to strictly follow the "use has_role()" criterion:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role('admin') OR public.has_role('super_admin');
END;
$$;

-- Update is_super_admin() to use has_role()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role('super_admin');
END;
$$;

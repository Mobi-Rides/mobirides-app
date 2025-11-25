-- Purpose: Replace unqualified no-arg is_admin() to avoid profiles-based recursion
-- Context: Policies still call is_admin() (unqualified), and the version defined in
--   20241206000001_remake_verification_policies.sql reads public.profiles. Combined
--   with profiles policies that also call is_admin(), this can create recursion.
--   We redefine the unqualified is_admin() to rely solely on public.admins.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$;

-- Ensure execute privileges remain
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

COMMENT ON FUNCTION is_admin() IS
'Unqualified admin check uses only public.admins to avoid RLS recursion via profiles.';
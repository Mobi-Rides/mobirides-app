-- Purpose: Eliminate RLS recursion by removing profiles reads from is_admin()
-- Context: Storage insert/select triggered evaluation of public.messages policy,
--          which calls is_admin(auth.uid()). That function queried public.profiles,
--          whose own admin policy also calls is_admin(auth.uid()), creating a cycle.
--          We simplify is_admin() to rely solely on public.admins (no RLS dependency).

-- Replace no-arg is_admin() to read only public.admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$;

-- Replace arg-accepting is_admin(user_uuid) to read only public.admins
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = user_uuid
  );
$$;

-- Ensure execute privileges
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Note: Using only public.admins avoids touching public.profiles, preventing
--       recursion via profiles’ admin policies during policy evaluation.
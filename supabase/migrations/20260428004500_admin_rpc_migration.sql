-- Migration: Admin RPC Migration to user_roles
-- Description: Deprecate the `admins` table references in all administrative RPCs 
-- and replace them with operations on the `user_roles` table.

-- 1. Create a secured `add_admin` RPC function
CREATE OR REPLACE FUNCTION public.add_admin(target_user_id uuid, make_super_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can add new admins
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can add new administrators.';
  END IF;

  -- Delete any existing role for this user to avoid constraint violation
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    target_user_id, 
    CASE WHEN make_super_admin THEN 'super_admin'::public.user_role ELSE 'admin'::public.user_role END
  );
  
  -- Insert into legacy admins table for backward compatibility during transition if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins' AND table_schema = 'public') THEN
    INSERT INTO public.admins (id, email, is_super_admin)
    SELECT target_user_id, email, make_super_admin
    FROM auth.users
    WHERE id = target_user_id
    ON CONFLICT (id) DO UPDATE SET is_super_admin = EXCLUDED.is_super_admin;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_admin(uuid, boolean) TO authenticated;

-- 2. Update `remove_admin_complete`
CREATE OR REPLACE FUNCTION public.remove_admin_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role public.user_role;
BEGIN
  -- Only super admins can remove admins
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can remove administrators.';
  END IF;

  -- Determine new role for the user (host if they have cars, otherwise renter)
  IF EXISTS (SELECT 1 FROM public.cars WHERE owner_id = target_user_id) THEN
    v_new_role := 'host'::public.user_role;
  ELSE
    v_new_role := 'renter'::public.user_role;
  END IF;

  -- Update role in user_roles table
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, v_new_role);

  -- Delete from legacy admins table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins' AND table_schema = 'public') THEN
    DELETE FROM public.admins WHERE id = target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_admin_complete(uuid) TO authenticated;

-- 3. Update `update_admin_role`
CREATE OR REPLACE FUNCTION public.update_admin_role(target_user_id uuid, new_is_super_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can modify admin privileges
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can modify administrator privileges.';
  END IF;

  -- Update role in user_roles table
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (
    target_user_id, 
    CASE WHEN new_is_super_admin THEN 'super_admin'::public.user_role ELSE 'admin'::public.user_role END
  );

  -- Update legacy admins table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins' AND table_schema = 'public') THEN
    UPDATE public.admins 
    SET is_super_admin = new_is_super_admin 
    WHERE id = target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_admin_role(uuid, boolean) TO authenticated;


-- Function to completely remove an admin
CREATE OR REPLACE FUNCTION public.remove_admin_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can remove administrators.';
  END IF;

  -- Determine new role for the user (host if they have cars, otherwise renter)
  IF EXISTS (SELECT 1 FROM cars WHERE owner_id = target_user_id) THEN
    v_new_role := 'host';
  ELSE
    v_new_role := 'renter';
  END IF;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_role
  WHERE id = target_user_id;

  -- Remove from admins table
  DELETE FROM admins
  WHERE id = target_user_id;
  
  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'remove_admin',
    'admin',
    target_user_id::text,
    jsonb_build_object('removed_admin_id', target_user_id, 'new_role', v_new_role)
  );
END;
$$;

-- Function to update admin role (toggle super admin)
CREATE OR REPLACE FUNCTION public.update_admin_role(target_user_id uuid, new_is_super_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_profile_role user_role;
  v_executor_is_super_admin boolean;
BEGIN
  -- Check if executor is super admin
  SELECT is_super_admin INTO v_executor_is_super_admin
  FROM admins
  WHERE id = auth.uid();

  IF v_executor_is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only super admins can update administrator roles.';
  END IF;

  -- Determine new profile role
  IF new_is_super_admin THEN
    v_new_profile_role := 'super_admin';
  ELSE
    v_new_profile_role := 'admin';
  END IF;

  -- Update admins table
  UPDATE admins
  SET is_super_admin = new_is_super_admin
  WHERE id = target_user_id;

  -- Update profiles table
  UPDATE profiles
  SET role = v_new_profile_role
  WHERE id = target_user_id;

  -- Log the action
  PERFORM log_admin_activity(
    auth.uid(),
    'update_admin_role',
    'admin',
    target_user_id::text,
    jsonb_build_object('updated_admin_id', target_user_id, 'new_is_super_admin', new_is_super_admin)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.remove_admin_complete(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_role(uuid, boolean) TO authenticated;

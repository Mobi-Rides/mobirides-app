-- Fix Admin Access: Restore Function and Promote User
-- 1. Restore the is_admin function with proper signature
-- 2. Ensure the specific user is an admin

DO $$
DECLARE
  target_email text := 'boikhums@gmail.com';
  target_id uuid;
BEGIN
  -- 1. Recreate is_admin function to accept an argument (overloading)
  --    This is needed because the frontend calls rpc('is_admin', { user_uuid: ... })
  
  -- Version 1: No arguments (uses auth.uid())
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
    SELECT EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    );
  $fn$;

  -- Version 2: With argument (uses provided uuid)
  CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
    SELECT EXISTS (
      SELECT 1 FROM public.admins WHERE id = user_uuid
    );
  $fn$;

  -- Grant execute permissions
  GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

  -- 2. Promote the user
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NOT NULL THEN
    -- Update profiles table
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_id;

    -- Insert into admins table if not exists
    INSERT INTO public.admins (id, email, is_super_admin)
    VALUES (target_id, target_email, true)
    ON CONFLICT (id) DO UPDATE
    SET is_super_admin = true;
    
    RAISE NOTICE 'User % promoted to super admin', target_email;
  ELSE
    RAISE WARNING 'User % not found in auth.users', target_email;
  END IF;

END $$;

-- Create RPC function to fetch admin users with email from auth.users
-- This provides a secure way to access email for admin user management

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone_number text,
  role public.user_role,
  created_at timestamptz,
  avatar_url text,
  verification_status public.verification_status
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    p.id,
    u.email::text,
    p.full_name,
    p.phone_number,
    p.role,
    p.created_at,
    p.avatar_url,
    p.verification_status
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
$$;

-- Grant execute permission to authenticated users
-- The function uses SECURITY DEFINER so it runs with elevated privileges
-- but only authenticated users can call it
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_admin_users() IS 'Returns admin user data including email from auth.users. Used by admin user management module.';
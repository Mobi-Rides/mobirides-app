-- Create comprehensive RPC for unified admin user management
-- This replaces multiple data sources with a single, efficient query

CREATE OR REPLACE FUNCTION public.get_admin_users_complete()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone_number text,
  role text,
  created_at timestamptz,
  avatar_url text,
  verification_status text,
  user_roles text[],
  is_restricted boolean,
  active_restrictions jsonb,
  vehicles_count bigint,
  bookings_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::text,
    p.full_name::text,
    p.phone_number::text,
    p.role::text,
    p.created_at,
    p.avatar_url::text,
    p.verification_status::text,
    COALESCE(
      (SELECT array_agg(ur.role::text) 
       FROM user_roles ur 
       WHERE ur.user_id = p.id),
      ARRAY[]::text[]
    ) AS user_roles,
    EXISTS(
      SELECT 1 FROM user_restrictions urs 
      WHERE urs.user_id = p.id AND urs.active = true
    ) AS is_restricted,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', urs.id,
        'restriction_type', urs.restriction_type,
        'reason', urs.reason,
        'starts_at', urs.starts_at,
        'ends_at', urs.ends_at
      ))
       FROM user_restrictions urs 
       WHERE urs.user_id = p.id AND urs.active = true),
      '[]'::jsonb
    ) AS active_restrictions,
    (SELECT COUNT(*) FROM cars c WHERE c.owner_id = p.id) AS vehicles_count,
    (SELECT COUNT(*) FROM bookings b WHERE b.renter_id = p.id) AS bookings_count
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_users_complete() TO authenticated;
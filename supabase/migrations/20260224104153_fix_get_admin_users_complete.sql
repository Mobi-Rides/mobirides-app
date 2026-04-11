
-- Fix get_admin_users_complete(): drop old signature then recreate with auth.users join for email

DROP FUNCTION IF EXISTS public.get_admin_users_complete();

CREATE FUNCTION public.get_admin_users_complete()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  verification_status TEXT,
  is_active BOOLEAN,
  user_roles TEXT[],
  is_restricted BOOLEAN,
  active_restrictions JSONB,
  vehicles_count BIGINT,
  bookings_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.full_name,
    au.email::TEXT,
    pr.role::TEXT,
    pr.avatar_url,
    pr.phone_number,
    pr.created_at,
    pr.updated_at,
    pr.verification_status::TEXT,
    TRUE AS is_active,
    COALESCE(
      (SELECT array_agg(ur.role::TEXT) FROM public.user_roles ur WHERE ur.user_id = pr.id),
      ARRAY[]::TEXT[]
    ) AS user_roles,
    EXISTS (
      SELECT 1 FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())
    ) AS is_restricted,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', urs.id,
        'restriction_type', urs.restriction_type,
        'reason', urs.reason,
        'starts_at', urs.starts_at,
        'ends_at', urs.ends_at
      )) FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())),
      '[]'::JSONB
    ) AS active_restrictions,
    (SELECT COUNT(*) FROM public.cars c WHERE c.owner_id = pr.id) AS vehicles_count,
    (SELECT COUNT(*) FROM public.bookings b WHERE b.renter_id = pr.id) AS bookings_count
  FROM public.profiles pr
  LEFT JOIN auth.users au ON au.id = pr.id
  ORDER BY pr.created_at DESC;
END;
$$;

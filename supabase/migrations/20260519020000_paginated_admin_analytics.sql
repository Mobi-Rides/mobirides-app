-- Migration: Add pagination to get_admin_users_complete and create get_monthly_user_growth
-- This allows bypassing the PostgREST 100-row cap on administrative analytics tables.

-- 1. Redefine get_admin_users_complete with limit_val and offset_val parameters
DROP FUNCTION IF EXISTS public.get_admin_users_complete(boolean);
DROP FUNCTION IF EXISTS public.get_admin_users_complete(boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_users_complete(
  show_deleted BOOLEAN DEFAULT false,
  limit_val INT DEFAULT 100,
  offset_val INT DEFAULT 0
)
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
  is_deleted BOOLEAN,
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
    COALESCE(pr.is_deleted, false) AS is_deleted,
    COALESCE(
      (SELECT array_agg(ur.role::TEXT) FROM public.user_roles ur WHERE ur.user_id = pr.id),
      ARRAY[]::TEXT[]
    ) AS user_roles,
    EXISTS (
      SELECT 1 FROM public.user_restrictions urs
      WHERE urs.user_id = pr.id
        AND urs.active = true
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
        AND urs.active = true
        AND urs.starts_at <= now()
        AND (urs.ends_at IS NULL OR urs.ends_at > now())),
      '[]'::JSONB
    ) AS active_restrictions,
    (SELECT COUNT(*) FROM public.cars c WHERE c.owner_id = pr.id) AS vehicles_count,
    (SELECT COUNT(*) FROM public.bookings b WHERE b.renter_id = pr.id) AS bookings_count
  FROM public.profiles pr
  LEFT JOIN auth.users au ON au.id = pr.id
  WHERE (show_deleted = true OR COALESCE(pr.is_deleted, false) = false)
  ORDER BY pr.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_complete(boolean, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_complete(boolean, integer, integer) TO service_role;


-- 2. Create get_monthly_user_growth function with limit_val and offset_val parameters
DROP FUNCTION IF EXISTS public.get_monthly_user_growth();
DROP FUNCTION IF EXISTS public.get_monthly_user_growth(integer, integer);

CREATE OR REPLACE FUNCTION public.get_monthly_user_growth(
  limit_val INT DEFAULT 100,
  offset_val INT DEFAULT 0
)
RETURNS TABLE (
  created_at TIMESTAMPTZ,
  role TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pr.created_at, pr.role::TEXT, pr.full_name
  FROM public.profiles pr
  WHERE (pr.is_deleted = false OR pr.is_deleted IS NULL)
  ORDER BY pr.created_at ASC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_user_growth(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_user_growth(integer, integer) TO service_role;

-- Geographic and engagement analytics RPCs for SuperAdmin UserBehavior dashboard.
-- These replace hardcoded mock data with live queries against bookings and profiles.

-- 1. Geographic revenue stats
--    Joins bookings → cars, groups by car location.
--    Only counts revenue-generating statuses to avoid inflating numbers with
--    cancelled/pending bookings that will never be paid.
CREATE OR REPLACE FUNCTION public.get_geographic_revenue_stats()
RETURNS TABLE (
  location       text,
  unique_users   bigint,
  total_bookings bigint,
  total_revenue  numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.location,
    COUNT(DISTINCT b.renter_id)     AS unique_users,
    COUNT(b.id)                     AS total_bookings,
    COALESCE(SUM(b.total_price), 0) AS total_revenue
  FROM public.bookings b
  JOIN public.cars c ON c.id = b.car_id
  WHERE b.status IN ('confirmed', 'completed', 'in_progress')
  GROUP BY c.location
  ORDER BY total_revenue DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_geographic_revenue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geographic_revenue_stats() TO service_role;

-- 2. Revenue summary
--    Returns aggregate revenue figures used by the Revenue tab cards.
--    monthly_revenue  = revenue from bookings created this calendar month
--    avg_booking_value = all-time total_price / all-time booking count
--    avg_revenue_per_user = all-time revenue / distinct renters
CREATE OR REPLACE FUNCTION public.get_revenue_summary()
RETURNS TABLE (
  monthly_revenue        numeric,
  avg_booking_value      numeric,
  avg_revenue_per_user   numeric,
  total_bookings         bigint,
  total_users            bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH monthly AS (
    SELECT COALESCE(SUM(total_price), 0) AS monthly_revenue
    FROM   public.bookings
    WHERE  status IN ('confirmed', 'completed', 'in_progress')
      AND  created_at >= date_trunc('month', now())
  ),
  alltime AS (
    SELECT
      COALESCE(SUM(total_price), 0)    AS total_revenue,
      COUNT(*)                          AS total_bookings,
      COUNT(DISTINCT renter_id)         AS total_users
    FROM public.bookings
    WHERE status IN ('confirmed', 'completed', 'in_progress')
  )
  SELECT
    m.monthly_revenue,
    CASE WHEN a.total_bookings > 0
         THEN ROUND(a.total_revenue / a.total_bookings, 2)
         ELSE 0 END AS avg_booking_value,
    CASE WHEN a.total_users > 0
         THEN ROUND(a.total_revenue / a.total_users, 2)
         ELSE 0 END AS avg_revenue_per_user,
    a.total_bookings,
    a.total_users
  FROM monthly m, alltime a;
$$;

GRANT EXECUTE ON FUNCTION public.get_revenue_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_summary() TO service_role;

-- 3. Engagement metrics
--    Computes booking-based engagement KPIs derivable from the current schema.
--    Session tracking is not in scope; metrics are scoped to booking activity.
CREATE OR REPLACE FUNCTION public.get_engagement_metrics()
RETURNS TABLE (
  total_users                  bigint,
  users_with_bookings          bigint,
  users_with_multiple_bookings bigint,
  total_bookings               bigint,
  booking_conversion_rate      numeric,
  return_booking_rate          numeric,
  avg_bookings_per_user        numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_counts AS (
    SELECT renter_id, COUNT(*) AS booking_count
    FROM   public.bookings
    WHERE  status IN ('confirmed', 'completed', 'in_progress', 'pending')
    GROUP BY renter_id
  ),
  agg AS (
    SELECT
      COUNT(*)                                           AS users_with_bookings,
      COUNT(*) FILTER (WHERE booking_count > 1)         AS users_with_multiple_bookings,
      COALESCE(SUM(booking_count), 0)                   AS total_bookings
    FROM user_counts
  ),
  profile_count AS (
    SELECT COUNT(*) AS total_users FROM public.profiles
  )
  SELECT
    p.total_users,
    a.users_with_bookings,
    a.users_with_multiple_bookings,
    a.total_bookings,
    CASE WHEN p.total_users > 0
         THEN ROUND((a.users_with_bookings::numeric / p.total_users) * 100, 1)
         ELSE 0 END AS booking_conversion_rate,
    CASE WHEN a.users_with_bookings > 0
         THEN ROUND((a.users_with_multiple_bookings::numeric / a.users_with_bookings) * 100, 1)
         ELSE 0 END AS return_booking_rate,
    CASE WHEN a.users_with_bookings > 0
         THEN ROUND(a.total_bookings::numeric / a.users_with_bookings, 1)
         ELSE 0 END AS avg_bookings_per_user
  FROM profile_count p, agg a;
$$;

GRANT EXECUTE ON FUNCTION public.get_engagement_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_engagement_metrics() TO service_role;

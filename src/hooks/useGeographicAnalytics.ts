import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GeographicStat {
  location: string;
  users: number;
  bookings: number;
  revenue: number;
}

export interface RevenueSummary {
  monthly_revenue: number;
  avg_booking_value: number;
  avg_revenue_per_user: number;
  total_bookings: number;
  total_users: number;
}

export interface EngagementMetrics {
  total_users: number;
  users_with_bookings: number;
  users_with_multiple_bookings: number;
  total_bookings: number;
  booking_conversion_rate: number;
  return_booking_rate: number;
  avg_bookings_per_user: number;
}

const GEO_QUERY_KEY = ["geographic-revenue-stats"] as const;
const REVENUE_QUERY_KEY = ["revenue-summary"] as const;
const ENGAGEMENT_QUERY_KEY = ["engagement-metrics"] as const;

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchGeographicStats(): Promise<GeographicStat[]> {
  const { data, error } = await supabase.rpc("get_geographic_revenue_stats");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    location: row.location,
    users: Number(row.unique_users),
    bookings: Number(row.total_bookings),
    revenue: Number(row.total_revenue),
  }));
}

async function fetchRevenueSummary(): Promise<RevenueSummary | null> {
  const { data, error } = await supabase.rpc("get_revenue_summary");
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    monthly_revenue: Number(row.monthly_revenue),
    avg_booking_value: Number(row.avg_booking_value),
    avg_revenue_per_user: Number(row.avg_revenue_per_user),
    total_bookings: Number(row.total_bookings),
    total_users: Number(row.total_users),
  };
}

async function fetchEngagementMetrics(): Promise<EngagementMetrics | null> {
  const { data, error } = await supabase.rpc("get_engagement_metrics");
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    total_users: Number(row.total_users),
    users_with_bookings: Number(row.users_with_bookings),
    users_with_multiple_bookings: Number(row.users_with_multiple_bookings),
    total_bookings: Number(row.total_bookings),
    booking_conversion_rate: Number(row.booking_conversion_rate),
    return_booking_rate: Number(row.return_booking_rate),
    avg_bookings_per_user: Number(row.avg_bookings_per_user),
  };
}

export const useGeographicAnalytics = () => {
  const queryClient = useQueryClient();

  const geoQuery = useQuery({
    queryKey: GEO_QUERY_KEY,
    queryFn: fetchGeographicStats,
    staleTime: STALE_TIME,
  });

  const revenueQuery = useQuery({
    queryKey: REVENUE_QUERY_KEY,
    queryFn: fetchRevenueSummary,
    staleTime: STALE_TIME,
  });

  const engagementQuery = useQuery({
    queryKey: ENGAGEMENT_QUERY_KEY,
    queryFn: fetchEngagementMetrics,
    staleTime: STALE_TIME,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: GEO_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: REVENUE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ENGAGEMENT_QUERY_KEY });
  };

  return {
    geoStats: geoQuery.data ?? [],
    geoLoading: geoQuery.isLoading,
    geoError: geoQuery.error,

    revenueSummary: revenueQuery.data ?? null,
    revenueLoading: revenueQuery.isLoading,
    revenueError: revenueQuery.error,

    engagementMetrics: engagementQuery.data ?? null,
    engagementLoading: engagementQuery.isLoading,
    engagementError: engagementQuery.error,

    isLoading:
      geoQuery.isLoading ||
      revenueQuery.isLoading ||
      engagementQuery.isLoading,

    refetch,
  };
};

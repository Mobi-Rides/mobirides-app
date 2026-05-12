import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { format, subDays } from "date-fns";
import { 
  analyticsService, 
  SystemMetrics, 
  SecurityMetrics,
  AuditLogEvent 
} from "@/services/analyticsService";
import { AdminUserComplete } from "./useAdminUsersComplete";
import { useSuperAdminRoles } from "./useSuperAdminRoles";

// Analytics data types
export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  actor_id: string | null;
  target_id: string | null;
  created_at: string;
  action_details: Json;
  resource_type: string | null;
}

export interface AnalyticsData {
  date: string;
  event_type: string;
  severity: string;
  event_count: number;
  unique_actors: number;
  unique_targets: number;
  compliance_tags?: string[];
}

export type { SecurityMetrics, SystemMetrics };

export interface UserActivityMetrics {
  total_users: number;
  active_users: number;
  active_today: number;
  new_users: number;
  new_users_today: number;
  suspended_users: number;
  role_distribution: Record<string, number>;
  role_users?: Record<string, string[]>;
  user_profiles?: Record<string, unknown>[];
  admin_users: number;
  admin_user_details: AdminUserComplete[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  color?: string;
  [key: string]: string | number | undefined;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export const useSuperAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserActivityMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [userGrowth, setUserGrowth] = useState<ChartDataPoint[]>([]);
  const [bookingGrowth, setBookingGrowth] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [realtimeSubscription, setRealtimeSubscription] = useState<RealtimeChannel | null>(null);

  const { users: adminUsers } = useSuperAdminRoles();


  const calculateSecurityMetrics = useCallback((events: AuditLogEvent[]): SecurityMetrics => {
    const metrics: SecurityMetrics = {
      total_events: events.length,
      critical_events: events.filter(e => e.severity === 'critical').length,
      high_severity_events: events.filter(e => e.severity === 'high').length,
      medium_severity_events: events.filter(e => e.severity === 'medium').length,
      low_severity_events: events.filter(e => e.severity === 'low').length,
      top_event_types: [],
      top_actors: [],
      security_trends: []
    };

    const typeCounts: Record<string, number> = {};
    events.forEach(e => {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    });
    metrics.top_event_types = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return metrics;
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters = { startDate: dateRange.start, endDate: dateRange.end };
    try {
      const [events, registrationStats, bookingStats] = await Promise.all([
        analyticsService.getSecurityEvents(filters),
        analyticsService.getUserRegistrationStats(),
        analyticsService.getBookingGrowthStats()
      ]);

      setEvents(events as unknown as SecurityEvent[]);
      setUserGrowth(registrationStats);
      setBookingGrowth(bookingStats);
      
      const securityMetricsData = calculateSecurityMetrics(events);
      setSecurityMetrics(securityMetricsData);

      // Fetch other metrics and merge with admin user data
      const [userMetricsData, systemMetricsData] = await Promise.all([
        analyticsService.getUserMetrics(filters.startDate && filters.endDate ? {
          start: filters.startDate,
          end: filters.endDate
        } : undefined),
        analyticsService.getSystemMetrics(filters.startDate && filters.endDate ? {
          start: filters.startDate,
          end: filters.endDate
        } : undefined)
      ]);

      if (userMetricsData) {
        setUserMetrics({
          ...userMetricsData,
          admin_users: adminUsers?.length || 0,
          admin_user_details: (adminUsers as unknown as AdminUserComplete[]) || []
        } as UserActivityMetrics);
      }
      
      if (systemMetricsData) {
        setSystemMetrics(systemMetricsData as SystemMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, adminUsers, calculateSecurityMetrics]);

  const refreshData = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const setupRealtimeSubscription = useCallback(() => {
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    const sub = analyticsService.subscribeToAnalytics((payload) => {
      fetchAnalytics();
    });
    setRealtimeSubscription(sub.subscription);

    return () => {
      sub.unsubscribe();
    };
  }, [realtimeSubscription, fetchAnalytics]);

  const exportAnalytics = useCallback(async (exportFormat: 'json' | 'csv' = 'json') => {
    try {
      const exportData = await analyticsService.exportAnalytics({
        format: exportFormat,
        includeEvents: true,
        includeMetrics: true,
        includeUsers: true,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      });
      
      // Create download link
      const blob = new Blob([exportFormat === 'json' ? JSON.stringify(exportData, null, 2) : exportData], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobirides-analytics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      return false;
    }
  }, [dateRange]);

  // Get dashboard summary
  const getDashboardSummary = useCallback(async () => {
    try {
      return await analyticsService.getDashboardSummary({
        start: dateRange.start,
        end: dateRange.end
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return null;
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [setupRealtimeSubscription]);

  // Process data for charts
  const getTimeSeriesData = (): TimeSeriesData[] => {
    return analytics.map(item => ({
      date: item.date,
      value: item.event_count,
      category: item.event_type
    }));
  };

  const getSeverityDistribution = (): ChartDataPoint[] => {
    if (!securityMetrics) return [];
    return [
      { name: 'Critical', value: securityMetrics.critical_events },
      { name: 'High', value: securityMetrics.high_severity_events },
      { name: 'Medium', value: securityMetrics.medium_severity_events },
      { name: 'Low', value: securityMetrics.low_severity_events }
    ];
  };

  const getEventTypeDistribution = (): ChartDataPoint[] => {
    const eventTypeCounts: Record<string, number> = {};
    analytics.forEach(item => {
      eventTypeCounts[item.event_type] = (eventTypeCounts[item.event_type] || 0) + item.event_count;
    });
    return Object.entries(eventTypeCounts).map(([type, count]) => ({ name: type, value: count }));
  };

  const getUserGrowthData = (): TimeSeriesData[] => {
    // This would need a users table with created_at timestamps
    // For now, return mock data structure
    return [];
  };

  return {
    analytics,
    events,
    userMetrics,
    systemMetrics,
    securityMetrics,
    loading,
    dateRange,
    setDateRange,
    refreshData,
    exportAnalytics,
    getDashboardSummary,
    getTimeSeriesData,
    getSeverityDistribution,
    getEventTypeDistribution,
    userGrowth,
    bookingGrowth,
    adminUsers // Include admin users from roles hook
  };
};
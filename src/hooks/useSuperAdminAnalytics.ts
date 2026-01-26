import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { analyticsService } from "@/services/analyticsService";
import { useSuperAdminRoles } from "./useSuperAdminRoles";

// Analytics data types
export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actor_id?: string;
  target_id?: string;
  created_at: string;
  action_details?: any;
  resource_type?: string;
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

export interface UserActivityMetrics {
  total_users: number;
  active_users: number;
  new_users: number;
  suspended_users: number;
  role_distribution: Record<string, number>;
  role_users?: Record<string, string[]>;
  user_profiles?: any[];
  admin_users: number;
  admin_user_details: any[];
}

export interface SystemMetrics {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  revenue: number;
  average_booking_value: number;
}

export interface SecurityMetrics {
  total_events: number;
  critical_events: number;
  high_severity_events: number;
  medium_severity_events: number;
  low_severity_events: number;
  top_event_types: Array<{ type: string; count: number }>;
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
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  // Use existing roles hook for user data integration
  const { users: adminUsers } = useSuperAdminRoles();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Use analytics service for comprehensive data fetching
      const dateRangeParam = {
        start: dateRange.start,
        end: dateRange.end
      };

      // Fetch all analytics data in parallel
      const [
        analyticsData,
        securityEvents,
        userMetricsData,
        systemMetricsData,
        securityMetricsData
      ] = await Promise.all([
        analyticsService.getAnalytics({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        analyticsService.getSecurityEvents({
          startDate: dateRange.start,
          endDate: dateRange.end
        }, 100),
        analyticsService.getUserMetrics(dateRangeParam),
        analyticsService.getSystemMetrics(dateRangeParam),
        analyticsService.getSecurityMetrics(dateRangeParam)
      ]);

      // Set analytics data
      setAnalytics(analyticsData);
      setEvents(securityEvents);
      
      // Merge service user metrics with admin users data
      if (userMetricsData) {
        setUserMetrics({
          ...userMetricsData,
          admin_users: adminUsers?.length || 0,
          admin_user_details: adminUsers || []
        });
      }
      
      setSystemMetrics(systemMetricsData);
      setSecurityMetrics(securityMetricsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to manual fetching if service fails
      await fetchAnalyticsFallback();
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Fallback function for manual data fetching
  const fetchAnalyticsFallback = async () => {
    try {
      // Fetch analytics data from audit_analytics view
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("audit_analytics")
        .select("*")
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);

      // Fetch recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from("audit_logs")
        .select("id, event_type, severity, actor_id, target_id, created_at, action_details, resource_type")
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch user metrics
      await fetchUserMetrics();
      
      // Fetch system metrics
      await fetchSystemMetrics();
      
      // Calculate security metrics
      calculateSecurityMetrics(eventsData || []);

    } catch (error) {
      console.error('Error in fallback analytics fetching:', error);
    }
  };

  const fetchUserMetrics = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Get new users (last 7 days)
      const sevenDaysAgo = subDays(new Date(), 7);
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get suspended users (accounts that are locked)
      const { count: suspendedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('account_locked_until', 'is', null);

      // Get role distribution
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, count: user_id.count()');

      const roleDistribution = roleData?.reduce((acc, item) => {
        acc[item.role] = Number(item.count);
        return acc;
      }, {} as Record<string, number>) || {};

      // Include admin users data if available
      const adminUsersCount = adminUsers?.length || 0;

      setUserMetrics({
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        new_users: newUsers || 0,
        suspended_users: suspendedUsers || 0,
        role_distribution: roleDistribution,
        admin_users: adminUsersCount,
        admin_user_details: adminUsers || []
      });

    } catch (error) {
      console.error('Error fetching user metrics:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      // Get booking metrics
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: completedBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: cancelledBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      // Get revenue data (this would need a payments table)
      // For now, we'll use a placeholder
      const revenue = 0;
      const averageBookingValue = totalBookings ? revenue / totalBookings : 0;

      setSystemMetrics({
        total_bookings: totalBookings || 0,
        completed_bookings: completedBookings || 0,
        cancelled_bookings: cancelledBookings || 0,
        revenue: revenue,
        average_booking_value: averageBookingValue
      });

    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const calculateSecurityMetrics = (securityEvents: SecurityEvent[]) => {
    const metrics: SecurityMetrics = {
      total_events: securityEvents.length,
      critical_events: 0,
      high_severity_events: 0,
      medium_severity_events: 0,
      low_severity_events: 0,
      top_event_types: []
    };

    const eventTypeCounts: Record<string, number> = {};

    securityEvents.forEach(event => {
      switch (event.severity) {
        case 'critical':
          metrics.critical_events++;
          break;
        case 'high':
          metrics.high_severity_events++;
          break;
        case 'medium':
          metrics.medium_severity_events++;
          break;
        case 'low':
          metrics.low_severity_events++;
          break;
      }

      eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
    });

    metrics.top_event_types = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setSecurityMetrics(metrics);
  };

  const refreshData = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    // Unsubscribe from existing subscription
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    // Subscribe to analytics updates
    const subscription = analyticsService.subscribeToAnalytics((payload) => {
      console.log('Real-time analytics update:', payload);
      
      // Check if this is a new event
      if (payload.new && payload.eventType === 'INSERT') {
        const newEvent = payload.new as SecurityEvent;
        
        // Show notification for critical/high severity events
        if (newEvent.severity === 'critical' || newEvent.severity === 'high') {
          // This will be handled by the component using toast notifications
          window.dispatchEvent(new CustomEvent('analytics-new-event', {
            detail: {
              event: newEvent,
              message: `New ${newEvent.severity} severity event: ${newEvent.event_type}`
            }
          }));
        }
      }
      
      // Refresh data when new events are detected
      refreshData();
    });

    setRealtimeSubscription(subscription);

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  // Export analytics data
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
    getUserGrowthData,
    adminUsers // Include admin users from roles hook
  };
};
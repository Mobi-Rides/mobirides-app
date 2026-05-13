import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Database, Json } from "@/integrations/supabase/types";

export type AuditEventType = Database["public"]["Enums"]["audit_event_type"];
export type AuditSeverity = Database["public"]["Enums"]["audit_severity"];

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  eventTypes?: AuditEventType[];
  severityLevels?: AuditSeverity[];
  actorIds?: string[];
  resourceTypes?: string[];
}

export interface ExportOptions {
  format: 'json' | 'csv';
  includeEvents: boolean;
  includeMetrics: boolean;
  includeUsers: boolean;
  includeSecurityAlerts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SecurityAlert {
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
  category?: string;
  timestamp?: string;
  source?: string;
  action_required?: boolean;
  acknowledged?: boolean;
}

export interface AuditLogEvent {
  id: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  actor_id: string | null;
  target_id: string | null;
  created_at: string;
  action_details: Json;
  resource_type: string | null;
}

export interface UserMetrics {
  total_users: number;
  active_users: number;
  active_today: number;
  new_users: number;
  new_users_today: number;
  suspended_users: number;
  role_distribution: Record<string, number>;
  role_users: Record<string, string[]>;
  user_profiles: Array<{ id: string; full_name: string | null; created_at: string | null }>;
}

export interface SystemMetrics {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  revenue: number;
  platform_commission: number;
  average_booking_value: number;
  booking_stats: Record<string, number>;
}

export interface SecurityMetrics {
  total_events: number;
  critical_events: number;
  high_severity_events: number;
  medium_severity_events: number;
  low_severity_events: number;
  top_event_types: Array<{ type: string; count: number }>;
  top_actors: Array<{ actor_id: string; count: number }>;
  security_trends: Array<{ date: string; count: number; severity: string }>;
}

export interface FullAnalyticsExport {
  exported_at: string;
  format: 'json' | 'csv';
  version: string;
  date_range?: { start: string; end: string };
  events?: AuditLogEvent[];
  metrics?: {
    security: SecurityMetrics;
    system: SystemMetrics;
  };
  users?: UserMetrics;
  security_alerts?: {
    total_alerts: number;
    critical_alerts: number;
    acknowledged_alerts: number;
    unacknowledged_alerts: number;
    alerts: SecurityAlert[];
  };
  applied_filters?: {
    severity_levels?: AuditSeverity[];
    event_types?: AuditEventType[];
    actor_ids?: string[];
    resource_types?: string[];
    search_term?: string;
    status?: string;
    user_status?: string;
  };
}

export interface RealtimeSubscription {
  subscription: RealtimeChannel;
  unsubscribe: () => void;
}

const ANALYTICS_ROW_LIMIT = 5000;

// Helper function to escape CSV values
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export const analyticsService = {
  // Fetch analytics data with filters
  async getAnalytics(filters: AnalyticsFilters = {}) {
    let query = supabase
      .from('audit_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.eventTypes?.length) {
      query = query.in('event_type', filters.eventTypes);
    }
    if (filters.severityLevels?.length) {
      query = query.in('severity', filters.severityLevels);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Fetch security events with advanced filtering
  async getSecurityEvents(filters: AnalyticsFilters = {}, limit = 100) {
    let query = supabase
      .from('audit_logs')
      .select('id, event_type, severity, actor_id, target_id, created_at, action_details, resource_type')
      .order('created_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.eventTypes?.length) {
      query = query.in('event_type', filters.eventTypes);
    }
    if (filters.severityLevels?.length) {
      query = query.in('severity', filters.severityLevels);
    }
    if (filters.actorIds?.length) {
      query = query.in('actor_id', filters.actorIds);
    }
    if (filters.resourceTypes?.length) {
      query = query.in('resource_type', filters.resourceTypes);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data;
  },

  // Get user activity metrics with role integration
  async getUserMetrics(dateRange?: { start: string; end: string }) {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (logged in within date range)
    let activeQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (dateRange) {
      activeQuery = activeQuery.gte('last_login_attempt', dateRange.start);
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      activeQuery = activeQuery.gte('last_login_attempt', thirtyDaysAgo.toISOString());
    }

    const { count: activeUsers } = await activeQuery;

    // Get new users
    let newQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (dateRange) {
      newQuery = newQuery.gte('created_at', dateRange.start);
    } else {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      newQuery = newQuery.gte('created_at', sevenDaysAgo.toISOString());
    }

    const { count: newUsers } = await newQuery;

    // Get suspended users
    const { count: suspendedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('account_locked_until', 'is', null);

    // Get role distribution from profiles
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role, id, created_at, last_login_attempt')
      .order('role')
      .limit(ANALYTICS_ROW_LIMIT);

    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const activeToday = roleData?.filter(p => p.last_login_attempt && p.last_login_attempt >= todayIso).length || 0;
    const newUsersToday = roleData?.filter(p => p.created_at && p.created_at >= todayIso).length || 0;


    const roleDistribution: Record<string, number> = {};
    const roleUsers: Record<string, string[]> = {};

    roleData?.forEach(item => {
      const role = item.role || 'renter';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      if (!roleUsers[role]) {
        roleUsers[role] = [];
      }
      roleUsers[role].push(item.id);
    });

    // Get user profiles
    const userIds = roleData?.map(item => item.id) || [];
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .in('id', userIds.slice(0, 100)); // Limit for performance

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      active_today: activeToday,
      new_users: newUsers || 0,
      new_users_today: newUsersToday,
      suspended_users: suspendedUsers || 0,
      role_distribution: roleDistribution,
      role_users: roleUsers,
      user_profiles: profileData || []
    };
  },

  // Get system metrics with booking integration
  async getSystemMetrics(dateRange?: { start: string; end: string }) {
    let bookingQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (dateRange) {
      bookingQuery = bookingQuery
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { count: totalBookings } = await bookingQuery;

    // Get booking status breakdown manually
    let allBookingsQuery = supabase
      .from('bookings')
      .select('status');

    if (dateRange) {
      allBookingsQuery = allBookingsQuery
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data: allBookings } = await allBookingsQuery.limit(ANALYTICS_ROW_LIMIT);

    const bookingStats = allBookings?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get revenue data from multiple sources
    let revenue = 0;
    let platformCommission = 0;

    // Source 1: Sum total_price from completed bookings
    try {
      const { data: completedBookingsData } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('status', 'completed')
        .limit(ANALYTICS_ROW_LIMIT);

      revenue = completedBookingsData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
    } catch (error) {
      console.warn('Could not fetch completed bookings revenue:', error);
    }

    // Source 2: If no completed bookings revenue, fallback to payment_transactions
    if (revenue === 0) {
      try {
        const { data: paymentData } = await supabase
          .from('payment_transactions')
          .select('amount, host_earnings, platform_commission')
          .eq('status', 'completed')
          .limit(ANALYTICS_ROW_LIMIT);

        revenue = paymentData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        platformCommission = paymentData?.reduce((sum, p) => sum + (p.platform_commission || 0), 0) || 0;
      } catch (error) {
        console.warn('Could not fetch payment_transactions revenue:', error);
      }
    }

    // Source 3: Also sum wallet_transactions with credit types as supplementary data
    try {
      const { data: walletData } = await supabase
        .from('wallet_transactions')
        .select('amount, transaction_type')
        .eq('status', 'completed')
        .in('transaction_type', ['rental_earnings', 'credit'])
        .limit(ANALYTICS_ROW_LIMIT);

      const walletRevenue = walletData?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) || 0;
      // Use wallet revenue if it's higher (more complete data)
      if (walletRevenue > revenue) {
        revenue = walletRevenue;
      }
    } catch (error) {
      console.warn('Could not fetch wallet_transactions revenue:', error);
    }

    const averageBookingValue = totalBookings ? revenue / totalBookings : 0;

    return {
      total_bookings: totalBookings || 0,
      completed_bookings: bookingStats.completed || 0,
      cancelled_bookings: bookingStats.cancelled || 0,
      pending_bookings: bookingStats.pending || 0,
      revenue: revenue,
      platform_commission: platformCommission,
      average_booking_value: averageBookingValue,
      booking_stats: bookingStats
    };
  },

  // Get security metrics with advanced analysis
  async getSecurityMetrics(dateRange?: { start: string; end: string }) {
    let eventsQuery = supabase
      .from('audit_logs')
      .select('*');

    if (dateRange) {
      eventsQuery = eventsQuery
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data: events } = await eventsQuery;

    const metrics = {
      total_events: events?.length || 0,
      critical_events: 0,
      high_severity_events: 0,
      medium_severity_events: 0,
      low_severity_events: 0,
      top_event_types: [] as Array<{ type: string; count: number }>,
      top_actors: [] as Array<{ actor_id: string; count: number }>,
      security_trends: [] as Array<{ date: string; count: number; severity: string }>
    };

    if (events) {
      const eventTypeCounts: Record<string, number> = {};
      const actorCounts: Record<string, number> = {};
      const dailyTrends: Record<string, Record<string, number>> = {};

      events.forEach(event => {
        // Count by severity
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

        // Count event types
        eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;

        // Count actors
        if (event.actor_id) {
          actorCounts[event.actor_id] = (actorCounts[event.actor_id] || 0) + 1;
        }

        // Daily trends
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dailyTrends[date]) {
          dailyTrends[date] = {};
        }
        dailyTrends[date][event.severity] = (dailyTrends[date][event.severity] || 0) + 1;
      });

      // Top event types
      metrics.top_event_types = Object.entries(eventTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top actors
      metrics.top_actors = Object.entries(actorCounts)
        .map(([actor_id, count]) => ({ actor_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Security trends
      metrics.security_trends = Object.entries(dailyTrends)
        .flatMap(([date, counts]) => 
          Object.entries(counts).map(([severity, count]) => ({
            date,
            count,
            severity
          }))
        )
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return metrics;
  },

  // Export analytics data
  async exportAnalytics(options: ExportOptions) {
    const exportData: FullAnalyticsExport = {
      exported_at: new Date().toISOString(),
      format: options.format,
      version: '2.0'
    };

    if (options.dateRange) {
      exportData.date_range = options.dateRange;
    }

    if (options.includeEvents) {
      const filters = options.dateRange ? {
        startDate: options.dateRange.start,
        endDate: options.dateRange.end
      } : {};
      exportData.events = await this.getSecurityEvents(filters, 1000);
    }

    if (options.includeMetrics) {
      exportData.metrics = {
        security: await this.getSecurityMetrics(options.dateRange),
        system: await this.getSystemMetrics(options.dateRange)
      };
    }

    if (options.includeUsers) {
      exportData.users = await this.getUserMetrics(options.dateRange);
    }

    if (options.includeSecurityAlerts) {
      // Include security alerts data
      exportData.security_alerts = {
        total_alerts: 0,
        critical_alerts: 0,
        acknowledged_alerts: 0,
        unacknowledged_alerts: 0,
        alerts: []
      };
    }

    if (options.format === 'csv') {
      // Convert to CSV format
      return this.convertToCSV(exportData);
    }

    return exportData;
  },

  // Convert data to CSV format
  convertToCSV(data: FullAnalyticsExport): string {
    const csvRows: string[] = [];
    
    // Add summary information
    csvRows.push('MobiRides Analytics Export');
    csvRows.push(`Exported at: ${new Date().toISOString()}`);
    csvRows.push(`Format: CSV`);
    csvRows.push(`Version: ${data.version || '1.0'}`);
    if (data.date_range) {
      csvRows.push(`Date Range: ${data.date_range.start} to ${data.date_range.end}`);
    }
    csvRows.push('');

    // Applied Filters Section
    if (data.applied_filters) {
      csvRows.push('Applied Filters:');
      csvRows.push('Filter,Value');
      if (data.applied_filters.severity_levels?.length > 0) {
        csvRows.push(`Severity Levels,"${data.applied_filters.severity_levels.join(', ')}"`);
      }
      if (data.applied_filters.event_types?.length > 0) {
        csvRows.push(`Event Types,"${data.applied_filters.event_types.join(', ')}"`);
      }
      if (data.applied_filters.actor_ids?.length > 0) {
        csvRows.push(`Actor IDs,"${data.applied_filters.actor_ids.join(', ')}"`);
      }
      if (data.applied_filters.resource_types?.length > 0) {
        csvRows.push(`Resource Types,"${data.applied_filters.resource_types.join(', ')}"`);
      }
      if (data.applied_filters.search_term) {
        csvRows.push(`Search Term,"${data.applied_filters.search_term}"`);
      }
      if (data.applied_filters.status) {
        csvRows.push(`Status,"${data.applied_filters.status}"`);
      }
      if (data.applied_filters.user_status) {
        csvRows.push(`User Status,"${data.applied_filters.user_status}"`);
      }
      csvRows.push('');
    }

    // User Metrics Section
    if (data.users) {
      csvRows.push('User Metrics:');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Users,${data.users.total_users || 0}`);
      csvRows.push(`Active Users,${data.users.active_users || 0}`);
      csvRows.push(`New Users,${data.users.new_users || 0}`);
      csvRows.push(`Suspended Users,${data.users.suspended_users || 0}`);
      
      // Role Distribution
      if (data.users.role_distribution) {
        csvRows.push('');
        csvRows.push('Role Distribution:');
        csvRows.push('Role,Count');
        Object.entries(data.users.role_distribution).forEach(([role, count]) => {
          csvRows.push(`${role},${count}`);
        });
      }
      csvRows.push('');
    }

    // System Metrics Section
    if (data.metrics?.system) {
      csvRows.push('System Metrics:');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Bookings,${data.metrics.system.total_bookings || 0}`);
      csvRows.push(`Completed Bookings,${data.metrics.system.completed_bookings || 0}`);
      csvRows.push(`Cancelled Bookings,${data.metrics.system.cancelled_bookings || 0}`);
      csvRows.push(`Revenue,${data.metrics.system.revenue || 0}`);
      csvRows.push(`Average Booking Value,${data.metrics.system.average_booking_value || 0}`);
      csvRows.push('');
    }

    // Security Metrics Section
    if (data.metrics?.security) {
      csvRows.push('Security Metrics:');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Security Events,${data.metrics.security.total_events || 0}`);
      csvRows.push(`Critical Events,${data.metrics.security.critical_events || 0}`);
      csvRows.push(`High Severity Events,${data.metrics.security.high_severity_events || 0}`);
      csvRows.push(`Medium Severity Events,${data.metrics.security.medium_severity_events || 0}`);
      csvRows.push(`Low Severity Events,${data.metrics.security.low_severity_events || 0}`);
      csvRows.push('');

      // Top Event Types
      if (data.metrics.security.top_event_types?.length > 0) {
        csvRows.push('Top Event Types:');
        csvRows.push('Event Type,Count');
        data.metrics.security.top_event_types.forEach((item: { type: string; count: number }) => {
          csvRows.push(`${item.type},${item.count}`);
        });
        csvRows.push('');
      }
    }

    // Security Alerts Section
    if (data.security_alerts) {
      csvRows.push('Security Alerts Summary:');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Alerts,${data.security_alerts.total_alerts || 0}`);
      csvRows.push(`Critical Alerts,${data.security_alerts.critical_alerts || 0}`);
      csvRows.push(`Acknowledged Alerts,${data.security_alerts.acknowledged_alerts || 0}`);
      csvRows.push(`Unacknowledged Alerts,${data.security_alerts.unacknowledged_alerts || 0}`);
      csvRows.push('');

      // Individual alerts
      if (data.security_alerts.alerts?.length > 0) {
        csvRows.push('Security Alerts Details:');
        csvRows.push('ID,Title,Description,Severity,Category,Timestamp,Source,Action Required,Acknowledged');
        data.security_alerts.alerts.forEach((alert: SecurityAlert) => {
          const values = [
            alert.id || '',
            alert.title || '',
            alert.description || '',
            alert.severity || '',
            alert.category || '',
            alert.timestamp || '',
            alert.source || '',
            alert.action_required ? 'Yes' : 'No',
            alert.acknowledged ? 'Yes' : 'No'
          ];
          csvRows.push(values.map(val => escapeCSVValue(val)).join(','));
        });
        csvRows.push('');
      }
    }

    // Events Data Section
    if (data.events && data.events.length > 0) {
      csvRows.push('Security Events:');
      
      // Prepare headers
      const headers = ['ID', 'Event Type', 'Severity', 'Actor ID', 'Target ID', 'Created At', 'Resource Type'];
      csvRows.push(headers.join(','));
      
      // Add event data
      data.events.forEach((event: AuditLogEvent) => {
        const values = [
          event.id || '',
          event.event_type || '',
          event.severity || '',
          event.actor_id || '',
          event.target_id || '',
          event.created_at || '',
          event.resource_type || ''
        ];
        csvRows.push(values.map(val => escapeCSVValue(val)).join(','));
      });
      csvRows.push('');
    }

    return csvRows.join('\n');
  },

  // Subscribe to real-time analytics updates
  subscribeToAnalytics(callback: (payload: RealtimePostgresChangesPayload<AuditLogEvent>) => void): RealtimeSubscription {
    const subscription = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audit_logs' }, 
        callback
      )
      .subscribe();

    return {
      subscription,
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  },

  // Get user registration statistics over time (BUG-015)
  async getUserRegistrationStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .not('role', 'in', '("admin","super_admin")')
      .order('created_at', { ascending: true })
      .limit(ANALYTICS_ROW_LIMIT);

    if (error) throw error;
    if (!data) return [];

    const stats: Record<string, number> = {};
    data.forEach(row => {
      if (row.created_at) {
        const month = format(new Date(row.created_at), 'MMM yyyy');
        stats[month] = (stats[month] || 0) + 1;
      }
    });

    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  },

  // Get booking growth statistics over time (BUG-015)
  async getBookingGrowthStats() {
    const { data, error } = await supabase
      .from('bookings')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(ANALYTICS_ROW_LIMIT);

    if (error) throw error;
    if (!data) return [];

    const stats: Record<string, number> = {};
    data.forEach(row => {
      if (row.created_at) {
        const month = format(new Date(row.created_at), 'MMM yyyy');
        stats[month] = (stats[month] || 0) + 1;
      }
    });

    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  },

  // Get dashboard summary
  async getDashboardSummary(dateRange?: { start: string; end: string }) {
    const [userMetrics, systemMetrics, securityMetrics] = await Promise.all([
      this.getUserMetrics(dateRange),
      this.getSystemMetrics(dateRange),
      this.getSecurityMetrics(dateRange)
    ]);

    return {
      users: userMetrics,
      system: systemMetrics,
      security: securityMetrics,
      summary: {
        total_users: userMetrics.total_users,
        active_users: userMetrics.active_users,
        total_bookings: systemMetrics.total_bookings,
        total_revenue: systemMetrics.revenue,
        security_events: securityMetrics.total_events,
        critical_alerts: securityMetrics.critical_events,
        last_updated: new Date().toISOString()
      }
    };
  }
};

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, Shield, Activity } from "lucide-react";
import {
  AnalyticsData,
  ChartDataPoint,
  TimeSeriesData,
  UserActivityMetrics,
  SystemMetrics,
  SecurityMetrics
} from "@/hooks/useSuperAdminAnalytics";

interface Props {
  analytics: AnalyticsData[];
  userMetrics: UserActivityMetrics | null;
  systemMetrics: SystemMetrics | null;
  securityMetrics: SecurityMetrics | null;
  userGrowth?: ChartDataPoint[];
  bookingGrowth?: ChartDataPoint[];
  onRefresh: () => void;
  loading: boolean;
  isPreview?: boolean;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#65a30d"
};

const StatCard = ({ title, value, icon: Icon, trend, color = "primary" }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: keyof typeof COLORS;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{trend}</p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-500`} />
      </div>
    </CardContent>
  </Card>
);

const OverviewTab = ({ 
  userMetrics, 
  securityMetrics, 
  systemMetrics, 
  activityTrends, 
  eventTypeDistribution 
}: {
  userMetrics: UserActivityMetrics | null;
  securityMetrics: SecurityMetrics | null;
  systemMetrics: SystemMetrics | null;
  activityTrends: TimeSeriesData[];
  eventTypeDistribution: ChartDataPoint[];
}) => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={userMetrics?.total_users || 0}
        icon={Users}
        trend="+12% from last month"
        color="primary"
      />
      <StatCard
        title="Active Users"
        value={userMetrics?.active_users || 0}
        icon={Activity}
        trend="+8% from last week"
        color="success"
      />
      <StatCard
        title="Security Events"
        value={securityMetrics?.total_events || 0}
        icon={Shield}
        trend="2 critical events"
        color="warning"
      />
      <StatCard
        title="Total Bookings"
        value={systemMetrics?.total_bookings || 0}
        icon={TrendingUp}
        color="secondary"
      />
    </div>

    {/* Activity Trends */}
    <Card>
      <CardHeader>
        <CardTitle>Activity Trends</CardTitle>
        <CardDescription>Daily system activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={activityTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Event Type Distribution */}
    <Card>
      <CardHeader>
        <CardTitle>Event Type Distribution</CardTitle>
        <CardDescription>Breakdown of different event types</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventTypeDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={COLORS.secondary} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

const UsersTab = ({ 
  userMetrics, 
  userGrowth, 
  roleDistribution 
}: {
  userMetrics: UserActivityMetrics | null;
  userGrowth: ChartDataPoint[];
  roleDistribution: ChartDataPoint[];
}) => (
  <div className="space-y-6">
    {/* User Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="New Users (7d)"
        value={userMetrics?.new_users || 0}
        icon={Users}
        color="success"
      />
      <StatCard
        title="Suspended Users"
        value={userMetrics?.suspended_users || 0}
        icon={Users}
        color="danger"
      />
      <StatCard
        title="Active Rate"
        value={`${userMetrics && userMetrics.total_users > 0 ? Math.round((userMetrics.active_users / userMetrics.total_users) * 100) : 0}%`}
        icon={Activity}
        color="primary"
      />
      <StatCard
        title="Growth Rate"
        value="+15%"
        icon={TrendingUp}
        color="secondary"
      />
    </div>

    {/* User Growth Chart */}
    <Card>
      <CardHeader>
        <CardTitle>User Registration Growth</CardTitle>
        <CardDescription>Monthly user registration trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.success}
              fill={COLORS.success}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Role Distribution */}
    <Card>
      <CardHeader>
        <CardTitle>User Role Distribution</CardTitle>
        <CardDescription>Breakdown of users by role</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={roleDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {roleDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

const SecurityTab = ({ 
  securityMetrics, 
  severityDistribution 
}: {
  securityMetrics: SecurityMetrics | null;
  severityDistribution: ChartDataPoint[];
}) => (
  <div className="space-y-6">
    {/* Security Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Critical Events"
        value={securityMetrics?.critical_events || 0}
        icon={Shield}
        color="danger"
      />
      <StatCard
        title="High Severity"
        value={securityMetrics?.high_severity_events || 0}
        icon={Shield}
        color="warning"
      />
      <StatCard
        title="Medium Severity"
        value={securityMetrics?.medium_severity_events || 0}
        icon={Shield}
        color="medium"
      />
      <StatCard
        title="Low Severity"
        value={securityMetrics?.low_severity_events || 0}
        icon={Shield}
        color="low"
      />
    </div>

    {/* Severity Distribution */}
    <Card>
      <CardHeader>
        <CardTitle>Security Event Severity Distribution</CardTitle>
        <CardDescription>Breakdown of events by severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={severityDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {severityDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Top Event Types */}
    <Card>
      <CardHeader>
        <CardTitle>Most Common Security Events</CardTitle>
        <CardDescription>Top 5 security event types</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {securityMetrics?.top_event_types.map((event, index) => (
            <div key={event.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{index + 1}</Badge>
                <span className="text-sm font-medium">{event.type}</span>
              </div>
              <Badge variant="secondary">{event.count} events</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const SystemTab = ({ 
  systemMetrics, 
  bookingGrowth 
}: {
  systemMetrics: SystemMetrics | null;
  bookingGrowth: ChartDataPoint[];
}) => (
  <div className="space-y-6">
    {/* System Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Bookings"
        value={systemMetrics?.total_bookings || 0}
        icon={TrendingUp}
        color="primary"
      />
      <StatCard
        title="Completed"
        value={systemMetrics?.completed_bookings || 0}
        icon={TrendingUp}
        color="success"
      />
      <StatCard
        title="Cancelled"
        value={systemMetrics?.cancelled_bookings || 0}
        icon={TrendingUp}
        color="danger"
      />
      <StatCard
        title="Completion Rate"
        value={`${systemMetrics && systemMetrics.total_bookings > 0 ? Math.round((systemMetrics.completed_bookings / systemMetrics.total_bookings) * 100) : 0}%`}
        icon={TrendingUp}
        color="secondary"
      />
    </div>

    {/* Booking Growth Trends */}
    <Card>
      <CardHeader>
        <CardTitle>Booking Growth Trends</CardTitle>
        <CardDescription>Monthly booking volume trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={bookingGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export const AnalyticsCharts = ({ 
  analytics, 
  userMetrics, 
  systemMetrics, 
  securityMetrics, 
  userGrowth = [],
  bookingGrowth = [],
  onRefresh, 
  loading,
  isPreview = false
}: Props) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'system'>('overview');

  // Process time series data for activity trends
  const getActivityTrends = (): TimeSeriesData[] => {
    const dailyActivity = analytics.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, value: 0 };
      }
      acc[date].value += item.event_count;
      return acc;
    }, {} as Record<string, TimeSeriesData>);

    return Object.values(dailyActivity).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process event type distribution
  const getEventTypeDistribution = (): ChartDataPoint[] => {
    const eventTypes: Record<string, number> = {};
    analytics.forEach(item => {
      eventTypes[item.event_type] = (eventTypes[item.event_type] || 0) + item.event_count;
    });
    return Object.entries(eventTypes).map(([name, value]) => ({ name, value }));
  };

  // Process severity distribution
  const getSeverityDistribution = (): ChartDataPoint[] => {
    if (!securityMetrics) return [];
    return [
      { name: 'Critical', value: securityMetrics.critical_events, color: COLORS.critical },
      { name: 'High', value: securityMetrics.high_severity_events, color: COLORS.high },
      { name: 'Medium', value: securityMetrics.medium_severity_events, color: COLORS.medium },
      { name: 'Low', value: securityMetrics.low_severity_events, color: COLORS.low }
    ];
  };

  // Process user role distribution
  const getRoleDistribution = (): ChartDataPoint[] => {
    if (!userMetrics) return [];
    return Object.entries(userMetrics.role_distribution).map(([name, value]) => ({ name, value }));
  };

  // If in preview mode, show only overview tab with limited content
  if (isPreview) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Activity Trends</CardTitle>
              <CardDescription>Daily user registrations and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={getActivityTrends().slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive system analytics and insights</p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {([
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'system', label: 'System', icon: TrendingUp }
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          userMetrics={userMetrics}
          securityMetrics={securityMetrics}
          systemMetrics={systemMetrics}
          activityTrends={getActivityTrends()}
          eventTypeDistribution={getEventTypeDistribution()}
        />
      )}
      {activeTab === 'users' && (
        <UsersTab 
          userMetrics={userMetrics}
          userGrowth={userGrowth}
          roleDistribution={getRoleDistribution()}
        />
      )}
      {activeTab === 'security' && (
        <SecurityTab 
          securityMetrics={securityMetrics}
          severityDistribution={getSeverityDistribution()}
        />
      )}
      {activeTab === 'system' && (
        <SystemTab 
          systemMetrics={systemMetrics}
          bookingGrowth={bookingGrowth}
        />
      )}
    </div>
  );
};
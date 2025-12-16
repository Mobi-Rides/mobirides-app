import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, MapPin, DollarSign, Activity, Filter, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { SecurityEvent } from "@/hooks/useSuperAdminAnalytics";

interface Props {
  events: SecurityEvent[];
  userMetrics: any;
  onRefresh: () => void;
  loading: boolean;
}

interface UserBehaviorMetric {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

const TREND_COLORS = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400'
};

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingUp,
  neutral: Activity
};

export const UserBehavior = ({ events, userMetrics, onRefresh, loading }: Props) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [viewMode, setViewMode] = useState<'overview' | 'engagement' | 'geographic' | 'revenue'>('overview');

  // Filter user-related events
  const userEvents = events.filter(event => 
    event.resource_type === 'user' || event.event_type.includes('user')
  );

  // Calculate user behavior metrics
  const behaviorMetrics: UserBehaviorMetric[] = [
    {
      metric: 'Daily Active Users',
      value: userMetrics?.active_today || 0,
      change: 12.5,
      trend: 'up',
      description: 'Users active in the last 24 hours'
    },
    {
      metric: 'New Registrations',
      value: userMetrics?.new_users_today || 0,
      change: 8.2,
      trend: 'up',
      description: 'New user signups today'
    },
    {
      metric: 'User Retention',
      value: 78.4,
      change: -2.1,
      trend: 'down',
      description: '7-day user retention rate'
    },
    {
      metric: 'Average Session',
      value: 24.7,
      change: 5.3,
      trend: 'up',
      description: 'Average session duration (minutes)'
    },
    {
      metric: 'Booking Conversion',
      value: 15.2,
      change: 1.8,
      trend: 'up',
      description: 'Users who completed bookings'
    },
    {
      metric: 'Churn Rate',
      value: 3.4,
      change: -0.5,
      trend: 'down',
      description: 'Monthly user churn rate'
    }
  ];

  // Get recent user activities
  const recentUserActivities = userEvents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  // Calculate user engagement by hour
  const engagementByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    active_users: Math.floor(Math.random() * 100) + 20,
    bookings: Math.floor(Math.random() * 20) + 5
  }));

  // Geographic distribution (mock data)
  const geographicData = [
    { location: 'Gaborone', users: 1250, bookings: 340, revenue: 85000 },
    { location: 'Francistown', users: 890, bookings: 220, revenue: 55000 },
    { location: 'Maun', users: 650, bookings: 180, revenue: 42000 },
    { location: 'Kasane', users: 420, bookings: 95, revenue: 28000 },
    { location: 'Selebi-Phikwe', users: 380, bookings: 85, revenue: 25000 }
  ];

  const MetricCard = ({ metric }: { metric: UserBehaviorMetric }) => {
    const IconComponent = TREND_ICONS[metric.trend];
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`flex items-center space-x-1 ${TREND_COLORS[metric.trend]}`}>
              <IconComponent className="h-4 w-4" />
              <span className="text-sm font-medium">
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof metric.value === 'number' && metric.value % 1 !== 0 
                ? metric.value.toFixed(1) 
                : metric.value}
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.metric}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {metric.description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ActivityCard = ({ event }: { event: SecurityEvent }) => {
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {event.event_type.replace('.', ' ').toUpperCase()}
            </p>
            <Badge variant="outline" className="capitalize">
              {event.severity}
            </Badge>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              User {event.target_id?.slice(0, 8)}...
            </span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </span>
          </div>
          {event.resource_type && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Resource: {event.resource_type}
            </p>
          )}
        </div>
      </div>
    );
  };

  const EngagementChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>User Engagement by Hour</CardTitle>
        <CardDescription>Active users and bookings throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {engagementByHour.slice(0, 12).map((hour, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-12 text-sm text-gray-600 dark:text-gray-400">
                {hour.hour}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(hour.active_users / 150 * 100, 100)}%` }}
                />
              </div>
              <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                {hour.active_users} users
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const GeographicCard = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>User and booking distribution by location</CardDescription>
          </div>
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {geographicData.map((location, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{location.location}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {location.users} users • {location.bookings} bookings
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  P{location.revenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Behavior Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Insights into user engagement and platform usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
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
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'engagement', label: 'Engagement', icon: Clock },
            { id: 'geographic', label: 'Geographic', icon: MapPin },
            { id: 'revenue', label: 'Revenue', icon: DollarSign }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === id
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

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {behaviorMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>

          {/* Recent User Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent User Activities</CardTitle>
                  <CardDescription>Latest user interactions and events</CardDescription>
                </div>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              {recentUserActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No recent user activities
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentUserActivities.map(event => (
                    <ActivityCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Engagement Tab */}
      {viewMode === 'engagement' && (
        <div className="space-y-6">
          <EngagementChart />
          
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>Detailed engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">4.2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Sessions/User</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24m</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session Duration</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">68%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">3.1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pages/Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Geographic Tab */}
      {viewMode === 'geographic' && <GeographicCard />}

      {/* Revenue Tab */}
      {viewMode === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">+15.3%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">P245,000</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">+8.7%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">P850</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue/User</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-purple-600 dark:text-purple-400">+12.1%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">P2,340</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Booking Value</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Location</CardTitle>
              <CardDescription>Revenue distribution across different locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geographicData.map((location, index) => {
                  const totalRevenue = 245000; // Mock total
                  const percentage = (location.revenue / totalRevenue) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {location.location}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          P{location.revenue.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
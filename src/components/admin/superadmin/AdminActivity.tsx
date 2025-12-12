import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Activity, Filter, TrendingUp, Users, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SecurityEvent } from "@/hooks/useSuperAdminAnalytics";

interface Props {
  events: SecurityEvent[];
  onRefresh: () => void;
  loading: boolean;
}

interface AdminActivity {
  admin_id: string;
  admin_email?: string;
  action_count: number;
  last_action: string;
  last_action_date: string;
  common_actions: Record<string, number>;
  severity_distribution: Record<string, number>;
}

const ACTION_COLORS = {
  'user.create': 'bg-blue-100 text-blue-800',
  'user.update': 'bg-yellow-100 text-yellow-800',
  'user.delete': 'bg-red-100 text-red-800',
  'role.assign': 'bg-purple-100 text-purple-800',
  'role.remove': 'bg-orange-100 text-orange-800',
  'security.login': 'bg-green-100 text-green-800',
  'security.logout': 'bg-gray-100 text-gray-800',
  'security.failed_login': 'bg-red-100 text-red-800',
  'audit.view': 'bg-indigo-100 text-indigo-800',
  'system.config': 'bg-cyan-100 text-cyan-800'
};

export const AdminActivity = ({ events, onRefresh, loading }: Props) => {
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'summary'>('timeline');

  // Filter admin-related events
  const adminEvents = events.filter(event => 
    event.actor_id && event.resource_type === 'admin'
  );

  // Get unique admin IDs
  const adminIds = Array.from(new Set(adminEvents.map(event => event.actor_id!)));

  // Get unique action types
  const actionTypes = Array.from(new Set(adminEvents.map(event => event.event_type)));

  // Filter events based on selected filters
  const filteredEvents = adminEvents.filter(event => {
    const adminMatch = filterAdmin === 'all' || event.actor_id === filterAdmin;
    const actionMatch = filterAction === 'all' || event.event_type === filterAction;
    return adminMatch && actionMatch;
  });

  // Calculate admin activity summary
  const adminActivitySummary = adminIds.reduce((acc, adminId) => {
    const adminEvents = events.filter(event => event.actor_id === adminId);
    const actionCounts = adminEvents.reduce((counts, event) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const severityCounts = adminEvents.reduce((counts, event) => {
      counts[event.severity] = (counts[event.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const latestEvent = adminEvents.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    acc[adminId] = {
      admin_id: adminId,
      action_count: adminEvents.length,
      last_action: latestEvent?.event_type || 'N/A',
      last_action_date: latestEvent?.created_at || '',
      common_actions: actionCounts,
      severity_distribution: severityCounts
    };

    return acc;
  }, {} as Record<string, AdminActivity>);

  // Get top active admins
  const topActiveAdmins = Object.values(adminActivitySummary)
    .sort((a, b) => b.action_count - a.action_count)
    .slice(0, 5);

  const ActivityCard = ({ event }: { event: SecurityEvent }) => {
    const actionColor = ACTION_COLORS[event.event_type as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800';
    
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className={`p-2 rounded-full ${actionColor}`}>
          <Activity className="h-4 w-4" />
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
              Admin {event.actor_id?.slice(0, 8)}...
            </span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </span>
          </div>
          {event.action_details && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Details: {JSON.stringify(event.action_details)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const AdminSummaryCard = ({ activity }: { activity: AdminActivity }) => {
    const mostCommonAction = Object.entries(activity.common_actions)
      .sort(([,a], [,b]) => b - a)[0];

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Admin {activity.admin_id.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.action_count} total actions
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Most Active
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Last Action:</span>
              <span className="font-medium">{activity.last_action}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Most Common:</span>
              <span className="font-medium">{mostCommonAction?.[0] || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Last Active:</span>
              <span className="font-medium">
                {activity.last_action_date ? 
                  formatDistanceToNow(new Date(activity.last_action_date), { addSuffix: true }) : 
                  'N/A'
                }
              </span>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Severity Distribution</p>
            <div className="flex space-x-2">
              {Object.entries(activity.severity_distribution).map(([severity, count]) => (
                <Badge 
                  key={severity} 
                  variant="outline" 
                  className="text-xs capitalize"
                >
                  {severity}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Activity</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track administrator actions and system management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('summary')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Summary
          </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Filters</CardTitle>
          <CardDescription>Filter admin activities by administrator and action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">All Admins</option>
                {adminIds.map(adminId => (
                  <option key={adminId} value={adminId}>
                    Admin {adminId.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">All Actions</option>
                {actionTypes.map(actionType => (
                  <option key={actionType} value={actionType}>
                    {actionType.replace('.', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Activity Summary */}
      {viewMode === 'summary' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Active Administrators</CardTitle>
                <CardDescription>Most active administrators by action count</CardDescription>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topActiveAdmins.map(activity => (
                <AdminSummaryCard key={activity.admin_id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Admin Activity Timeline</CardTitle>
                <CardDescription>Recent administrator actions ({filteredEvents.length} events)</CardDescription>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No admin activities found with current filters
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEvents.slice(0, 30).map(event => (
                  <ActivityCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Type Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Action Type Statistics</CardTitle>
              <CardDescription>Distribution of administrator actions by type</CardDescription>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {actionTypes.map(actionType => {
              const count = adminEvents.filter(e => e.event_type === actionType).length;
              const color = ACTION_COLORS[actionType as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800';
              
              return (
                <div key={actionType} className={`p-3 rounded-lg border ${color} border-current`}>
                  <div className="text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs font-medium uppercase">
                      {actionType.replace('.', ' ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
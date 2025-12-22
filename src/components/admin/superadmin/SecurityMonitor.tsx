import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, User, Calendar, Filter, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SecurityEvent } from "@/hooks/useSuperAdminAnalytics";

interface Props {
  events: SecurityEvent[];
  onRefresh: () => void;
  loading: boolean;
  isPreview?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  onPageChange?: (page: number) => void;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200"
};

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  high: Shield,
  medium: Shield,
  low: Shield
};

export const SecurityMonitor = ({ 
  events, 
  onRefresh, 
  loading, 
  isPreview = false,
  pagination,
  onPageChange,
  onNextPage,
  onPreviousPage
}: Props) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('all');

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.event_type)));

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    const severityMatch = filterSeverity === 'all' || event.severity === filterSeverity;
    const typeMatch = filterEventType === 'all' || event.event_type === filterEventType;
    return severityMatch && typeMatch;
  });

  // Get recent critical events
  const criticalEvents = events.filter(event => event.severity === 'critical').slice(0, 5);

  // Get event statistics
  const eventStats = events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Preview mode - show only recent critical events
  if (isPreview) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Recent Security Events
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {criticalEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-start space-x-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`p-1 rounded-full ${SEVERITY_COLORS[event.severity]}`}>
                <AlertTriangle className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {event.event_type}
                  </p>
                  <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[event.severity]}`}>
                    {event.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {criticalEvents.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              No critical security events in the last 24 hours
            </div>
          )}
        </div>
      </div>
    );
  }

  const EventCard = ({ event }: { event: SecurityEvent }) => {
    const IconComponent = SEVERITY_ICONS[event.severity];
    
    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className={`p-2 rounded-full ${SEVERITY_COLORS[event.severity]}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {event.event_type}
            </p>
            <Badge variant="outline" className={SEVERITY_COLORS[event.severity]}>
              {event.severity}
            </Badge>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {event.actor_id ? 'Admin' : 'System'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Monitor</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time security event monitoring</p>
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

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{eventStats.critical || 0}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Severity</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{eventStats.high || 0}</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medium/Low</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(eventStats.medium || 0) + (eventStats.low || 0)}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Event Filters</CardTitle>
          <CardDescription>Filter security events by severity and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">All Event Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Events Alert */}
      {criticalEvents.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700 dark:text-red-400">Critical Security Events</CardTitle>
            </div>
            <CardDescription>Recent critical security events requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security events ({filteredEvents.length} events)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No security events found with current filters
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEvents.slice(0, 20).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination && onPageChange && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={!pagination.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
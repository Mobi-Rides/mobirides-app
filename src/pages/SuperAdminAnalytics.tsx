import { useSuperAdminAnalytics } from "@/hooks/useSuperAdminAnalytics";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { AnalyticsCharts } from "@/components/admin/superadmin/AnalyticsCharts";
import { SecurityMonitor } from "@/components/admin/superadmin/SecurityMonitor";
import { AdminActivity } from "@/components/admin/superadmin/AdminActivity";
import { UserBehavior } from "@/components/admin/superadmin/UserBehavior";
import { AdvancedFilters, FilterOptions } from "@/components/admin/superadmin/AdvancedFilters";
import { SecurityAlertSystem, SecurityAlert, AlertSettings } from "@/components/admin/superadmin/SecurityAlertSystem";
import { MobileOptimizedChart } from "@/components/admin/superadmin/MobileOptimizedChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, Filter, BarChart3, Shield, Users, Activity, FileText, RefreshCw, Wifi, WifiOff, Bell } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";

export default function SuperAdminAnalytics() {
  const { 
    analytics, 
    events, 
    userMetrics, 
    systemMetrics, 
    securityMetrics,
    loading, 
    refreshData,
    exportAnalytics,
    dateRange,
    setDateRange
  } = useSuperAdminAnalytics();

  // Performance optimization hook
  const {
    data: optimizedEvents,
    loading: optimizedLoading,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    handleSort,
    handleFilterChange,
    loadMore
  } = usePerformanceOptimization(
    async (options) => {
      // Simulate API call with filters and pagination
      const filteredEvents = events.filter(event => {
        if (options.filters?.severityLevels?.length > 0) {
          return options.filters.severityLevels.includes(event.severity);
        }
        if (options.filters?.eventTypes?.length > 0) {
          return options.filters.eventTypes.includes(event.event_type);
        }
        return true;
      });
      
      const startIndex = (options.page - 1) * options.pageSize;
      const endIndex = startIndex + options.pageSize;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
      
      return {
        data: paginatedEvents,
        total: filteredEvents.length
      };
    },
    {
      enablePagination: true,
      debounceDelay: 300,
      enableCache: true,
      cacheTimeout: 60000,
      enableVirtualization: true,
      enableDebouncing: true,
      enableMemoization: true,
      enableLazyLoading: true,
      maxItemsPerPage: 20,
      maxVisibleItems: 100
    }
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showSecurityAlerts, setShowSecurityAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'admin' | 'users'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    dateRange: dateRange,
    severityLevels: [],
    eventTypes: [],
    actorIds: [],
    resourceTypes: [],
    searchTerm: '',
    status: 'all',
    userStatus: 'all'
  });

  // Security alerts state
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    critical_alerts: true,
    high_alerts: true,
    medium_alerts: true,
    low_alerts: false,
    sound_enabled: true,
    desktop_notifications: true,
    email_notifications: false,
    auto_dismiss_delay: 10
  });

  const handleExport = async (exportFormat: 'json' | 'csv' = 'json') => {
    const exportStartTime = Date.now();
    
    try {
      // Show loading state
      toast.loading('Preparing export data...', { id: 'export-loading' });
      
      const success = await exportAnalytics(exportFormat);
      
      if (success) {
        const exportTime = ((Date.now() - exportStartTime) / 1000).toFixed(1);
        toast.success(`Analytics data exported as ${exportFormat.toUpperCase()} (${exportTime}s)`, {
          id: 'export-loading',
          duration: 5000,
          description: `File includes data from ${dateRange.start} to ${dateRange.end}`
        });
      } else {
        toast.error('Failed to export analytics data', { id: 'export-loading' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.', { id: 'export-loading' });
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Security alert handlers
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success('Alert acknowledged');
  }, []);

  const handleAlertDismiss = useCallback((alertId: string) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.info('Alert dismissed');
  }, []);

  const handleAlertSettingsChange = useCallback((settings: AlertSettings) => {
    setAlertSettings(settings);
    toast.success('Alert settings updated');
  }, []);

  // Generate security alerts from events
  const generateSecurityAlerts = useCallback(() => {
    const criticalEvents = events.filter(event => 
      event.severity === 'critical' || event.severity === 'high'
    );
    
    const alerts: SecurityAlert[] = criticalEvents.map(event => ({
      id: event.id,
      title: `${event.event_type} Alert`,
      description: `Security event detected: ${(event as any).description || 'No description available'}`,
      severity: event.severity as 'critical' | 'high' | 'medium' | 'low',
      category: 'security',
      timestamp: new Date(event.created_at),
      source: event.actor_id || 'System',
      action_required: event.severity === 'critical' || event.severity === 'high',
      acknowledged: false,
      auto_dismiss: event.severity === 'low' || event.severity === 'medium',
      metadata: (event as any).metadata || {}
    }));
    
    setSecurityAlerts(alerts);
  }, [events]);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
        setLastUpdated(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshData]);

  // Update last updated time when data changes
  useEffect(() => {
    setLastUpdated(new Date());
  }, [analytics, events]);

  // Generate security alerts when events change
  useEffect(() => {
    generateSecurityAlerts();
  }, [events, generateSecurityAlerts]);

  // Listen for real-time event notifications
  useEffect(() => {
    const handleNewEvent = (event: CustomEvent) => {
      const { event: newEvent, message } = event.detail;
      
      // Show toast notification for new events
      if (newEvent.severity === 'critical') {
        toast.error(message, {
          duration: 5000,
          position: 'top-right',
        });
      } else if (newEvent.severity === 'high') {
        toast.warning(message, {
          duration: 4000,
          position: 'top-right',
        });
      }
    };

    window.addEventListener('analytics-new-event', handleNewEvent as EventListener);
    
    return () => {
      window.removeEventListener('analytics-new-event', handleNewEvent as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analytics data...</p>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive system analytics and insights for MobiRides platform
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {format(lastUpdated, 'HH:mm:ss')} {autoRefresh && <span className="text-green-600">• Real-time updates enabled</span>}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={showSecurityAlerts ? "destructive" : "outline"}
              size="sm"
              onClick={() => setShowSecurityAlerts(!showSecurityAlerts)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Security Alerts
              {securityAlerts.filter(a => !a.acknowledged).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {securityAlerts.filter(a => !a.acknowledged).length}
                </Badge>
              )}
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
              Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshData();
                setLastUpdated(new Date());
                toast.success('Data refreshed');
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      {showSecurityAlerts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityAlertSystem
              alerts={securityAlerts}
              settings={alertSettings}
              onAlertAcknowledge={handleAlertAcknowledge}
              onAlertDismiss={handleAlertDismiss}
              onSettingsChange={handleAlertSettingsChange}
              onRefresh={refreshData}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilters
          onFiltersChange={(filters) => {
            setAdvancedFilters(filters);
            setDateRange(filters.dateRange);
            handleFilterChange(filters);
          }}
          onClearFilters={() => {
            setAdvancedFilters({
              dateRange: dateRange,
              severityLevels: [],
              eventTypes: [],
              actorIds: [],
              resourceTypes: [],
              searchTerm: '',
              status: 'all',
              userStatus: 'all'
            });
            handleFilterChange({});
          }}
          initialFilters={advancedFilters}
        />
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Admin Activity</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>User Behavior</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userMetrics?.total_users || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(userMetrics as any)?.active_today ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {events.length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(systemMetrics as any)?.system_health ?? 'Good'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MobileOptimizedChart
              data={[]}
              title="User Growth Trend"
              type="line"
              height={300}
              responsive={true}
              onExport={(exportFormat) => handleExport(exportFormat as any)}
            />
            <MobileOptimizedChart
              data={[]}
              title="Booking Trends"
              type="bar"
              height={300}
              responsive={true}
              onExport={(exportFormat) => handleExport(exportFormat as any)}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MobileOptimizedChart
              data={Array.isArray(userMetrics?.role_distribution) ? userMetrics.role_distribution : []}
              title="User Role Distribution"
              type="pie"
              height={300}
              responsive={true}
              onExport={(exportFormat) => handleExport(exportFormat as any)}
            />
            <MobileOptimizedChart
              data={(analytics as any)?.bookingTrends || []}
              title="Booking Trends"
              type="line"
              height={300}
              responsive={true}
              onExport={(exportFormat) => handleExport(exportFormat as any)}
            />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Alert System */}
          {showSecurityAlerts && (
            <SecurityAlertSystem
              alerts={securityAlerts}
              settings={alertSettings}
              onAlertAcknowledge={(alertId) => {
                setSecurityAlerts(alerts => alerts.map(alert => 
                  alert.id === alertId ? {...alert, acknowledged: true} : alert
                ));
              }}
              onAlertDismiss={(alertId) => {
                setSecurityAlerts(alerts => alerts.filter(alert => alert.id !== alertId));
              }}
              onSettingsChange={setAlertSettings}
              onRefresh={refreshData}
              loading={loading}
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MobileOptimizedChart
              data={(securityMetrics as any)?.eventTypeCounts || []}
              title="Security Events by Type"
              type="pie"
              height={300}
              responsive={true}
            />
            <MobileOptimizedChart
              data={[
                { name: 'Critical', value: securityMetrics?.critical_events || 0 },
                { name: 'High', value: securityMetrics?.high_severity_events || 0 },
                { name: 'Medium', value: securityMetrics?.medium_severity_events || 0 },
                { name: 'Low', value: securityMetrics?.low_severity_events || 0 }
              ]}
              title="Security Events by Severity"
              type="pie"
              height={300}
              responsive={true}
            />
          </div>
          
          <SecurityMonitor 
            events={optimizedEvents}
            onRefresh={refreshData}
            loading={optimizedLoading || loading}
            pagination={pagination}
            onPageChange={goToPage}
            onNextPage={nextPage}
            onPreviousPage={previousPage}
          />
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <AdminActivity 
            events={optimizedEvents}
            onRefresh={refreshData}
            loading={optimizedLoading || loading}
            pagination={pagination}
            onPageChange={goToPage}
            onNextPage={nextPage}
            onPreviousPage={previousPage}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserBehavior 
            events={events}
            userMetrics={userMetrics}
            onRefresh={refreshData}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
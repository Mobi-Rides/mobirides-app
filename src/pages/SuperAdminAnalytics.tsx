import { useSuperAdminAnalytics } from "@/hooks/useSuperAdminAnalytics";
import { AnalyticsCharts } from "@/components/admin/superadmin/AnalyticsCharts";
import { SecurityMonitor } from "@/components/admin/superadmin/SecurityMonitor";
import { AdminActivity } from "@/components/admin/superadmin/AdminActivity";
import { UserBehavior } from "@/components/admin/superadmin/UserBehavior";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, Filter, BarChart3, Shield, Users, Activity, FileText, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

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

  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'admin' | 'users'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    const success = await exportAnalytics(format);
    if (success) {
      toast.success(`Analytics data exported as ${format.toUpperCase()}`);
    } else {
      toast.error('Failed to export analytics data');
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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

      {/* Date Range Filter */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Date Range Filter</CardTitle>
            <CardDescription>Filter analytics data by date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <Button
                onClick={refreshData}
                size="sm"
              >
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userMetrics?.active_today || 0}
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
                      {systemMetrics?.system_health || 'Good'}
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
          <AnalyticsCharts 
            analytics={analytics}
            userMetrics={userMetrics}
            systemMetrics={systemMetrics}
            securityMetrics={securityMetrics}
            onRefresh={refreshData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityMonitor 
            events={events}
            onRefresh={refreshData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <AdminActivity 
            events={events}
            onRefresh={refreshData}
            loading={loading}
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
  );
}
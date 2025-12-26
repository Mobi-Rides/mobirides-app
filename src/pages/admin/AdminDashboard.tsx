import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminStats } from "@/components/admin/AdminStats";
import { CarVerificationTable } from "@/components/admin/CarVerificationTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { KYCVerificationTable } from "@/components/admin/KYCVerificationTable";
import { RecentTransactionsTable } from "@/components/admin/RecentTransactionsTable";
import { CollapsibleSection } from "@/components/admin/CollapsibleSection";
import { AnalyticsCharts } from "@/components/admin/superadmin/AnalyticsCharts";
import { SecurityMonitor } from "@/components/admin/superadmin/SecurityMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Shield, Users } from "lucide-react";
import { useSuperAdminAnalytics } from "@/hooks/useSuperAdminAnalytics";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Use analytics hooks for dashboard data
  const {
    analytics,
    userMetrics,
    systemMetrics,
    securityMetrics,
    events,
    loading,
    refreshData
  } = useSuperAdminAnalytics();

  // Handle loading and error states
  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome to the Mobi Rides admin panel
              </p>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading analytics...</div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the Mobi Rides admin panel
            </p>
          </div>
          
          {/* Stats Overview */}
          <AdminStats />
          
          {/* Analytics Dashboard Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics Dashboard
              </h2>
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/analytics")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                View Full Analytics
              </Button>
            </div>
            
            {/* Quick Analytics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events?.length || 0}</div>
                <p className="text-xs text-muted-foreground">{events?.filter(e => e.severity === 'critical').length || 0} critical events</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userMetrics?.active_users || 0}</div>
                <p className="text-xs text-muted-foreground">{userMetrics?.new_users || 0} new today</p>
              </CardContent>
            </Card>
          </div>
            
            {/* Analytics Charts Preview */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>User registration and activity trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts 
                    analytics={analytics}
                    userMetrics={userMetrics}
                    systemMetrics={systemMetrics}
                    securityMetrics={securityMetrics}
                    onRefresh={refreshData}
                    loading={loading}
                    isPreview
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Security Monitor</CardTitle>
                  <CardDescription>Recent security events and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityMonitor 
                    events={events}
                    onRefresh={refreshData}
                    loading={loading}
                    isPreview
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Management Sections with Collapsible Views */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CollapsibleSection
              title="Car Verification Queue"
              onViewAll={() => navigate("/admin/cars")}
              previewContent={<CarVerificationTable isPreview maxItems={3} />}
            >
              <CarVerificationTable />
            </CollapsibleSection>
            
            <CollapsibleSection
              title="KYC Verification"
              onViewAll={() => navigate("/admin/verifications")}
              previewContent={<KYCVerificationTable isPreview maxItems={3} />}
            >
              <KYCVerificationTable />
            </CollapsibleSection>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <CollapsibleSection
              title="User Management"
              onViewAll={() => navigate("/admin/users")}
              previewContent={<UserManagementTable isPreview maxItems={3} />}
            >
              <UserManagementTable />
            </CollapsibleSection>
            
            <CollapsibleSection
              title="Recent Transactions"
              onViewAll={() => navigate("/admin/transactions")}
              previewContent={<RecentTransactionsTable isPreview maxItems={3} />}
            >
              <RecentTransactionsTable />
            </CollapsibleSection>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;
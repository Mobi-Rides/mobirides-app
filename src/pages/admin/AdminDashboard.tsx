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

const AdminDashboard = () => {
  const navigate = useNavigate();

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
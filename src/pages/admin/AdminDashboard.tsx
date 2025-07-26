import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminStats } from "@/components/admin/AdminStats";
import { CarVerificationTable } from "@/components/admin/CarVerificationTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { KYCVerificationTable } from "@/components/admin/KYCVerificationTable";
import { RecentTransactionsTable } from "@/components/admin/RecentTransactionsTable";

const AdminDashboard = () => {
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
          
          {/* Management Tables Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CarVerificationTable />
            <KYCVerificationTable />
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <UserManagementTable />
            <RecentTransactionsTable />
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;
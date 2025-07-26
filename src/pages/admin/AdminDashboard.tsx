import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminStats } from "@/components/admin/AdminStats";

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
          <AdminStats />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;
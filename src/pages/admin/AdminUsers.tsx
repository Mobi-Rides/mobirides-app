import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { UserManagementTable } from "@/components/admin/UserManagementTable";

const AdminUsers = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and account status
            </p>
          </div>
          <UserManagementTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminUsers;
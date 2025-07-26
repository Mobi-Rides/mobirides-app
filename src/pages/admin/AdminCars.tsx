import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { CarManagementTable } from "@/components/admin/CarManagementTable";

const AdminCars = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Car Management</h1>
            <p className="text-muted-foreground">
              Manage car listings, verification, and approval status
            </p>
          </div>
          <CarManagementTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminCars;
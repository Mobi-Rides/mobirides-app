import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { MessageManagementTable } from "@/components/admin/MessageManagementTable";

const AdminMessages = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Message Management</h1>
            <p className="text-muted-foreground">
              Monitor platform communications and moderate content
            </p>
          </div>
          <MessageManagementTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminMessages;
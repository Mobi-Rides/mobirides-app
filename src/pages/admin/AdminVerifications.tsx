import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { VerificationManagementTable } from "@/components/admin/VerificationManagementTable";

const AdminVerifications = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Verification Management</h1>
            <p className="text-muted-foreground">
              Review and approve KYC documents, license verifications
            </p>
          </div>
          <VerificationManagementTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminVerifications;
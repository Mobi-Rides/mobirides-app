import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ComplianceReportDashboard } from "@/components/admin/ComplianceReportDashboard";

const AdminCompliance = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Compliance Reports</h1>
            <p className="text-muted-foreground">
              Monthly signed audit reports for regulatory compliance (T4.3)
            </p>
          </div>
          <ComplianceReportDashboard />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminCompliance;

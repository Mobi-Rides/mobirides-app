import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { Shield } from "lucide-react";

const AdminAudit = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              Comprehensive audit trail with real-time monitoring and compliance reporting
            </p>
          </div>

          <AuditLogViewer />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminAudit;

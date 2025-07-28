import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { TransactionLedgerTable } from "@/components/admin/TransactionLedgerTable";

const AdminTransactions = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Transaction Ledger</h1>
            <p className="text-muted-foreground">
              Monitor all financial transactions, commissions, and wallet activity
            </p>
          </div>
          <TransactionLedgerTable />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminTransactions;
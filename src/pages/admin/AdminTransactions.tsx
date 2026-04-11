
import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { TransactionLedgerTable } from "@/components/admin/TransactionLedgerTable";
import { PaymentTransactionsTable } from "@/components/admin/finance/PaymentTransactionsTable";
import { WithdrawalRequestsTable } from "@/components/admin/finance/WithdrawalRequestsTable";
import { InsuranceRemittanceTable } from "@/components/admin/finance/InsuranceRemittanceTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminTransactions = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor payments, withdrawals, ledger, and insurance remittance.
            </p>
          </div>

          <Tabs defaultValue="ledger" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ledger">Ledger (Wallet Ops)</TabsTrigger>
              <TabsTrigger value="payments">Inbound Payments</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="insurance">Insurance Remittance</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="space-y-4">
              <TransactionLedgerTable />
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <PaymentTransactionsTable />
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              <WithdrawalRequestsTable />
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <InsuranceRemittanceTable />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminTransactions;

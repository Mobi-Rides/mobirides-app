import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, DollarSign, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
  booking_id: string | null;
  payment_method: string | null;
  host_wallets?: {
    host_id: string;
    profiles?: {
      full_name: string | null;
    };
  };
}

const useAdminTransactions = () => {
  return useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select(`
          id, amount, transaction_type, status, description, created_at, 
          booking_id, payment_method,
          host_wallets:wallet_id (
            host_id,
            profiles:host_id (full_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const TransactionLedgerTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: transactions, isLoading, error } = useAdminTransactions();

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.host_wallets?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "top_up":
      case "earning":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "commission":
      case "withdrawal":
        return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const totalRevenue = filteredTransactions
    .filter(t => t.transaction_type === "commission" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load transactions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">P{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Commission earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <span className="capitalize">
                          {transaction.transaction_type.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.host_wallets?.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium">
                      P{Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description || "N/A"}</TableCell>
                    <TableCell>{transaction.payment_method || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
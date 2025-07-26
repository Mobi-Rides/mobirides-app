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
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
  status: string;
  wallet_id: string;
  host_wallets?: {
    host_id: string;
    profiles?: {
      full_name: string | null;
    } | null;
  } | null;
}

const useRecentTransactions = () => {
  return useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select(`
          id, transaction_type, amount, description, created_at, status, wallet_id,
          host_wallets:wallet_id (
            host_id,
            profiles:host_id (full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
};

interface RecentTransactionsTableProps {
  isPreview?: boolean;
  maxItems?: number;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ 
  isPreview = false, 
  maxItems = 5 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transactions, isLoading, error } = useRecentTransactions();

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.host_wallets?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayTransactions = isPreview ? filteredTransactions.slice(0, maxItems) : filteredTransactions;

  const getTransactionIcon = (type: string) => {
    return type === "credit" || type === "top_up" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === "credit" || type === "top_up" ? "text-green-600" : "text-red-600";
  };

  const renderTransactionRow = (transaction: Transaction) => (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium">
        {transaction.host_wallets?.profiles?.full_name || "Unknown"}
      </TableCell>
      <TableCell>
        {new Date(transaction.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {transaction.description || transaction.transaction_type}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getTransactionIcon(transaction.transaction_type)}
          <Badge variant={
            transaction.transaction_type === "credit" || transaction.transaction_type === "top_up" 
              ? "default" 
              : "destructive"
          }>
            {transaction.transaction_type === "commission_deduction" ? "Debit" : "Credit"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
          {transaction.transaction_type === "commission_deduction" ? "-" : "+"}
          P{Math.abs(transaction.amount).toFixed(2)}
        </span>
      </TableCell>
    </TableRow>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load recent transactions</p>
        </CardContent>
      </Card>
    );
  }

  if (!isPreview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Recent Transactions ({filteredTransactions.length})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-6" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-[80px] ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.map((transaction) => renderTransactionRow(transaction))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recent transactions
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Preview mode
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No recent transactions
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTransactions.map((transaction) => renderTransactionRow(transaction))}
        </TableBody>
      </Table>
    </div>
  );
};
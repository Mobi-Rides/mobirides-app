import React, { useState, useMemo } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHead } from "./SortableTableHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, Download } from "lucide-react";
import { exportToCSV, buildExportFilename } from "@/utils/exportToCSV";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isPreview ? maxItems : 5;
  const { data: transactions, isLoading, error } = useRecentTransactions();

  const filteredTransactions = useMemo(() => transactions?.filter(transaction =>
    transaction.host_wallets?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [transactions, searchTerm]);

  const { sortedData: sortedTransactions, sortKey, sortDirection, handleSort } = useTableSort<Transaction>(filteredTransactions);
  
  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const displayTransactions = isPreview ? sortedTransactions.slice(0, maxItems) : paginatedTransactions;
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

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

  const handleExport = () => {
    const rows = sortedTransactions.map((t) => ({
      txn_id: t.id,
      user: t.host_wallets?.profiles?.full_name ?? "Unknown",
      date: new Date(t.created_at).toLocaleDateString(),
      description: t.description ?? t.transaction_type,
      type: t.transaction_type === "commission_deduction" ? "Debit" : "Credit",
      amount_bwp:
        (t.transaction_type === "commission_deduction" ? "-" : "+") +
        Math.abs(t.amount).toFixed(2),
      status: t.status,
    }));
    const columns = [
      { key: "txn_id", label: "Transaction ID" },
      { key: "user", label: "User" },
      { key: "date", label: "Date" },
      { key: "description", label: "Description" },
      { key: "type", label: "Type" },
      { key: "amount_bwp", label: "Amount (BWP)" },
      { key: "status", label: "Status" },
    ];
    exportToCSV(rows, buildExportFilename("transactions"), columns);
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              {sortedTransactions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
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
                    <SortableTableHead sortKey="host_wallets.profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>User</SortableTableHead>
                    <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Date</SortableTableHead>
                    <SortableTableHead sortKey="description" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Description</SortableTableHead>
                    <SortableTableHead sortKey="transaction_type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Type</SortableTableHead>
                    <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Amount</SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.map((transaction) => renderTransactionRow(transaction))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && filteredTransactions.length > 0 && !isPreview && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length}{" "}
                entries
              </div>
              {totalPages > 1 && (
                <div className="order-1 sm:order-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
            <SortableTableHead sortKey="host_wallets.profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>User</SortableTableHead>
            <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Date</SortableTableHead>
            <SortableTableHead sortKey="description" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Description</SortableTableHead>
            <SortableTableHead sortKey="transaction_type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Type</SortableTableHead>
            <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Amount</SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTransactions.map((transaction) => renderTransactionRow(transaction))}
        </TableBody>
      </Table>
    </div>
  );
};
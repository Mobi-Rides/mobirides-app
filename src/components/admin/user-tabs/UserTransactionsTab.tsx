import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface UserTransactionsTabProps {
  userId: string;
}

const useUserWalletData = (userId: string) => {
  return useQuery({
    queryKey: ["user-wallet", userId],
    queryFn: async () => {
      // Get wallet info
      const { data: wallet, error: walletError } = await supabase
        .from("host_wallets")
        .select("*")
        .eq("host_id", userId)
        .single();

      // Get transactions
      const { data: transactions, error: transError } = await supabase
        .from("wallet_transactions")
        .select(`
          *,
          host_wallets!inner (host_id)
        `)
        .eq("host_wallets.host_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      return {
        wallet: walletError ? null : wallet,
        transactions: transError ? [] : (transactions || []),
      };
    },
  });
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "topup":
    case "payment_received":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "deduction":
    case "commission":
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <DollarSign className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTransactionBadgeVariant = (type: string) => {
  switch (type) {
    case "topup":
    case "payment_received":
      return "default";
    case "deduction":
    case "commission":
      return "destructive";
    default:
      return "outline";
  }
};

export const UserTransactionsTab = ({ userId }: UserTransactionsTabProps) => {
  const { data, isLoading, error } = useUserWalletData(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load wallet data</p>
        </CardContent>
      </Card>
    );
  }

  const { wallet, transactions } = data || {};
  const totalTransactions = transactions?.length || 0;
  const totalTopUps = transactions?.filter(t => t.transaction_type === "topup").length || 0;
  const totalDeductions = transactions?.filter(t => t.transaction_type === "deduction").length || 0;

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              P{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm text-muted-foreground">Current Balance</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalTransactions}
            </div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalTopUps}
            </div>
            <div className="text-sm text-muted-foreground">Top-ups</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {totalDeductions}
            </div>
            <div className="text-sm text-muted-foreground">Deductions</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {!wallet ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No wallet found for this user</p>
              <p className="text-sm text-muted-foreground mt-1">
                User needs to have host role to have a wallet
              </p>
            </div>
          ) : transactions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found
            </p>
          ) : (
            <div className="space-y-3">
              {transactions?.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {transaction.description || transaction.transaction_type}
                          </span>
                          <Badge variant={getTransactionBadgeVariant(transaction.transaction_type)}>
                            {transaction.transaction_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                          {transaction.booking_reference && (
                            <span className="ml-2">
                              Booking: {transaction.booking_reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.transaction_type === "topup" || transaction.transaction_type === "payment_received"
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {transaction.transaction_type === "topup" || transaction.transaction_type === "payment_received" 
                          ? "+" 
                          : "-"
                        }P{Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Balance: P{transaction.balance_after.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, Minus } from "lucide-react";

export const WalletTransactionHistory = () => {
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
    }
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["wallet-transactions", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      return await walletService.getTransactionHistory(currentUser.id, 10);
    },
    enabled: !!currentUser?.id
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "top_up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "fee_deduction":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "refund":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "withdrawal":
        return <Minus className="h-4 w-4 text-orange-500" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "top_up":
        return "Top Up";
      case "fee_deduction":
        return "Platform Fee";
      case "refund":
        return "Refund";
      case "withdrawal":
        return "Withdrawal";
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Your transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {getTransactionTypeLabel(transaction.transaction_type)}
                  </p>
                  <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.created_at), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.amount > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Balance: ${transaction.balance_after.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

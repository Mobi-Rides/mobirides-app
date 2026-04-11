
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CreditCard, Eye } from "lucide-react";
import { TransactionJourneyDialog } from "./TransactionJourneyDialog";

interface PaymentTransaction {
  id: string;
  booking_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  status: string;
  provider_reference: string | null;
  created_at: string;
  platform_commission: number | null;
  host_earnings: number | null;
  profiles: {
    full_name: string | null;
  } | null;
}

const usePaymentTransactions = () => {
  return useQuery({
    queryKey: ["admin-payment-transactions"],
    queryFn: async (): Promise<PaymentTransaction[]> => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set((data || []).map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(txn => ({
        ...txn,
        profiles: profileMap.get(txn.user_id) ? {
          full_name: profileMap.get(txn.user_id)!.full_name,
        } : null,
      })) as PaymentTransaction[];
    },
  });
};

export const PaymentTransactionsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [journeyBookingId, setJourneyBookingId] = useState<string | null>(null);
  const { data: transactions, isLoading, error } = usePaymentTransactions();

  const filteredTransactions = transactions?.filter(txn =>
    txn.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.provider_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default"; // Greenish usually
      case "pending": return "secondary";
      case "initiated": return "outline";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Failed to load payment transactions
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Inbound Payments ({filteredTransactions.length})
          </CardTitle>
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
                  <TableHead>Renter</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Provider Ref</TableHead>
                  <TableHead>Split (Host/Plat)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{txn.profiles?.full_name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {txn.currency} {Number(txn.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(txn.status)}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {txn.payment_method.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {txn.provider_reference || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {txn.status === 'completed' ? (
                        <div className="flex flex-col">
                          <span className="text-green-600">H: {txn.host_earnings}</span>
                          <span className="text-blue-600">P: {txn.platform_commission}</span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {txn.booking_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setJourneyBookingId(txn.booking_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Journey
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <TransactionJourneyDialog
        isOpen={!!journeyBookingId}
        onClose={() => setJourneyBookingId(null)}
        bookingId={journeyBookingId}
      />
    </div>
  );
};

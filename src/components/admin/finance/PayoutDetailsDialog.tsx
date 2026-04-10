import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  withdrawalId: string | null;
  onClose: () => void;
}

const usePayoutDetails = (id: string | null) =>
  useQuery({
    queryKey: ["admin-payout-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: req, error } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:host_id (full_name, phone_number)")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const { data: wallet } = await supabase
        .from("host_wallets")
        .select("balance, total_earned, total_withdrawn")
        .eq("host_id", req.host_id)
        .single();

      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("id, amount, transaction_type, status, created_at")
        .eq("wallet_id", req.wallet_id ?? "")
        .order("created_at", { ascending: false })
        .limit(5);

      return { req, wallet, txns };
    },
  });

export const PayoutDetailsDialog = ({ withdrawalId, onClose }: Props) => {
  const { data, isLoading } = usePayoutDetails(withdrawalId);

  return (
    <Dialog open={!!withdrawalId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payout Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Host</span>
              <span>{data.req.profiles?.full_name || "—"}</span>
              <span className="text-muted-foreground">Phone</span>
              <span>{data.req.profiles?.phone_number || "—"}</span>
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{data.req.currency} {Number(data.req.amount).toFixed(2)}</span>
              <span className="text-muted-foreground">Method</span>
              <span className="capitalize">{data.req.payout_method?.replace("_", " ")}</span>
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{data.req.status}</Badge>
              <span className="text-muted-foreground">Requested</span>
              <span>{new Date(data.req.created_at).toLocaleString()}</span>
            </div>
            {data.wallet && (
              <div className="border rounded p-3 space-y-1">
                <p className="font-medium">Wallet Summary</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Balance</p><p className="font-semibold">P{Number(data.wallet.balance).toFixed(2)}</p></div>
                  <div><p className="text-muted-foreground">Total Earned</p><p>P{Number(data.wallet.total_earned).toFixed(2)}</p></div>
                  <div><p className="text-muted-foreground">Withdrawn</p><p>P{Number(data.wallet.total_withdrawn).toFixed(2)}</p></div>
                </div>
              </div>
            )}
            {data.txns && data.txns.length > 0 && (
              <div>
                <p className="font-medium mb-1">Recent Transactions</p>
                {data.txns.map((t: any) => (
                  <div key={t.id} className="flex justify-between text-xs border-b py-1">
                    <span className="capitalize">{t.transaction_type.replace("_", " ")}</span>
                    <span>P{Number(t.amount).toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-destructive text-sm">Failed to load payout details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

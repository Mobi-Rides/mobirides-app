
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { walletService } from "@/services/walletService";
import { commissionService } from "@/services/commissionService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";
import { TopUpModal } from "./TopUpModal";

interface WalletBalanceIndicatorProps {
  bookingTotal?: number;
  showCommissionBreakdown?: boolean;
  compact?: boolean;
}

export const WalletBalanceIndicator = ({ 
  bookingTotal, 
  showCommissionBreakdown = false,
  compact = false 
}: WalletBalanceIndicatorProps) => {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: walletBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["wallet-balance", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      return await walletService.getWalletBalance(currentUser.id);
    },
    enabled: !!currentUser?.id
  });

  const { data: commissionCalc } = useQuery({
    queryKey: ["commission-calculation", bookingTotal],
    queryFn: async () => {
      if (!bookingTotal) return null;
      return await commissionService.calculateCommission(bookingTotal);
    },
    enabled: !!bookingTotal
  });

  const { data: acceptanceCheck } = useQuery({
    queryKey: ["booking-acceptance-check", currentUser?.id, bookingTotal],
    queryFn: async () => {
      if (!currentUser?.id || !bookingTotal) return null;
      return await commissionService.checkHostCanAcceptBooking(currentUser.id, bookingTotal);
    },
    enabled: !!currentUser?.id && !!bookingTotal
  });

  const currentBalance = walletBalance?.balance || 0;
  const commissionAmount = commissionCalc?.commissionAmount || 0;
  const canAcceptBooking = acceptanceCheck?.canAccept ?? true;

  const handleTopUpSuccess = () => {
    refetchBalance();
    setIsTopUpModalOpen(false);
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">P{currentBalance.toFixed(2)}</span>
          {bookingTotal && !canAcceptBooking && (
            <Badge variant="destructive" className="text-xs">
              Insufficient Funds
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTopUpModalOpen(true)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onSuccess={handleTopUpSuccess}
          currentBalance={currentBalance}
        />
      </>
    );
  }

  return (
    <>
      <Card className={`${!canAcceptBooking ? 'border-destructive bg-destructive/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Wallet Balance</h3>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold">P{currentBalance.toFixed(2)}</p>
                
                {showCommissionBreakdown && commissionCalc && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Booking Total: P{commissionCalc.bookingTotal.toFixed(2)}</p>
                    <p>Commission ({(commissionCalc.commissionRate * 100).toFixed(1)}%): -P{commissionCalc.commissionAmount.toFixed(2)}</p>
                    <p className="font-medium text-foreground">You'll receive: P{commissionCalc.hostReceives.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {!canAcceptBooking && acceptanceCheck?.message && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{acceptanceCheck.message}</p>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTopUpModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Top Up
            </Button>
          </div>
        </CardContent>
      </Card>

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
        currentBalance={currentBalance}
      />
    </>
  );
};


import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Plus } from "lucide-react";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { TopUpModal } from "./TopUpModal";
import { WithdrawalForm } from "@/components/wallet/WithdrawalForm";

export const WalletBalanceCard = () => {
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
    }
  });

  const { data: walletBalance, isLoading, refetch } = useQuery({
    queryKey: ["wallet-balance", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      return await walletService.getWalletBalance(currentUser.id);
    },
    enabled: !!currentUser?.id
  });

  const handleTopUpSuccess = () => {
    refetch();
    setShowTopUpModal(false);
  };
  
  const handleWithdrawalSuccess = () => {
    refetch();
    // setShowWithdrawalModal(false); // Handled inside form onClose usually, but safe to do here
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  const balance = walletBalance?.balance || 0;
  // @ts-ignore - pending_balance added in migration but type might not be updated yet
  const pendingBalance = walletBalance?.pending_balance || 0;
  const isLowBalance = balance < 50; // Changed from 200 to 50 BWP

  return (
    <>
      <Card className={isLowBalance ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Available to Withdraw</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  P{balance.toFixed(2)}
                </span>
                {isLowBalance && (
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Low Balance
                  </span>
                )}
              </div>
            </div>

            {pendingBalance > 0 && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pending Earnings</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    P{pendingBalance.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Released 24h after rental completion
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                onClick={() => setShowTopUpModal(true)} 
                size="sm" 
                variant={isLowBalance ? "default" : "outline"}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Top Up
              </Button>
              <Button 
                onClick={() => setShowWithdrawalModal(true)}
                size="sm" 
                variant="outline"
                className="w-full"
                disabled={balance < 200} // Minimum withdrawal
              >
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TopUpModal 
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={handleTopUpSuccess}
        currentBalance={balance}
      />
      
      <WithdrawalForm
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={balance}
        onSuccess={handleWithdrawalSuccess}
      />
    </>
  );
};

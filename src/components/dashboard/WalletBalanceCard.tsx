
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Plus } from "lucide-react";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { TopUpModal } from "./TopUpModal";

export const WalletBalanceCard = () => {
  const [showTopUpModal, setShowTopUpModal] = useState(false);

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
  const isLowBalance = balance < 50;

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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${balance.toFixed(2)}
              </span>
              {isLowBalance && (
                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Low Balance
                </span>
              )}
            </div>
            <Button 
              onClick={() => setShowTopUpModal(true)} 
              size="sm" 
              className="w-full"
              variant={isLowBalance ? "default" : "outline"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Top Up Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      <TopUpModal 
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={handleTopUpSuccess}
        currentBalance={balance}
      />
    </>
  );
};


import { WalletBalanceCard } from "@/components/dashboard/WalletBalanceCard";
import { WalletTransactionHistory } from "@/components/dashboard/WalletTransactionHistory";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet & Earnings</h1>
            <p className="text-muted-foreground mt-1">Manage your wallet balance and view transaction history</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2" data-tutorial-target="wallet-balance">
          <WalletBalanceCard />
          <WalletTransactionHistory />
        </div>
      </div>
    </div>
  );
};

export default Wallet;

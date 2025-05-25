
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WalletBalanceCard } from "@/components/dashboard/WalletBalanceCard";
import { WalletTransactionHistory } from "@/components/dashboard/WalletTransactionHistory";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Redirect if not a host
  if (profile && profile.role !== 'host') {
    navigate('/profile');
    return null;
  }

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

        <div className="grid gap-8 md:grid-cols-2">
          <WalletBalanceCard />
          <WalletTransactionHistory />
        </div>
      </div>
    </div>
  );
};

export default Wallet;

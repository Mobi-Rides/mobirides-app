
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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Wallet & Earnings</h1>
            <p className="text-muted-foreground">Manage your wallet balance and view transaction history</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <WalletBalanceCard />
            </div>
            <div className="space-y-6">
              <WalletTransactionHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;

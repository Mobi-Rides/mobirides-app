
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WalletBalance {
  id: string;
  balance: number;
  currency: string;
}

export const getWalletBalance = async (hostId: string): Promise<WalletBalance | null> => {
  try {
    console.log("WalletBalance: Fetching wallet balance for host:", hostId);
    
    const { data, error } = await supabase
      .from("host_wallets")
      .select("id, balance, currency")
      .eq("host_id", hostId)
      .single();

    if (error) {
      console.error("WalletBalance: Error fetching wallet balance:", error);
      
      if (error.code === 'PGRST116') {
        console.log("WalletBalance: No wallet found, creating new wallet for host:", hostId);
        const createResult = await createWalletForHost(hostId);
        if (createResult) {
          return await getWalletBalance(hostId);
        }
      }
      return null;
    }

    console.log("WalletBalance: Wallet balance fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("WalletBalance: Unexpected error in getWalletBalance:", error);
    return null;
  }
};

export const createWalletForHost = async (hostId: string): Promise<boolean> => {
  try {
    console.log("WalletBalance: Creating wallet for host:", hostId);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== hostId) {
      console.error("WalletBalance: Authentication error or user mismatch:", authError);
      toast.error("Authentication required to create wallet");
      return false;
    }

    const { data, error } = await supabase
      .from("host_wallets")
      .insert({
        host_id: hostId,
        balance: 0.00,
        currency: "BWP"
      })
      .select()
      .single();

    if (error) {
      console.error("WalletBalance: Error creating wallet:", error);
      if (error.code === '23505') {
        console.log("WalletBalance: Wallet already exists, this is normal");
        return true;
      }
      toast.error("Failed to create wallet. Please try again.");
      return false;
    }

    console.log("WalletBalance: Wallet created successfully:", data);
    toast.success("Wallet created successfully");
    return true;
  } catch (error) {
    console.error("WalletBalance: Unexpected error in createWalletForHost:", error);
    toast.error("An unexpected error occurred while creating wallet");
    return false;
  }
};

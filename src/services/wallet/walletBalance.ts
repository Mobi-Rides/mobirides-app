
import { supabase } from "@/integrations/supabase/client";

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
        console.log("WalletBalance: Creating new wallet for host:", hostId);
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
      return false;
    }

    console.log("WalletBalance: Wallet created successfully:", data);
    return true;
  } catch (error) {
    console.error("WalletBalance: Unexpected error in createWalletForHost:", error);
    return false;
  }
};

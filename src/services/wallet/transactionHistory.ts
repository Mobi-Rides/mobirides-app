
import { supabase } from "@/integrations/supabase/client";

export interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  payment_method?: string;
  status: string;
  created_at: string;
  booking_id?: string;
}

export class TransactionHistory {
  async getTransactionHistory(hostId: string, limit = 20): Promise<WalletTransaction[]> {
    try {
      console.log("TransactionHistory: Fetching transaction history for host:", hostId, "limit:", limit);
      
      const { data: wallet } = await supabase
        .from("host_wallets")
        .select("id")
        .eq("host_id", hostId)
        .single();

      if (!wallet) {
        console.log("TransactionHistory: No wallet found for host, returning empty transactions");
        return [];
      }

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("TransactionHistory: Error fetching transaction history:", error);
        return [];
      }

      console.log("TransactionHistory: Transaction history fetched successfully:", data?.length || 0, "transactions");
      return data || [];
    } catch (error) {
      console.error("TransactionHistory: Unexpected error in getTransactionHistory:", error);
      return [];
    }
  }
}

export const transactionHistory = new TransactionHistory();

import { getWalletBalance, createWalletForHost } from "./wallet/walletBalance";
import { topUpWallet } from "./wallet/walletTopUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type { WalletBalance } from "./wallet/walletBalance";
export type { TopUpRequest } from "./wallet/walletTopUp";

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

class WalletService {
  async getWalletBalance(hostId: string) {
    return getWalletBalance(hostId);
  }

  async topUpWallet(hostId: string, request: any) {
    return topUpWallet(hostId, request);
  }

  async getTransactionHistory(hostId: string, limit = 20): Promise<WalletTransaction[]> {
    try {
      console.log("WalletService: Fetching transaction history for host:", hostId, "limit:", limit);
      
      const { data: wallet } = await supabase
        .from("host_wallets")
        .select("id")
        .eq("host_id", hostId)
        .single();

      if (!wallet) {
        console.log("WalletService: No wallet found for host, returning empty transactions");
        return [];
      }

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("WalletService: Error fetching transaction history:", error);
        return [];
      }

      console.log("WalletService: Transaction history fetched successfully:", data?.length || 0, "transactions");
      return data || [];
    } catch (error) {
      console.error("WalletService: Unexpected error in getTransactionHistory:", error);
      return [];
    }
  }

  async deductBookingFee(hostId: string, bookingId: string, feeAmount: number): Promise<boolean> {
    try {
      console.log("WalletService: Deducting booking fee", { hostId, bookingId, feeAmount });
      
      const wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletService: Wallet not found for fee deduction");
        return false;
      }

      if (wallet.balance < feeAmount) {
        console.error("WalletService: Insufficient balance for fee deduction", { balance: wallet.balance, required: feeAmount });
        toast.error("Insufficient wallet balance for booking fee");
        return false;
      }

      const newBalance = wallet.balance - feeAmount;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("host_wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id);

      if (walletError) {
        console.error("WalletService: Error updating wallet balance for fee deduction:", walletError);
        return false;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          booking_id: bookingId,
          transaction_type: "fee_deduction",
          amount: -feeAmount,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Booking platform fee`,
          status: "completed"
        });

      if (transactionError) {
        console.error("WalletService: Error recording fee transaction:", transactionError);
        return false;
      }

      console.log("WalletService: Booking fee deducted successfully");
      return true;
    } catch (error) {
      console.error("WalletService: Unexpected error in deductBookingFee:", error);
      return false;
    }
  }

  async deductBookingCommission(hostId: string, bookingId: string, commissionAmount: number): Promise<boolean> {
    try {
      console.log("WalletService: Deducting booking commission", { hostId, bookingId, commissionAmount });
      
      const wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletService: Wallet not found for commission deduction");
        return false;
      }

      if (wallet.balance < commissionAmount) {
        console.error("WalletService: Insufficient balance for commission deduction", { 
          balance: wallet.balance, 
          required: commissionAmount 
        });
        toast.error("Insufficient wallet balance for booking commission");
        return false;
      }

      const newBalance = wallet.balance - commissionAmount;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("host_wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id);

      if (walletError) {
        console.error("WalletService: Error updating wallet balance for commission deduction:", walletError);
        return false;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          booking_id: bookingId,
          transaction_type: "commission_deduction",
          amount: -commissionAmount,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Booking platform commission`,
          status: "completed"
        });

      if (transactionError) {
        console.error("WalletService: Error recording commission transaction:", transactionError);
        return false;
      }

      console.log("WalletService: Booking commission deducted successfully");
      return true;
    } catch (error) {
      console.error("WalletService: Unexpected error in deductBookingCommission:", error);
      return false;
    }
  }

  async createWalletForHost(hostId: string) {
    return createWalletForHost(hostId);
  }

  async addTestFunds(hostId: string, amount: number): Promise<boolean> {
    console.log("WalletService: Adding test funds:", { hostId, amount });
    return await this.topUpWallet(hostId, {
      amount,
      payment_method: "test",
      payment_reference: `TEST_${Date.now()}`
    });
  }

  async resetWallet(hostId: string): Promise<boolean> {
    try {
      console.log("WalletService: Resetting wallet for host:", hostId);
      
      const wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.log("WalletService: No wallet found to reset");
        return false;
      }

      const { error } = await supabase
        .from("host_wallets")
        .update({ balance: 0.00, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      if (error) {
        console.error("WalletService: Error resetting wallet:", error);
        return false;
      }

      console.log("WalletService: Wallet reset successfully");
      toast.success("Wallet reset to P0.00");
      return true;
    } catch (error) {
      console.error("WalletService: Error in resetWallet:", error);
      return false;
    }
  }
}

export const walletService = new WalletService();

// Development helpers - available in console
if (typeof window !== 'undefined') {
  (window as any).walletService = walletService;
  console.log('WalletService available in console for testing');
}

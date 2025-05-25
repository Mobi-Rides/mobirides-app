
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

export interface WalletBalance {
  id: string;
  balance: number;
  currency: string;
}

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

export interface TopUpRequest {
  amount: number;
  payment_method: string;
  payment_reference?: string;
}

class WalletService {
  async getWalletBalance(hostId: string): Promise<WalletBalance | null> {
    try {
      const { data, error } = await supabase
        .from("host_wallets")
        .select("id, balance, currency")
        .eq("host_id", hostId)
        .single();

      if (error) {
        console.error("Error fetching wallet balance:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      return null;
    }
  }

  async getTransactionHistory(hostId: string, limit = 20): Promise<WalletTransaction[]> {
    try {
      const { data: wallet } = await supabase
        .from("host_wallets")
        .select("id")
        .eq("host_id", hostId)
        .single();

      if (!wallet) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching transaction history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getTransactionHistory:", error);
      return [];
    }
  }

  async topUpWallet(hostId: string, request: TopUpRequest): Promise<boolean> {
    try {
      // First get the current wallet
      const wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        toast.error("Wallet not found");
        return false;
      }

      const newBalance = wallet.balance + request.amount;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("host_wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id);

      if (walletError) {
        console.error("Error updating wallet balance:", walletError);
        return false;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          transaction_type: "top_up",
          amount: request.amount,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Wallet top-up via ${request.payment_method}`,
          payment_method: request.payment_method,
          payment_reference: request.payment_reference,
          status: "completed"
        });

      if (transactionError) {
        console.error("Error recording transaction:", transactionError);
        return false;
      }

      toast.success(`Successfully added $${request.amount} to your wallet`);
      return true;
    } catch (error) {
      console.error("Error in topUpWallet:", error);
      toast.error("Failed to top up wallet");
      return false;
    }
  }

  async deductBookingFee(hostId: string, bookingId: string, feeAmount: number): Promise<boolean> {
    try {
      const wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.error("Wallet not found for host:", hostId);
        return false;
      }

      if (wallet.balance < feeAmount) {
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
        console.error("Error updating wallet balance:", walletError);
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
        console.error("Error recording transaction:", transactionError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deductBookingFee:", error);
      return false;
    }
  }

  async createWalletForHost(hostId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("host_wallets")
        .insert({
          host_id: hostId,
          balance: 0.00,
          currency: "USD"
        });

      if (error) {
        console.error("Error creating wallet:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in createWalletForHost:", error);
      return false;
    }
  }
}

export const walletService = new WalletService();


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      console.log("Fetching wallet balance for host:", hostId);
      
      const { data, error } = await supabase
        .from("host_wallets")
        .select("id, balance, currency")
        .eq("host_id", hostId)
        .single();

      if (error) {
        console.error("Error fetching wallet balance:", error);
        
        // If wallet doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log("Creating new wallet for host:", hostId);
          const createResult = await this.createWalletForHost(hostId);
          if (createResult) {
            // Retry fetching after creation
            return await this.getWalletBalance(hostId);
          }
        }
        return null;
      }

      console.log("Wallet balance fetched:", data);
      return data;
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      return null;
    }
  }

  async getTransactionHistory(hostId: string, limit = 20): Promise<WalletTransaction[]> {
    try {
      console.log("Fetching transaction history for host:", hostId);
      
      const { data: wallet } = await supabase
        .from("host_wallets")
        .select("id")
        .eq("host_id", hostId)
        .single();

      if (!wallet) {
        console.log("No wallet found for host");
        return [];
      }

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

      console.log("Transaction history fetched:", data?.length || 0, "transactions");
      return data || [];
    } catch (error) {
      console.error("Error in getTransactionHistory:", error);
      return [];
    }
  }

  async topUpWallet(hostId: string, request: TopUpRequest): Promise<boolean> {
    try {
      console.log("Starting wallet top-up for host:", hostId, "amount:", request.amount);
      
      // First get the current wallet
      let wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.log("Wallet not found, creating new wallet");
        const createResult = await this.createWalletForHost(hostId);
        if (!createResult) {
          toast.error("Failed to create wallet");
          return false;
        }
        wallet = await this.getWalletBalance(hostId);
        if (!wallet) {
          toast.error("Failed to initialize wallet");
          return false;
        }
      }

      const newBalance = wallet.balance + request.amount;
      console.log("Updating balance from", wallet.balance, "to", newBalance);

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
        toast.error("Failed to update wallet balance");
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
        // Don't fail the whole operation if transaction recording fails
        console.log("Top-up successful but transaction logging failed");
      }

      console.log("Wallet top-up completed successfully");
      toast.success(`Successfully added P${request.amount.toFixed(2)} to your wallet`);
      return true;
    } catch (error) {
      console.error("Error in topUpWallet:", error);
      toast.error("Failed to top up wallet");
      return false;
    }
  }

  async createWalletForHost(hostId: string): Promise<boolean> {
    try {
      console.log("Creating wallet for host:", hostId);
      
      const { error } = await supabase
        .from("host_wallets")
        .insert({
          host_id: hostId,
          balance: 0.00,
          currency: "BWP"
        });

      if (error) {
        console.error("Error creating wallet:", error);
        return false;
      }

      console.log("Wallet created successfully for host:", hostId);
      return true;
    } catch (error) {
      console.error("Error in createWalletForHost:", error);
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
}

export const walletService = new WalletService();

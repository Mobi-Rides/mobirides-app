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
      console.log("WalletService: Fetching wallet balance for host:", hostId);
      
      const { data, error } = await supabase
        .from("host_wallets")
        .select("id, balance, currency")
        .eq("host_id", hostId)
        .single();

      if (error) {
        console.error("WalletService: Error fetching wallet balance:", error);
        
        // If wallet doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log("WalletService: Creating new wallet for host:", hostId);
          const createResult = await this.createWalletForHost(hostId);
          if (createResult) {
            // Retry fetching after creation
            return await this.getWalletBalance(hostId);
          }
        }
        return null;
      }

      console.log("WalletService: Wallet balance fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("WalletService: Unexpected error in getWalletBalance:", error);
      return null;
    }
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

  async topUpWallet(hostId: string, request: TopUpRequest): Promise<boolean> {
    try {
      console.log("WalletService: Starting wallet top-up", { hostId, amount: request.amount, method: request.payment_method });
      
      // Validate inputs
      if (!hostId || !request.amount || request.amount <= 0) {
        console.error("WalletService: Invalid top-up parameters", { hostId, request });
        toast.error("Invalid top-up parameters");
        return false;
      }

      // Get current wallet
      let wallet = await this.getWalletBalance(hostId);
      if (!wallet) {
        console.log("WalletService: Wallet not found, creating new wallet");
        const createResult = await this.createWalletForHost(hostId);
        if (!createResult) {
          console.error("WalletService: Failed to create wallet");
          toast.error("Failed to create wallet");
          return false;
        }
        wallet = await this.getWalletBalance(hostId);
        if (!wallet) {
          console.error("WalletService: Failed to initialize wallet after creation");
          toast.error("Failed to initialize wallet");
          return false;
        }
      }

      const newBalance = wallet.balance + request.amount;
      console.log("WalletService: Updating balance", { from: wallet.balance, to: newBalance, difference: request.amount });

      // Start database transaction
      const { data: updatedWallet, error: walletError } = await supabase
        .from("host_wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id)
        .select()
        .single();

      if (walletError) {
        console.error("WalletService: Error updating wallet balance:", walletError);
        toast.error("Failed to update wallet balance");
        return false;
      }

      console.log("WalletService: Wallet balance updated successfully:", updatedWallet);

      // Record transaction
      const transactionData = {
        wallet_id: wallet.id,
        transaction_type: "top_up",
        amount: request.amount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        description: `Wallet top-up via ${request.payment_method.replace('_', ' ')}`,
        payment_method: request.payment_method,
        payment_reference: request.payment_reference,
        status: "completed"
      };

      console.log("WalletService: Recording transaction:", transactionData);

      const { data: transaction, error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error("WalletService: Error recording transaction:", transactionError);
        // Don't fail the whole operation if transaction recording fails
        console.log("WalletService: Top-up successful but transaction logging failed");
        toast.warning("Top-up successful but transaction logging failed");
      } else {
        console.log("WalletService: Transaction recorded successfully:", transaction);
      }

      console.log("WalletService: Wallet top-up completed successfully");
      toast.success(`Successfully added P${request.amount.toFixed(2)} to your wallet`);
      return true;
    } catch (error) {
      console.error("WalletService: Unexpected error in topUpWallet:", error);
      toast.error("An unexpected error occurred during top-up");
      return false;
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

  async createWalletForHost(hostId: string): Promise<boolean> {
    try {
      console.log("WalletService: Creating wallet for host:", hostId);
      
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
        console.error("WalletService: Error creating wallet:", error);
        return false;
      }

      console.log("WalletService: Wallet created successfully:", data);
      return true;
    } catch (error) {
      console.error("WalletService: Unexpected error in createWalletForHost:", error);
      return false;
    }
  }

  // Development testing methods
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

      // Reset balance to 0
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

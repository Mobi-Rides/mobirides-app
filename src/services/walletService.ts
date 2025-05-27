
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
  private async createNotification(hostId: string, type: string, content: string, relatedBookingId?: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: hostId,
          type: type,
          content: content,
          related_booking_id: relatedBookingId,
          is_read: false
        });

      if (error) {
        console.error("WalletService: Error creating notification:", error);
      }
    } catch (error) {
      console.error("WalletService: Unexpected error creating notification:", error);
    }
  }

  async getWalletBalance(hostId: string) {
    return getWalletBalance(hostId);
  }

  async topUpWallet(hostId: string, request: any) {
    const result = await topUpWallet(hostId, request);
    
    if (result) {
      // Create notification for successful top-up
      await this.createNotification(
        hostId,
        "wallet_topup",
        `Your wallet has been topped up with P${request.amount.toFixed(2)}`
      );
    }
    
    return result;
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

      // Create notification for fee deduction
      await this.createNotification(
        hostId,
        "wallet_deduction",
        `Platform fee of P${feeAmount.toFixed(2)} deducted for booking`,
        bookingId
      );

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

      // Create notification for commission deduction
      await this.createNotification(
        hostId,
        "wallet_deduction",
        `Commission of P${commissionAmount.toFixed(2)} charged for booking`,
        bookingId
      );

      console.log("WalletService: Booking commission deducted successfully");
      return true;
    } catch (error) {
      console.error("WalletService: Unexpected error in deductBookingCommission:", error);
      return false;
    }
  }

  async createWalletForHost(hostId: string) {
    const result = await createWalletForHost(hostId);
    
    if (result) {
      // Create notification for wallet creation
      await this.createNotification(
        hostId,
        "wallet_created",
        "Your wallet has been created successfully"
      );
    }
    
    return result;
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

      // Create notification for wallet reset
      await this.createNotification(
        hostId,
        "wallet_reset",
        "Your wallet has been reset to P0.00"
      );

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

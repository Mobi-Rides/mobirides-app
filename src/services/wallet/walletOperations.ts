import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWalletBalance } from "./walletBalance";
import { notificationService } from "./notificationService";

export class WalletOperations {
  async deductBookingFee(hostId: string, bookingId: string, feeAmount: number): Promise<boolean> {
    try {
      console.log("WalletOperations: Deducting booking fee", { hostId, bookingId, feeAmount });
      
      const wallet = await getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletOperations: Wallet not found for fee deduction");
        return false;
      }

      if (wallet.balance < feeAmount) {
        console.error("WalletOperations: Insufficient balance for fee deduction", { balance: wallet.balance, required: feeAmount });
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
        console.error("WalletOperations: Error updating wallet balance for fee deduction:", walletError);
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
        console.error("WalletOperations: Error recording fee transaction:", transactionError);
        return false;
      }

      // Create notification for fee deduction
      await notificationService.createNotification(
        hostId,
        "wallet_deduction",
        `Platform fee of P${feeAmount.toFixed(2)} deducted for booking`,
        bookingId
      );

      console.log("WalletOperations: Booking fee deducted successfully");
      return true;
    } catch (error) {
      console.error("WalletOperations: Unexpected error in deductBookingFee:", error);
      return false;
    }
  }

  async processBookingCommission(hostId: string, bookingId: string, commissionAmount: number, hostEarnings: number): Promise<boolean> {
    try {
      console.log("WalletOperations: Processing booking commission from earnings", { 
        hostId, 
        bookingId, 
        commissionAmount,
        hostEarnings 
      });
      
      const wallet = await getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletOperations: Wallet not found for commission processing");
        return false;
      }

      // Record earnings transaction (positive amount showing what host receives)
      const { error: earningsError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          booking_id: bookingId,
          transaction_type: "rental_earnings",
          amount: hostEarnings,
          balance_before: wallet.balance,
          balance_after: wallet.balance, // Wallet balance unchanged
          description: `Rental earnings (after ${((commissionAmount / (hostEarnings + commissionAmount)) * 100).toFixed(1)}% commission)`,
          status: "completed"
        });

      if (earningsError) {
        console.error("WalletOperations: Error recording earnings transaction:", earningsError);
        return false;
      }

      // Create notification for earnings
      await notificationService.createNotification(
        hostId,
        "rental_earnings",
        `You earned P${hostEarnings.toFixed(2)} from your rental (commission: P${commissionAmount.toFixed(2)})`,
        bookingId
      );

      console.log("WalletOperations: Booking commission processed successfully");
      return true;
    } catch (error) {
      console.error("WalletOperations: Unexpected error in processBookingCommission:", error);
      return false;
    }
  }

  async deductBookingCommission(hostId: string, bookingId: string, commissionAmount: number): Promise<boolean> {
    // Calculate host earnings (assuming total = commission / 0.15)
    const totalBookingAmount = commissionAmount / 0.15;
    const hostEarnings = totalBookingAmount - commissionAmount;
    return this.processBookingCommission(hostId, bookingId, commissionAmount, hostEarnings);
  }

  async addTestFunds(hostId: string, amount: number): Promise<boolean> {
    console.log("WalletOperations: Adding test funds:", { hostId, amount });
    const { topUpWallet } = await import("./walletTopUp");
    return await topUpWallet(hostId, {
      amount,
      payment_method: "test",
      payment_reference: `TEST_${Date.now()}`
    });
  }

  async resetWallet(hostId: string): Promise<boolean> {
    try {
      console.log("WalletOperations: Resetting wallet for host:", hostId);
      
      const wallet = await getWalletBalance(hostId);
      if (!wallet) {
        console.log("WalletOperations: No wallet found to reset");
        return false;
      }

      const { error } = await supabase
        .from("host_wallets")
        .update({ balance: 0.00, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      if (error) {
        console.error("WalletOperations: Error resetting wallet:", error);
        return false;
      }

      // Create notification for wallet reset
      await notificationService.createNotification(
        hostId,
        "wallet_reset",
        "Your wallet has been reset to P0.00"
      );

      console.log("WalletOperations: Wallet reset successfully");
      toast.success("Wallet reset to P0.00");
      return true;
    } catch (error) {
      console.error("WalletOperations: Error in resetWallet:", error);
      return false;
    }
  }
}

export const walletOperations = new WalletOperations();

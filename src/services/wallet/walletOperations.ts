
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

  async processRentalEarnings(hostId: string, bookingId: string, totalBookingAmount: number): Promise<boolean> {
    try {
      console.log("WalletOperations: Processing rental earnings", { 
        hostId, 
        bookingId, 
        totalBookingAmount
      });
      
      const wallet = await getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletOperations: Wallet not found for earnings processing");
        return false;
      }

      // Record earnings transaction - host receives full booking amount
      const { error: earningsError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          booking_id: bookingId,
          transaction_type: "rental_earnings",
          amount: totalBookingAmount,
          balance_before: wallet.balance,
          balance_after: wallet.balance, // Wallet balance unchanged - this is separate earnings
          description: `Rental earnings from booking`,
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
        `You earned P${totalBookingAmount.toFixed(2)} from your rental`,
        bookingId
      );

      console.log("WalletOperations: Rental earnings processed successfully");
      return true;
    } catch (error) {
      console.error("WalletOperations: Unexpected error in processRentalEarnings:", error);
      return false;
    }
  }

  async processBookingCommission(hostId: string, bookingId: string, commissionAmount: number, hostEarnings: number): Promise<boolean> {
    // For the new flow, we just process the full rental earnings
    // Commission is already deducted from wallet in commissionDeduction.ts
    return this.processRentalEarnings(hostId, bookingId, hostEarnings + commissionAmount);
  }

  async deductBookingCommission(hostId: string, bookingId: string, commissionAmount: number): Promise<boolean> {
    // This method is now handled by commissionDeduction.ts
    console.log("WalletOperations: Commission deduction handled by commission service");
    return true;
  }


}

export const walletOperations = new WalletOperations();

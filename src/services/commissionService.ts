
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CommissionRate {
  id: string;
  rate: number;
  effective_from: string;
  effective_until?: string;
}

export interface CommissionCalculation {
  bookingTotal: number;
  commissionRate: number;
  commissionAmount: number;
  hostReceives: number;
}

class CommissionService {
  async getCurrentCommissionRate(): Promise<number> {
    try {
      console.log("CommissionService: Fetching current commission rate");
      
      const { data, error } = await supabase
        .from("commission_rates")
        .select("rate")
        .lte("effective_from", new Date().toISOString())
        .or("effective_until.is.null,effective_until.gt." + new Date().toISOString())
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("CommissionService: Error fetching commission rate:", error);
        return 0.15; // Default 15% fallback
      }

      console.log("CommissionService: Commission rate fetched:", data.rate);
      return data.rate;
    } catch (error) {
      console.error("CommissionService: Unexpected error fetching commission rate:", error);
      return 0.15; // Default 15% fallback
    }
  }

  async calculateCommission(bookingTotal: number): Promise<CommissionCalculation> {
    const commissionRate = await this.getCurrentCommissionRate();
    const commissionAmount = Math.round(bookingTotal * commissionRate * 100) / 100;
    const hostReceives = bookingTotal - commissionAmount;

    return {
      bookingTotal,
      commissionRate,
      commissionAmount,
      hostReceives
    };
  }

  async checkHostCanAcceptBooking(hostId: string, bookingTotal: number): Promise<{
    canAccept: boolean;
    commissionAmount: number;
    currentBalance: number;
    message?: string;
  }> {
    try {
      console.log("CommissionService: Checking if host can accept booking", { hostId, bookingTotal });
      
      const calculation = await this.calculateCommission(bookingTotal);
      
      // Get host wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("host_wallets")
        .select("balance")
        .eq("host_id", hostId)
        .single();

      if (walletError) {
        console.error("CommissionService: Error fetching wallet:", walletError);
        return {
          canAccept: false,
          commissionAmount: calculation.commissionAmount,
          currentBalance: 0,
          message: "Wallet not found. Please contact support."
        };
      }

      const currentBalance = wallet.balance || 0;
      const canAccept = currentBalance >= calculation.commissionAmount;

      console.log("CommissionService: Booking acceptance check result", {
        canAccept,
        commissionAmount: calculation.commissionAmount,
        currentBalance,
        required: calculation.commissionAmount
      });

      return {
        canAccept,
        commissionAmount: calculation.commissionAmount,
        currentBalance,
        message: canAccept 
          ? undefined 
          : `Insufficient wallet balance. Need P${calculation.commissionAmount.toFixed(2)}, have P${currentBalance.toFixed(2)}`
      };
    } catch (error) {
      console.error("CommissionService: Error checking booking acceptance:", error);
      return {
        canAccept: false,
        commissionAmount: 0,
        currentBalance: 0,
        message: "Error checking wallet balance. Please try again."
      };
    }
  }

  async deductCommissionOnBookingAcceptance(
    hostId: string, 
    bookingId: string, 
    bookingTotal: number
  ): Promise<boolean> {
    try {
      console.log("CommissionService: Deducting commission on booking acceptance", {
        hostId,
        bookingId,
        bookingTotal
      });

      const calculation = await this.calculateCommission(bookingTotal);
      
      // Check if host can accept first
      const acceptanceCheck = await this.checkHostCanAcceptBooking(hostId, bookingTotal);
      if (!acceptanceCheck.canAccept) {
        console.error("CommissionService: Host cannot accept booking due to insufficient funds");
        toast.error(acceptanceCheck.message || "Insufficient wallet balance");
        return false;
      }

      // Get wallet info
      const { data: wallet, error: walletError } = await supabase
        .from("host_wallets")
        .select("id, balance")
        .eq("host_id", hostId)
        .single();

      if (walletError) {
        console.error("CommissionService: Error fetching wallet for deduction:", walletError);
        return false;
      }

      const newBalance = wallet.balance - calculation.commissionAmount;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("host_wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", wallet.id);

      if (updateError) {
        console.error("CommissionService: Error updating wallet balance:", updateError);
        return false;
      }

      // Record commission transaction
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          booking_id: bookingId,
          transaction_type: "commission_deduction",
          amount: -calculation.commissionAmount,
          balance_before: wallet.balance,
          balance_after: newBalance,
          description: `Platform commission (${(calculation.commissionRate * 100).toFixed(1)}%)`,
          status: "completed",
          commission_rate: calculation.commissionRate,
          booking_reference: `BOOKING_${bookingId.slice(-8)}`
        });

      if (transactionError) {
        console.error("CommissionService: Error recording commission transaction:", transactionError);
        // Don't fail the whole operation for transaction recording
      }

      // Update booking with commission info
      const { error: bookingUpdateError } = await supabase
        .from("bookings")
        .update({
          commission_amount: calculation.commissionAmount,
          commission_status: "deducted"
        })
        .eq("id", bookingId);

      if (bookingUpdateError) {
        console.error("CommissionService: Error updating booking commission info:", bookingUpdateError);
        // Don't fail for this either
      }

      console.log("CommissionService: Commission deducted successfully");
      toast.success(`Commission of P${calculation.commissionAmount.toFixed(2)} deducted from wallet`);
      return true;
    } catch (error) {
      console.error("CommissionService: Error deducting commission:", error);
      toast.error("Failed to process commission. Please try again.");
      return false;
    }
  }
}

export const commissionService = new CommissionService();

// Development helpers
if (typeof window !== 'undefined') {
  (window as any).commissionService = commissionService;
  console.log('CommissionService available in console for testing');
}

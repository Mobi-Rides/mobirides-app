import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateCommission } from "./commissionCalculation";
import { getCurrentCommissionRate } from "./commissionRates";
import { checkHostCanAcceptBooking } from "./walletValidation";

export const deductCommissionFromEarnings = async (
  hostId: string, 
  bookingId: string, 
  bookingTotal: number
): Promise<boolean> => {
  try {
    console.log("CommissionDeduction: Processing commission from rental earnings", {
      hostId,
      bookingId,
      bookingTotal
    });

    const commissionRate = await getCurrentCommissionRate();
    const calculation = calculateCommission(bookingTotal, commissionRate);
    
    // Check if host can accept first (P50 minimum balance check)
    const acceptanceCheck = await checkHostCanAcceptBooking(hostId, bookingTotal);
    if (!acceptanceCheck.canAccept) {
      console.error("CommissionDeduction: Host cannot accept booking due to insufficient funds");
      toast.error(acceptanceCheck.message || "Insufficient wallet balance");
      return false;
    }

    // Get wallet info for transaction recording
    const { data: wallet, error: walletError } = await supabase
      .from("host_wallets")
      .select("id, balance")
      .eq("host_id", hostId)
      .single();

    if (walletError) {
      console.error("CommissionDeduction: Error fetching wallet for transaction recording:", walletError);
      return false;
    }

    // Record commission transaction (informational only - no balance deduction)
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        booking_id: bookingId,
        transaction_type: "commission_deduction",
        amount: -calculation.commissionAmount,
        balance_before: wallet.balance,
        balance_after: wallet.balance, // Balance unchanged - commission from earnings
        description: `Platform commission (${(calculation.commissionRate * 100).toFixed(1)}%) deducted from rental earnings`,
        status: "completed",
        commission_rate: calculation.commissionRate,
        booking_reference: `BOOKING_${bookingId.slice(-8)}`
      });

    if (transactionError) {
      console.error("CommissionDeduction: Error recording commission transaction:", transactionError);
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
      console.error("CommissionDeduction: Error updating booking commission info:", bookingUpdateError);
    }

    console.log("CommissionDeduction: Commission processed successfully from rental earnings");
    toast.success(`Booking confirmed! Commission of P${calculation.commissionAmount.toFixed(2)} will be deducted from rental earnings`);
    return true;
  } catch (error) {
    console.error("CommissionDeduction: Error processing commission:", error);
    toast.error("Failed to process commission. Please try again.");
    return false;
  }
};

// Keep the old function for backward compatibility but redirect to new logic
export const deductCommissionOnBookingAcceptance = async (
  hostId: string, 
  bookingId: string, 
  bookingTotal: number
): Promise<boolean> => {
  return deductCommissionFromEarnings(hostId, bookingId, bookingTotal);
};

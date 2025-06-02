
import { supabase } from "@/integrations/supabase/client";
import { calculateCommission } from "./commissionCalculation";
import { getCurrentCommissionRate } from "./commissionRates";

export interface WalletValidationResult {
  canAccept: boolean;
  commissionAmount: number;
  currentBalance: number;
  message?: string;
}

export const checkHostCanAcceptBooking = async (
  hostId: string, 
  bookingTotal: number
): Promise<WalletValidationResult> => {
  try {
    console.log("WalletValidation: Checking if host can accept booking", { hostId, bookingTotal });
    
    const commissionRate = await getCurrentCommissionRate();
    const calculation = calculateCommission(bookingTotal, commissionRate);
    
    // Get host wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("host_wallets")
      .select("balance")
      .eq("host_id", hostId)
      .single();

    if (walletError) {
      console.error("WalletValidation: Error fetching wallet:", walletError);
      return {
        canAccept: false,
        commissionAmount: calculation.commissionAmount,
        currentBalance: 0,
        message: "Wallet not found. Please contact support."
      };
    }

    const currentBalance = wallet.balance || 0;
    // Host needs P50 minimum balance + commission amount to accept booking
    const minimumRequired = 50;
    const totalRequired = minimumRequired + calculation.commissionAmount;
    const canAccept = currentBalance >= totalRequired;

    console.log("WalletValidation: Booking acceptance check result", {
      canAccept,
      commissionAmount: calculation.commissionAmount,
      currentBalance,
      minimumRequired,
      totalRequired
    });

    return {
      canAccept,
      commissionAmount: calculation.commissionAmount,
      currentBalance,
      message: canAccept 
        ? undefined 
        : `Insufficient wallet balance. Need at least P${totalRequired.toFixed(2)} (P${minimumRequired} minimum + P${calculation.commissionAmount.toFixed(2)} commission), have P${currentBalance.toFixed(2)}`
    };
  } catch (error) {
    console.error("WalletValidation: Error checking booking acceptance:", error);
    return {
      canAccept: false,
      commissionAmount: 0,
      currentBalance: 0,
      message: "Error checking wallet balance. Please try again."
    };
  }
};

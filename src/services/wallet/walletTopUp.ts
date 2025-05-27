
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWalletBalance, createWalletForHost } from "./walletBalance";

export interface TopUpRequest {
  amount: number;
  payment_method: string;
  payment_reference?: string;
}

export const topUpWallet = async (hostId: string, request: TopUpRequest): Promise<boolean> => {
  try {
    console.log("WalletTopUp: Starting wallet top-up", { hostId, amount: request.amount, method: request.payment_method });
    
    // Validate inputs
    if (!hostId || !request.amount || request.amount <= 0) {
      console.error("WalletTopUp: Invalid top-up parameters", { hostId, request });
      toast.error("Invalid top-up parameters");
      return false;
    }

    // Get current wallet
    let wallet = await getWalletBalance(hostId);
    if (!wallet) {
      console.log("WalletTopUp: Wallet not found, creating new wallet");
      const createResult = await createWalletForHost(hostId);
      if (!createResult) {
        console.error("WalletTopUp: Failed to create wallet");
        toast.error("Failed to create wallet");
        return false;
      }
      wallet = await getWalletBalance(hostId);
      if (!wallet) {
        console.error("WalletTopUp: Failed to initialize wallet after creation");
        toast.error("Failed to initialize wallet");
        return false;
      }
    }

    const newBalance = wallet.balance + request.amount;
    console.log("WalletTopUp: Updating balance", { from: wallet.balance, to: newBalance, difference: request.amount });

    // Update wallet balance
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
      console.error("WalletTopUp: Error updating wallet balance:", walletError);
      toast.error("Failed to update wallet balance");
      return false;
    }

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

    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert(transactionData);

    if (transactionError) {
      console.error("WalletTopUp: Error recording transaction:", transactionError);
      toast.warning("Top-up successful but transaction logging failed");
    }

    console.log("WalletTopUp: Wallet top-up completed successfully");
    toast.success(`Successfully added P${request.amount.toFixed(2)} to your wallet`);
    return true;
  } catch (error) {
    console.error("WalletTopUp: Unexpected error in topUpWallet:", error);
    toast.error("An unexpected error occurred during top-up");
    return false;
  }
};

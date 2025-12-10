
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWalletBalance, createWalletForHost } from "./walletBalance";

export interface TopUpRequest {
  amount: number;
  payment_method: string;
  payment_reference?: string;
}

interface WalletTopUpResult {
  success: boolean;
  wallet_id?: string;
  balance?: number;
  transaction_id?: string;
  error?: string;
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

    // Verify user is authenticated and matches hostId
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== hostId) {
      console.error("WalletTopUp: Authentication error or user mismatch:", authError);
      toast.error("Authentication required for wallet top-up");
      return false;
    }

    // Get or create wallet
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

    // Use secure RPC to adjust wallet balance and record transaction
    const { data: rpcData, error: rpcError } = await supabase.rpc('wallet_topup', {
      p_amount: request.amount,
      p_payment_method: request.payment_method,
      p_payment_reference: request.payment_reference,
    });

    const result = rpcData as unknown as WalletTopUpResult | null;
    if (rpcError || !result?.success) {
      console.error("WalletTopUp: RPC error:", rpcError || rpcData);
      toast.error("Failed to update wallet balance");
      return false;
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

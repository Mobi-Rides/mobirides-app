import { getWalletBalance, createWalletForHost } from "./wallet/walletBalance";
import { topUpWallet } from "./wallet/walletTopUp";
import { walletOperations } from "./wallet/walletOperations";
import { transactionHistory } from "./wallet/transactionHistory";
import { notificationService } from "./wallet/notificationService";

export type { WalletBalance } from "./wallet/walletBalance";
export type { WalletTransaction } from "./wallet/transactionHistory";

// Re-export TopUpRequest from walletTopUp with proper interface
export interface TopUpRequest {
  amount: number;
  payment_method: string;
  payment_reference?: string;
}

class WalletService {
  async getWalletBalance(hostId: string) {
    return getWalletBalance(hostId);
  }

  async topUpWallet(hostId: string, request: TopUpRequest) {
    const result = await topUpWallet(hostId, request);

    if (result) {
      // Create notification for successful top-up using new method
      await notificationService.createWalletNotification(
        hostId,
        "topup",
        request.amount
      );
    }

    return result;
  }

  async getTransactionHistory(hostId: string, limit = 20) {
    return transactionHistory.getTransactionHistory(hostId, limit);
  }

  async deductBookingFee(hostId: string, bookingId: string, feeAmount: number) {
    return walletOperations.deductBookingFee(hostId, bookingId, feeAmount);
  }

  async processRentalEarnings(hostId: string, bookingId: string, commissionAmount: number, hostEarnings: number) {
    return walletOperations.processBookingCommission(hostId, bookingId, commissionAmount, hostEarnings);
  }

  async deductBookingCommission(hostId: string, bookingId: string, commissionAmount: number) {
    return walletOperations.deductBookingCommission(hostId, bookingId, commissionAmount);
  }

  async createWalletForHost(hostId: string) {
    const result = await createWalletForHost(hostId);

    if (result) {
      // Create notification for wallet creation
      await notificationService.createNotification(
        hostId,
        "wallet_created",
        "Your wallet has been created successfully"
      );
    }

    return result;
  }

  async creditInsurancePayout(userId: string, claimId: string, amount: number, claimNumber: string) {
    return walletOperations.creditInsurancePayout(userId, claimId, amount, claimNumber);
  }

}

export const walletService = new WalletService();

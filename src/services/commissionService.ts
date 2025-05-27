import { getCurrentCommissionRate } from "./commission/commissionRates";
import { calculateCommission } from "./commission/commissionCalculation";
import { checkHostCanAcceptBooking } from "./commission/walletValidation";
import { deductCommissionFromEarnings } from "./commission/commissionDeduction";

export type { CommissionRate } from "./commission/commissionRates";
export type { CommissionCalculation } from "./commission/commissionCalculation";
export type { WalletValidationResult } from "./commission/walletValidation";

class CommissionService {
  async getCurrentCommissionRate(): Promise<number> {
    return getCurrentCommissionRate();
  }

  async calculateCommission(bookingTotal: number) {
    const commissionRate = await getCurrentCommissionRate();
    return calculateCommission(bookingTotal, commissionRate);
  }

  async checkHostCanAcceptBooking(hostId: string, bookingTotal: number) {
    return checkHostCanAcceptBooking(hostId, bookingTotal);
  }

  async processCommissionOnBookingConfirmation(
    hostId: string, 
    bookingId: string, 
    bookingTotal: number
  ): Promise<boolean> {
    return deductCommissionFromEarnings(hostId, bookingId, bookingTotal);
  }

  // Keep old method name for backward compatibility
  async deductCommissionOnBookingAcceptance(
    hostId: string, 
    bookingId: string, 
    bookingTotal: number
  ): Promise<boolean> {
    return this.processCommissionOnBookingConfirmation(hostId, bookingId, bookingTotal);
  }
}

export const commissionService = new CommissionService();

// Development helpers
if (typeof window !== 'undefined') {
  (window as any).commissionService = commissionService;
  console.log('CommissionService available in console for testing');
}

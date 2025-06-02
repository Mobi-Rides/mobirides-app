
export interface CommissionCalculation {
  bookingTotal: number;
  commissionRate: number;
  commissionAmount: number;
  hostReceives: number;
}

export const calculateCommission = (
  bookingTotal: number, 
  commissionRate: number
): CommissionCalculation => {
  const commissionAmount = Math.round(bookingTotal * commissionRate * 100) / 100;
  const hostReceives = bookingTotal - commissionAmount;

  return {
    bookingTotal,
    commissionRate,
    commissionAmount,
    hostReceives
  };
};

import { calculateCommission } from '@/services/commission/commissionCalculation';

describe('calculateCommission', () => {
  it('calculates commission and host amount with standard values', () => {
    const result = calculateCommission(1000, 0.15);

    expect(result.bookingTotal).toBe(1000);
    expect(result.commissionRate).toBe(0.15);
    expect(result.commissionAmount).toBe(150);
    expect(result.hostReceives).toBe(850);
  });

  it('rounds commission amount to two decimals', () => {
    const result = calculateCommission(333.33, 0.075);

    expect(result.commissionAmount).toBe(25);
    expect(result.hostReceives).toBeCloseTo(308.33, 2);
  });
});

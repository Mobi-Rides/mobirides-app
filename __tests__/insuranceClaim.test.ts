import { InsuranceService } from '../src/services/insuranceService';

describe('InsuranceService.calculateClaimPayout', () => {
  it('calculates payout with fixed excess and admin fee', async () => {
    const result = await InsuranceService.calculateClaimPayout(
      4000, // damageCost
      5000, // coverageCap
      500,  // excess
      null, // excessPercentage
      150   // adminFee
    );
    expect(result.approvedAmount).toBe(4000);
    expect(result.excessPaid).toBe(500);
    expect(result.payoutAmount).toBe(3500);
    expect(result.adminFee).toBe(150);
    expect(result.totalClaimCost).toBe(3650);
    expect(result.renterPays).toBe(650);
  });

  it('calculates payout with percentage excess', async () => {
    const result = await InsuranceService.calculateClaimPayout(
      10000, // damageCost
      15000, // coverageCap
      500,   // excess (should be ignored)
      0.2,   // excessPercentage (20%)
      150
    );
    expect(result.approvedAmount).toBe(10000);
    expect(result.excessPaid).toBe(2000);
    expect(result.payoutAmount).toBe(8000);
    expect(result.adminFee).toBe(150);
    expect(result.totalClaimCost).toBe(8150);
    expect(result.renterPays).toBe(2150);
  });

  it('caps payout at coverage cap', async () => {
    const result = await InsuranceService.calculateClaimPayout(
      20000, // damageCost
      15000, // coverageCap
      1000,  // excess
      null,
      150
    );
    expect(result.approvedAmount).toBe(15000);
    expect(result.excessPaid).toBe(1000);
    expect(result.payoutAmount).toBe(14000);
    expect(result.totalClaimCost).toBe(14150);
    expect(result.renterPays).toBe(1150);
  });

  it('never returns negative payout', async () => {
    const result = await InsuranceService.calculateClaimPayout(
      500, // damageCost
      1000, // coverageCap
      600,  // excess
      null,
      150
    );
    expect(result.payoutAmount).toBe(0);
    expect(result.totalClaimCost).toBe(150);
    expect(result.renterPays).toBe(750);
  });
});

import { DynamicPricingService } from '@/services/dynamicPricingService';
import { PricingRuleType, Season, type PricingRule } from '@/types/pricing';

const mkRule = (overrides: Partial<PricingRule>): PricingRule => ({
  id: 'rule-id',
  name: 'Rule',
  type: PricingRuleType.WEEKEND,
  is_active: true,
  multiplier: 1.1,
  conditions: {},
  priority: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('DynamicPricingService helpers', () => {
  it('maps month to southern hemisphere season', () => {
    expect(DynamicPricingService.getSeasonFromMonth(1)).toBe(Season.SUMMER);
    expect(DynamicPricingService.getSeasonFromMonth(4)).toBe(Season.AUTUMN);
    expect(DynamicPricingService.getSeasonFromMonth(7)).toBe(Season.WINTER);
    expect(DynamicPricingService.getSeasonFromMonth(10)).toBe(Season.SPRING);
    expect(DynamicPricingService.getSeasonFromMonth(12)).toBe(Season.SUMMER);
  });

  it('evaluates seasonal rules by month and season', () => {
    const monthRule = mkRule({
      type: PricingRuleType.SEASONAL,
      conditions: { months: [12] },
    });

    const seasonRule = mkRule({
      type: PricingRuleType.SEASONAL,
      conditions: { seasons: [Season.WINTER] },
    });

    expect(DynamicPricingService.evaluateSeasonalRule(monthRule, new Date('2026-12-15'))).toBe(true);
    expect(DynamicPricingService.evaluateSeasonalRule(monthRule, new Date('2026-11-15'))).toBe(false);
    expect(DynamicPricingService.evaluateSeasonalRule(seasonRule, new Date('2026-07-20'))).toBe(true);
    expect(DynamicPricingService.evaluateSeasonalRule(seasonRule, new Date('2026-01-20'))).toBe(false);
    expect(DynamicPricingService.evaluateSeasonalRule(mkRule({ type: PricingRuleType.SEASONAL, conditions: {} }), new Date('2026-01-20'))).toBe(false);
  });

  it('evaluates demand rule threshold checks', () => {
    const demandRule = mkRule({
      type: PricingRuleType.DEMAND,
      conditions: { demand_threshold: 80 },
    });

    expect(DynamicPricingService.evaluateDemandRule(demandRule, null)).toBe(false);
    expect(DynamicPricingService.evaluateDemandRule(demandRule, {
      location: 'a', total_cars: 50, booked_cars: 39, demand_percentage: 78, trending: 'stable',
    })).toBe(false);
    expect(DynamicPricingService.evaluateDemandRule(demandRule, {
      location: 'a', total_cars: 50, booked_cars: 45, demand_percentage: 90, trending: 'up',
    })).toBe(true);
  });

  it('evaluates early bird rule by advance days', () => {
    const earlyBirdRule = mkRule({
      type: PricingRuleType.EARLY_BIRD,
      conditions: { advance_booking_days: 7 },
    });

    expect(DynamicPricingService.evaluateEarlyBirdRule(
      earlyBirdRule,
      new Date('2026-04-10'),
      new Date('2026-04-01')
    )).toBe(true);

    expect(DynamicPricingService.evaluateEarlyBirdRule(
      earlyBirdRule,
      new Date('2026-04-06'),
      new Date('2026-04-01')
    )).toBe(false);

    expect(DynamicPricingService.evaluateEarlyBirdRule(
      mkRule({ type: PricingRuleType.EARLY_BIRD, conditions: {} }),
      new Date('2026-04-10'),
      new Date('2026-04-01')
    )).toBe(false);
  });

  it('evaluates loyalty rule with min bookings and tier', () => {
    const loyaltyRule = mkRule({
      type: PricingRuleType.LOYALTY,
      conditions: { min_bookings: 5, user_tier: 'gold' },
    });

    expect(DynamicPricingService.evaluateLoyaltyRule(loyaltyRule, null)).toBe(false);

    expect(DynamicPricingService.evaluateLoyaltyRule(loyaltyRule, {
      user_id: 'u1', total_bookings: 3, total_spent: 1000, tier: 'gold', loyalty_points: 10, member_since: '2024-01-01',
    })).toBe(false);

    expect(DynamicPricingService.evaluateLoyaltyRule(loyaltyRule, {
      user_id: 'u1', total_bookings: 8, total_spent: 1000, tier: 'silver', loyalty_points: 10, member_since: '2024-01-01',
    })).toBe(false);

    expect(DynamicPricingService.evaluateLoyaltyRule(loyaltyRule, {
      user_id: 'u1', total_bookings: 8, total_spent: 1000, tier: 'gold', loyalty_points: 10, member_since: '2024-01-01',
    })).toBe(true);
  });

  it('evaluates weekend, holiday, location and destination rules', () => {
    const weekendRule = mkRule({ type: PricingRuleType.WEEKEND, conditions: { days_of_week: [0, 6] } });
    const holidayRule = mkRule({ type: PricingRuleType.HOLIDAY, conditions: {} });
    const locationRule = mkRule({
      type: PricingRuleType.LOCATION,
      conditions: { coordinates: { north: 1, south: -1, east: 1, west: -1 } },
    });
    const destinationRule = mkRule({
      type: PricingRuleType.DESTINATION,
      conditions: { destination_type: 'cross_border' },
    });

    expect(DynamicPricingService.evaluateWeekendRule(weekendRule, new Date('2026-04-12'))).toBe(true);
    expect(DynamicPricingService.evaluateWeekendRule(weekendRule, new Date('2026-04-13'))).toBe(false);
    expect(DynamicPricingService.evaluateHolidayRule(holidayRule, new Date('2026-12-25'))).toBe(false);

    expect(DynamicPricingService.evaluateLocationRule(locationRule, 0.2, 0.3)).toBe(true);
    expect(DynamicPricingService.evaluateLocationRule(locationRule, 2, 2)).toBe(false);
    expect(DynamicPricingService.evaluateLocationRule(locationRule, undefined, 2)).toBe(false);

    expect(DynamicPricingService.evaluateDestinationRule(destinationRule, 'cross_border')).toBe(true);
    expect(DynamicPricingService.evaluateDestinationRule(destinationRule, 'local')).toBe(false);
    expect(DynamicPricingService.evaluateDestinationRule(destinationRule, undefined)).toBe(false);
  });

  it('routes evaluateRule to the right evaluator by type', () => {
    const request = {
      car_id: 'c1',
      base_price: 100,
      pickup_date: '2026-04-12',
      return_date: '2026-04-13',
      pickup_latitude: 0,
      pickup_longitude: 0,
      destination_type: 'cross_border' as const,
    };

    const demandData = { location: 'x', total_cars: 50, booked_cars: 42, demand_percentage: 84, trending: 'up' as const };
    const loyaltyData = { user_id: 'u1', total_bookings: 9, total_spent: 1200, tier: 'gold' as const, loyalty_points: 80, member_since: '2024-01-01' };

    expect(DynamicPricingService.evaluateRule(mkRule({ type: PricingRuleType.WEEKEND, conditions: { days_of_week: [0, 6] } }), request, loyaltyData, demandData)).toBe(true);
    expect(DynamicPricingService.evaluateRule(mkRule({ type: PricingRuleType.DESTINATION, conditions: { destination_type: 'cross_border' } }), request, loyaltyData, demandData)).toBe(true);
    expect(DynamicPricingService.evaluateRule(mkRule({ type: PricingRuleType.DEMAND, conditions: { demand_threshold: 80 } }), request, loyaltyData, demandData)).toBe(true);
  });

  it('builds rule descriptions for premiums and discounts', () => {
    expect(DynamicPricingService.generateRuleDescription(mkRule({ type: PricingRuleType.WEEKEND, multiplier: 1.2 }))).toContain('+20%');
    expect(DynamicPricingService.generateRuleDescription(mkRule({ type: PricingRuleType.EARLY_BIRD, multiplier: 0.9 }))).toContain('-10%');
  });

  it('returns null demand data when location missing and bounded values when present', () => {
    expect(DynamicPricingService.getSimulatedDemandData(undefined, 25.9)).toBeNull();

    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const data = DynamicPricingService.getSimulatedDemandData(-24.6282, 25.9231);
    spy.mockRestore();

    expect(data).not.toBeNull();
    expect(data?.demand_percentage).toBeGreaterThanOrEqual(0);
    expect(data?.demand_percentage).toBeLessThanOrEqual(100);
    expect(data?.trending).toBeDefined();
  });
});

import { PricingRuleType } from "@/types/pricing";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { DynamicPricingService } from "@/services/dynamicPricingService";

const buildSettingsChain = (settingValue: boolean | string) => {
  const chain: any = {
    eq: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue({ data: { setting_value: settingValue }, error: null }),
  };
  return {
    select: jest.fn(() => chain),
  };
};

const buildRulesChain = (rules: unknown, error: unknown = null) => {
  const chain: any = {
    eq: jest.fn(() => chain),
    then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve({ data: rules, error }).then(onFulfilled),
  };
  return {
    select: jest.fn(() => chain),
  };
};

describe("DynamicPricingService calculations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns base price when dynamic pricing is disabled", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "platform_settings") {
        return buildSettingsChain(false);
      }
      return buildRulesChain([], null);
    });

    const result = await DynamicPricingService.calculatePrice({
      car_id: "car-1",
      base_price: 300,
      pickup_date: "2026-04-11",
      return_date: "2026-04-12",
    });

    expect(result).toEqual({
      base_price: 300,
      applied_rules: [],
      total_multiplier: 1,
      final_price: 300,
      is_dynamic: false,
    });
  });

  it("applies DB pricing rules and computes premium correctly", async () => {
    const dbRule = {
      id: "db-weekend",
      name: "Weekend",
      type: PricingRuleType.WEEKEND,
      is_active: true,
      multiplier: 1.2,
      priority: 100,
      conditions: { days_of_week: [0, 6] },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "platform_settings") {
        return buildSettingsChain(true);
      }
      if (table === "dynamic_pricing_rules") {
        return buildRulesChain([dbRule], null);
      }
      return buildRulesChain([], null);
    });

    const loyaltySpy = jest
      .spyOn(DynamicPricingService, "getUserLoyaltyData")
      .mockResolvedValue({
        user_id: "user-1",
        total_bookings: 15,
        total_spent: 2100,
        tier: "gold",
        loyalty_points: 150,
        member_since: "2023-01-01T00:00:00Z",
      });

    const demandSpy = jest
      .spyOn(DynamicPricingService, "getSimulatedDemandData")
      .mockReturnValue({
        location: "-24.628,25.923",
        total_cars: 50,
        booked_cars: 40,
        demand_percentage: 80,
        trending: "up",
      });

    const result = await DynamicPricingService.calculatePrice({
      car_id: "car-2",
      base_price: 500,
      pickup_date: "2026-04-12",
      return_date: "2026-04-13",
      pickup_latitude: -24.6282,
      pickup_longitude: 25.9231,
      user_id: "user-1",
    });

    expect(result.is_dynamic).toBe(true);
    expect(result.final_price).toBe(600);
    expect(result.premium).toBe(100);
    expect(result.applied_rules).toHaveLength(1);

    loyaltySpy.mockRestore();
    demandSpy.mockRestore();
  });

  it("builds booking request and delegates calculateBookingPrice", async () => {
    const calculateSpy = jest
      .spyOn(DynamicPricingService, "calculatePrice")
      .mockResolvedValue({
        base_price: 100,
        applied_rules: [],
        total_multiplier: 1,
        final_price: 100,
        is_dynamic: false,
      });

    await DynamicPricingService.calculateBookingPrice(
      "car-3",
      100,
      new Date("2026-05-10"),
      new Date("2026-05-12"),
      -24.7,
      25.8,
      "user-3",
      "cross_border",
    );

    expect(calculateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        car_id: "car-3",
        base_price: 100,
        pickup_date: "2026-05-10",
        return_date: "2026-05-12",
        pickup_latitude: -24.7,
        pickup_longitude: 25.8,
        user_id: "user-3",
        destination_type: "cross_border",
      }),
    );

    calculateSpy.mockRestore();
  });

  it("falls back to default active rules when DB rules query fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "platform_settings") {
        return buildSettingsChain(true);
      }

      if (table === "dynamic_pricing_rules") {
        const failingChain: any = {
          eq: jest.fn(() => failingChain),
          then: (_onFulfilled: unknown, onRejected?: (reason: unknown) => unknown) =>
            Promise.reject(new Error("db rules failure")).catch((err) =>
              onRejected ? onRejected(err) : Promise.reject(err),
            ),
        };

        return {
          select: jest.fn(() => failingChain),
        };
      }

      return buildRulesChain([], null);
    });

    const result = await DynamicPricingService.calculatePrice({
      car_id: "car-4",
      base_price: 250,
      pickup_date: "2026-04-15",
      return_date: "2026-04-16",
    });

    expect(result.base_price).toBe(250);
    expect(result.final_price).toBeGreaterThan(0);
  });

  it("generates descriptions for remaining rule types and fallback", () => {
    expect(
      DynamicPricingService.generateRuleDescription({
        id: "x1",
        name: "Loyalty",
        type: PricingRuleType.LOYALTY,
        is_active: true,
        multiplier: 0.95,
        conditions: {},
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toContain("Loyalty member discount");

    expect(
      DynamicPricingService.generateRuleDescription({
        id: "x2",
        name: "Holiday",
        type: PricingRuleType.HOLIDAY,
        is_active: true,
        multiplier: 1.1,
        conditions: {},
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toContain("Holiday premium");

    expect(
      DynamicPricingService.generateRuleDescription({
        id: "x3",
        name: "Location",
        type: PricingRuleType.LOCATION,
        is_active: true,
        multiplier: 1.1,
        conditions: {},
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toContain("Location premium");

    expect(
      DynamicPricingService.generateRuleDescription({
        id: "x4",
        name: "Destination",
        type: PricingRuleType.DESTINATION,
        is_active: true,
        multiplier: 1.1,
        conditions: {},
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toContain("Destination premium");

    expect(
      DynamicPricingService.generateRuleDescription({
        id: "x5",
        name: "Fallback Rule",
        type: "unknown_type" as PricingRuleType,
        is_active: true,
        multiplier: 1.1,
        conditions: {},
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toContain("Fallback Rule");
  });
});
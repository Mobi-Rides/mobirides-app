import { InsuranceService } from "@/services/insuranceService";
import { UnderwriterService } from "@/services/underwriterService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/services/underwriterService", () => ({
  UnderwriterService: {
    assessRisk: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const makePackage = (overrides = {}) => ({
  id: makeId("package"),
  name: "standard",
  display_name: "Standard Cover",
  description: "Balanced cover",
  premium_percentage: 0.1,
  daily_premium_amount: null,
  coverage_cap: 15000,
  excess_amount: 300,
  excess_percentage: null,
  covers_minor_damage: true,
  covers_major_incidents: false,
  features: ["Minor damage"],
  exclusions: ["Tyres"],
  ...overrides,
});

describe("insurance calculation coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("calculates percentage-based premiums with an underwriting multiplier", async () => {
    const pkg = makePackage({ premium_percentage: 0.2 });
    jest.spyOn(InsuranceService, "getPackageById").mockResolvedValue(pkg as any);
    (UnderwriterService.assessRisk as jest.Mock).mockResolvedValue({ premiumLoad: 1.5 });

    const result = await InsuranceService.calculatePremium(
      pkg.id,
      400,
      new Date("2099-01-01"),
      new Date("2099-01-04"),
      makeId("renter"),
      makeId("car")
    );

    expect(result.numberOfDays).toBe(3);
    expect(result.premiumPerDay).toBe(120);
    expect(result.totalPremium).toBe(360);
    expect(result.isFlatDailyRate).toBe(false);
  });

  it("uses flat daily premiums when the package defines an SLA amount", async () => {
    const pkg = makePackage({
      daily_premium_amount: 35,
      excess_percentage: 0.2,
    });
    jest.spyOn(InsuranceService, "getPackageById").mockResolvedValue(pkg as any);

    const result = await InsuranceService.calculatePremium(
      pkg.id,
      900,
      new Date("2099-02-01"),
      new Date("2099-02-02"),
      undefined,
      undefined,
      2
    );

    expect(result.premiumPerDay).toBe(70);
    expect(result.totalPremium).toBe(70);
    expect(result.isFlatDailyRate).toBe(true);
    expect(result.excessPercentage).toBe(0.2);
  });

  it("rejects packages when underwriting returns a zero premium load", async () => {
    const pkg = makePackage();
    jest.spyOn(InsuranceService, "getPackageById").mockResolvedValue(pkg as any);
    (UnderwriterService.assessRisk as jest.Mock).mockResolvedValue({ premiumLoad: 0 });

    await expect(InsuranceService.calculatePremium(
      pkg.id,
      500,
      new Date("2099-03-01"),
      new Date("2099-03-02"),
      makeId("renter"),
      makeId("car")
    )).rejects.toThrow("INSURANCE_NOT_AVAILABLE");
  });

  it("calculates all premiums with one shared underwriting assessment", async () => {
    const packages = [
      makePackage({ id: makeId("package-a"), premium_percentage: 0.05 }),
      makePackage({ id: makeId("package-b"), daily_premium_amount: 20 }),
    ];
    jest.spyOn(InsuranceService, "getInsurancePackages").mockResolvedValue(packages as any);
    jest.spyOn(InsuranceService, "getPackageById").mockImplementation(async (id: string) => {
      return packages.find((pkg) => pkg.id === id) as any;
    });
    (UnderwriterService.assessRisk as jest.Mock).mockResolvedValue({ premiumLoad: 1.25 });

    const result = await InsuranceService.calculateAllPremiums(
      800,
      new Date("2099-04-01"),
      new Date("2099-04-03"),
      makeId("renter"),
      makeId("car")
    );

    expect(result).toHaveLength(2);
    expect(UnderwriterService.assessRisk).toHaveBeenCalledTimes(1);
    expect(result.map((item) => item.totalPremium)).toEqual([100, 50]);
  });

  it("calculates claim payout with percentage excess and configured admin fee", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { setting_value: "175" }, error: null }),
        }),
      }),
    });

    const payout = await InsuranceService.calculateClaimPayout(20000, 15000, 300, 0.1);

    expect(payout).toEqual({
      approvedAmount: 15000,
      excessPaid: 1500,
      payoutAmount: 13500,
      adminFee: 175,
      totalClaimCost: 13675,
      renterPays: 1675,
    });
  });

  it("validates policy status against the active date range", () => {
    const policy = {
      status: "active",
      start_date: "2099-05-01T00:00:00.000Z",
      end_date: "2099-05-10T00:00:00.000Z",
    };

    expect(InsuranceService.isPolicyValid(policy as any, new Date("2099-05-05"))).toBe(true);
    expect(InsuranceService.isPolicyValid({ ...policy, status: "cancelled" } as any, new Date("2099-05-05"))).toBe(false);
    expect(InsuranceService.isPolicyValid(policy as any, new Date("2099-06-01"))).toBe(false);
  });
});

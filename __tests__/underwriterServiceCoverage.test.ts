import { UnderwriterService } from "@/services/underwriterService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const singleQuery = (data: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error: null }),
    }),
  }),
});

const countQuery = (count: number | null) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ count, error: null }),
    }),
  }),
});

describe("UnderwriterService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns low risk for a standard car with no rejected claims", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(singleQuery({ id: "user-1" }))
      .mockReturnValueOnce(singleQuery({ id: "car-1", price_per_day: 500 }))
      .mockReturnValueOnce(countQuery(0));

    await expect(UnderwriterService.assessRisk("user-1", "car-1")).resolves.toEqual({
      riskScore: 20,
      riskTier: "low",
      premiumLoad: 1,
      riskFactors: [],
    });
  });

  it("adds premium load for high-value vehicles and rejected claims", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(singleQuery({ id: "user-2" }))
      .mockReturnValueOnce(singleQuery({ id: "car-2", price_per_day: 1800 }))
      .mockReturnValueOnce(countQuery(1));

    await expect(UnderwriterService.assessRisk("user-2", "car-2")).resolves.toEqual({
      riskScore: 80,
      riskTier: "prohibited",
      premiumLoad: 0,
      riskFactors: ["High Value Vehicle", "History of 1 rejected claim(s)"],
    });
  });

  it("defaults to medium risk when profile or car data is missing", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(singleQuery(null))
      .mockReturnValueOnce(singleQuery({ id: "car-3", price_per_day: 400 }));

    await expect(UnderwriterService.assessRisk("missing-user", "car-3")).resolves.toEqual({
      riskScore: 40,
      riskTier: "medium",
      premiumLoad: 1.2,
      riskFactors: ["Default Assessment (Error or Missing Data)"],
    });

    expect(console.warn).toHaveBeenCalledWith(
      "Underwriting: Profile or Car not found. Defaulting to medium risk.",
    );
    (console.warn as jest.Mock).mockRestore();
  });

  it("defaults to medium risk when a database query throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error("database unavailable");
    });

    await expect(UnderwriterService.assessRisk("user-4", "car-4")).resolves.toMatchObject({
      riskScore: 40,
      riskTier: "medium",
      premiumLoad: 1.2,
    });

    expect(console.error).toHaveBeenCalledWith("Underwriting error:", expect.any(Error));
    (console.error as jest.Mock).mockRestore();
  });
});

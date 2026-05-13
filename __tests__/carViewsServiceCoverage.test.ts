import { getCarViewCount, incrementCarViewCount } from "@/services/carViewsService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

describe("carViewsService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments view count through the database function", async () => {
    const carId = makeId("car");
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

    await incrementCarViewCount(carId);

    expect(supabase.rpc).toHaveBeenCalledWith("increment_car_view_count", { car_id: carId });
  });

  it("logs and continues when incrementing view count fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: { message: "failed" } });

    await expect(incrementCarViewCount(makeId("car"))).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith("Error incrementing view count:", { message: "failed" });
    (console.error as jest.Mock).mockRestore();
  });

  it("returns the stored view count for a vehicle", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { view_count: 42 }, error: null }),
        }),
      }),
    });

    await expect(getCarViewCount(makeId("car"))).resolves.toBe(42);
  });

  it("falls back to zero when fetching the view count fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: "missing" } }),
        }),
      }),
    });

    await expect(getCarViewCount(makeId("car"))).resolves.toBe(0);

    expect(console.error).toHaveBeenCalledWith("Error fetching view count:", { message: "missing" });
    (console.error as jest.Mock).mockRestore();
  });
});

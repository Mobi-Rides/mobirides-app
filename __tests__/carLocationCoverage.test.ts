import { updateCarLocation } from "@/services/carLocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const updateQuery = (response: unknown) => {
  const eq = jest.fn().mockResolvedValue(response);
  const update = jest.fn().mockReturnValue({ eq });
  return { update, eq };
};

describe("carLocation coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it("updates coordinates and shows a success toast", async () => {
    const query = updateQuery({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(updateCarLocation("car-1", -24.6282, 25.9231)).resolves.toBe(true);

    expect(supabase.from).toHaveBeenCalledWith("cars");
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      latitude: -24.6282,
      longitude: 25.9231,
      updated_at: expect.any(String),
    }));
    expect(query.eq).toHaveBeenCalledWith("id", "car-1");
    expect(toast.success).toHaveBeenCalledWith("Location updated successfully");
  });

  it("shows a permission message for row-level security failures", async () => {
    (supabase.from as jest.Mock).mockReturnValue(updateQuery({
      error: { code: "PGRST116", message: "not allowed" },
    }));

    await expect(updateCarLocation("car-2", -20, 20)).resolves.toBe(false);

    expect(toast.error).toHaveBeenCalledWith("You don't have permission to update this car's location");
  });

  it("shows a generic failure message for update errors and thrown errors", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateQuery({ error: { code: "500", message: "failed" } }))
      .mockImplementationOnce(() => {
        throw new Error("offline");
      });

    await expect(updateCarLocation("car-3", -20, 20)).resolves.toBe(false);
    await expect(updateCarLocation("car-4", -21, 21)).resolves.toBe(false);

    expect(toast.error).toHaveBeenCalledWith("Failed to update location");
    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});

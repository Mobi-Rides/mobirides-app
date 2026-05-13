import { saveCar, unsaveCar, isCarSaved } from "@/services/savedCarService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const makeSession = (userId = makeId("user")) => ({
  data: {
    session: {
      user: { id: userId },
    },
  },
});

const makeSavedLookup = (data: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  }),
});

describe("savedCarService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires a signed-in user before saving a car", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

    await expect(saveCar(makeId("car"))).resolves.toBe(false);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Please sign in to save cars");
  });

  it("does not insert a duplicate favorite when the car is already saved", async () => {
    const savedRow = { id: makeId("saved") };
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(makeSession());
    (supabase.from as jest.Mock).mockReturnValue(makeSavedLookup(savedRow));

    await expect(saveCar(makeId("car"))).resolves.toBe(true);

    expect(supabase.from).toHaveBeenCalledWith("saved_cars");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("inserts a favorite and reports success for a new saved car", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(makeSession());
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeSavedLookup(null))
      .mockReturnValueOnce({ insert });

    await expect(saveCar(makeId("car"))).resolves.toBe(true);

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: expect.stringMatching(/^user-/),
      car_id: expect.stringMatching(/^car-/),
    }));
    expect(toast.success).toHaveBeenCalledWith("Car saved to your favorites");
  });

  it("removes a saved car for the signed-in user", async () => {
    const eqCar = jest.fn().mockResolvedValue({ error: null });
    const eqUser = jest.fn().mockReturnValue({ eq: eqCar });
    const del = jest.fn().mockReturnValue({ eq: eqUser });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(makeSession());
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await expect(unsaveCar(makeId("car"))).resolves.toBe(true);

    expect(eqUser).toHaveBeenCalledWith("user_id", expect.stringMatching(/^user-/));
    expect(eqCar).toHaveBeenCalledWith("car_id", expect.stringMatching(/^car-/));
    expect(toast.success).toHaveBeenCalledWith("Car removed from your favorites");
  });

  it("returns false when checking saved status without a session", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

    await expect(isCarSaved(makeId("car"))).resolves.toBe(false);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns true when a saved car row exists", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue(makeSession());
    (supabase.from as jest.Mock).mockReturnValue(makeSavedLookup({ id: makeId("saved") }));

    await expect(isCarSaved(makeId("car"))).resolves.toBe(true);
  });
});

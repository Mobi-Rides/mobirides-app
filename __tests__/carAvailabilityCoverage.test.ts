import {
  blockCarDates,
  getCarAvailability,
  getCarBlockedDates,
  getCarSchedule,
  unblockCarDates,
} from "@/services/carAvailabilityService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const selectEqQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(response),
  }),
});

describe("carAvailabilityService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches blocked dates for a vehicle", async () => {
    const carId = makeId("car");
    const blocked = [{ id: makeId("blocked"), car_id: carId, blocked_date: "2099-05-12", reason: "Maintenance" }];
    (supabase.from as jest.Mock).mockReturnValue(selectEqQuery({ data: blocked, error: null }));

    await expect(getCarBlockedDates(carId)).resolves.toEqual(blocked);
  });

  it("formats blocked date inserts in local YYYY-MM-DD form", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await blockCarDates(makeId("car"), [new Date("2099-06-02T12:00:00.000Z")], "Host unavailable");

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        car_id: expect.stringMatching(/^car-/),
        blocked_date: "2099-06-02",
        reason: "Host unavailable",
      }),
    ]);
  });

  it("ignores duplicate blocked date errors", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate" } }),
    });

    await expect(blockCarDates(makeId("car"), [new Date("2099-06-03")])).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalledWith("Date already blocked, ignoring duplicate.");
    (console.warn as jest.Mock).mockRestore();
  });

  it("unblocks a set of date strings for a vehicle", async () => {
    const inFilter = jest.fn().mockResolvedValue({ error: null });
    const eq = jest.fn().mockReturnValue({ in: inFilter });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await unblockCarDates(makeId("car"), [new Date("2099-07-04"), new Date("2099-07-05")]);

    expect(eq).toHaveBeenCalledWith("car_id", expect.stringMatching(/^car-/));
    expect(inFilter).toHaveBeenCalledWith("blocked_date", ["2099-07-04", "2099-07-05"]);
  });

  it("combines booking and blocked state into monthly availability", async () => {
    const month = new Date("2099-08-01T00:00:00.000Z");
    const bookingId = makeId("booking");
    const bookingsQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({
              data: [{ id: bookingId, start_date: "2099-08-10", end_date: "2099-08-12" }],
            }),
          }),
        }),
      }),
    };
    const blockedQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({
              data: [{ blocked_date: "2099-08-14", reason: "Service" }],
            }),
          }),
        }),
      }),
    };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(bookingsQuery)
      .mockReturnValueOnce(blockedQuery);

    const result = await getCarAvailability(makeId("car"), month);

    expect(result).toHaveLength(31);
    expect(result.find((day) => day.date.getDate() === 10)).toEqual(expect.objectContaining({
      status: "booked",
      bookingId,
    }));
    expect(result.find((day) => day.date.getDate() === 14)).toEqual(expect.objectContaining({
      status: "blocked",
      reason: "Service",
    }));
  });

  it("returns all valid bookings and blocked dates for schedule views", async () => {
    const bookings = [{ id: makeId("booking"), start_date: "2099-09-01", end_date: "2099-09-02" }];
    const blocked = [{ blocked_date: "2099-09-03", reason: "Cleaning" }];
    const bookingsQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ data: bookings, error: null }),
        }),
      }),
    };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(bookingsQuery)
      .mockReturnValueOnce(selectEqQuery({ data: blocked, error: null }));

    await expect(getCarSchedule(makeId("car"))).resolves.toEqual({ bookings, blocked });
  });
});

import { checkCarAvailability, getBookedDates, isDateUnavailable } from "@/services/availabilityService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const localDateString = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

const bookingsAvailabilityQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue(response),
      }),
    }),
  }),
});

const blockedAvailabilityQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockResolvedValue(response),
      }),
    }),
  }),
});

const bookedDatesQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue(response),
    }),
  }),
});

const blockedDatesQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(response),
  }),
});

describe("availabilityService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when a car has no overlapping bookings or blocked dates", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(bookingsAvailabilityQuery({ data: [], error: null }))
      .mockReturnValueOnce(blockedAvailabilityQuery({ data: [], error: null }));

    await expect(checkCarAvailability(
      makeId("car"),
      new Date("2099-01-10"),
      new Date("2099-01-12")
    )).resolves.toBe(true);
  });

  it("returns false for overlapping bookings and skips blocked date lookup", async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(bookingsAvailabilityQuery({
      data: [{ id: makeId("booking") }],
      error: null,
    }));

    await expect(checkCarAvailability(
      makeId("car"),
      new Date("2099-02-10"),
      new Date("2099-02-12")
    )).resolves.toBe(false);

    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("returns false when blocked dates overlap the requested window", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(bookingsAvailabilityQuery({ data: [], error: null }))
      .mockReturnValueOnce(blockedAvailabilityQuery({
        data: [{ id: makeId("blocked") }],
        error: null,
      }));

    await expect(checkCarAvailability(
      makeId("car"),
      new Date("2099-03-10"),
      new Date("2099-03-12")
    )).resolves.toBe(false);
  });

  it("expands booking ranges and blocked rows into unavailable dates", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(bookedDatesQuery({
        data: [{ start_date: "2099-04-10", end_date: "2099-04-12" }],
        error: null,
      }))
      .mockReturnValueOnce(blockedDatesQuery({
        data: [{ blocked_date: "2099-04-20" }],
        error: null,
      }));

    const dates = await getBookedDates(makeId("car"));

    expect(dates.map(localDateString)).toEqual([
      "2099-04-10",
      "2099-04-11",
      "2099-04-12",
      "2099-04-20",
    ]);
  });

  it("matches unavailable dates by calendar day", () => {
    const booked = [new Date(2099, 4, 15, 8, 30)];

    expect(isDateUnavailable(new Date(2099, 4, 15, 22, 0), booked)).toBe(true);
    expect(isDateUnavailable(new Date(2099, 4, 16, 8, 30), booked)).toBe(false);
  });
});

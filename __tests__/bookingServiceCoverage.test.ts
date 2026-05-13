const query = {
  select: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  lt: jest.fn(),
  gte: jest.fn(),
  not: jest.fn(),
  in: jest.fn(),
  or: jest.fn(),
  neq: jest.fn(),
};
const from = jest.fn((_table: string) => query);
const rpc = jest.fn();

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => from(table),
    rpc: (name: string, params: unknown) => rpc(name, params),
  },
}));

describe("bookingService coverage", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.lt.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.not.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.neq.mockReturnValue(query);
    rpc.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("expires pending and awaiting-payment bookings", async () => {
    const { handleExpiredBookings } = await import("@/services/bookingService");

    query.lt
      .mockResolvedValueOnce({
        data: [{ id: "pending-1" }, { id: "pending-2" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "payment-1" }],
        error: null,
      });
    query.in.mockResolvedValue({ error: null });

    await handleExpiredBookings();

    expect(from).toHaveBeenCalledWith("bookings");
    expect(query.update).toHaveBeenCalledWith({ status: "expired" });
    expect(query.update).toHaveBeenCalledWith({ status: "expired", payment_status: "expired" });
    expect(query.in).toHaveBeenCalledWith("id", ["pending-1", "pending-2"]);
    expect(query.in).toHaveBeenCalledWith("id", ["payment-1"]);
  });

  it("does nothing when no expired bookings are found and catches query errors", async () => {
    const { handleExpiredBookings } = await import("@/services/bookingService");

    query.lt
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    await handleExpiredBookings();
    expect(query.update).not.toHaveBeenCalled();

    query.lt.mockResolvedValueOnce({ data: null, error: new Error("pending query failed") });
    await expect(handleExpiredBookings()).resolves.toBeUndefined();
  });

  it("creates booking reminders for confirmed bookings starting tomorrow", async () => {
    const { createBookingReminders } = await import("@/services/bookingService");

    query.lt.mockResolvedValueOnce({
      data: [
        {
          id: "booking-1",
          car: { brand: "Toyota", model: "Aqua", owner_id: "host-1" },
        },
      ],
      error: null,
    });

    await expect(createBookingReminders()).resolves.toEqual({
      success: true,
      data: [
        {
          id: "booking-1",
          car: { brand: "Toyota", model: "Aqua", owner_id: "host-1" },
        },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("create_booking_notification", {
      p_booking_id: "booking-1",
      p_notification_type: "pickup_reminder",
      p_content: "Reminder: A booking for your Toyota Aqua starts tomorrow.",
    });
  });

  it("returns reminder failure payloads when reminder queries fail", async () => {
    const { createBookingReminders } = await import("@/services/bookingService");

    query.lt.mockResolvedValueOnce({ data: null, error: new Error("reminder query failed") });

    const result = await createBookingReminders();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("checks booking conflicts with and without an excluded booking", async () => {
    const { checkBookingConflicts } = await import("@/services/bookingService");

    query.or.mockResolvedValueOnce({
      data: [{ id: "booking-1", status: "confirmed" }],
      error: null,
    });

    await expect(checkBookingConflicts("car-1", "2026-05-12", "2026-05-14")).resolves.toEqual({
      hasConflicts: true,
      conflicts: [{ id: "booking-1", status: "confirmed" }],
    });

    query.neq.mockResolvedValueOnce({ data: [], error: null });
    await expect(checkBookingConflicts("car-1", "2026-05-12", "2026-05-14", "booking-1")).resolves.toEqual({
      hasConflicts: false,
      conflicts: [],
    });

    expect(query.neq).toHaveBeenCalledWith("id", "booking-1");
  });

  it("throws booking conflict query errors", async () => {
    const { checkBookingConflicts } = await import("@/services/bookingService");

    query.or.mockResolvedValueOnce({ data: null, error: new Error("conflict query failed") });

    await expect(checkBookingConflicts("car-1", "2026-05-12", "2026-05-14")).rejects.toThrow("conflict query failed");
  });
});

export {};

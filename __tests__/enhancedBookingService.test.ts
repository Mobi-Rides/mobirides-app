import { EnhancedBookingService } from "../src/services/enhancedBookingService";

type QueryResult = { data: unknown; error: unknown };

const thenable = (result: QueryResult) => ({
  then: (onFulfilled: (value: QueryResult) => unknown) => Promise.resolve(result).then(onFulfilled),
});

const makeSelectQuery = (result: QueryResult) => {
  const query: any = {
    eq: jest.fn(() => query),
    single: jest.fn().mockResolvedValue(result),
    then: (onFulfilled: (value: QueryResult) => unknown) => Promise.resolve(result).then(onFulfilled),
  };
  return query;
};

const makeUpdateQuery = (result: QueryResult = { data: null, error: null }) => ({
  eq: jest.fn(() => thenable(result)),
});

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    channel: jest.fn(),
  },
}));

jest.mock("@/utils/toast-utils", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("EnhancedBookingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-01T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("processes booking reminders for 24h, 2h and 30m windows", async () => {
    const today = "2026-04-01";
    const tomorrow = "2026-04-02";

    const bookingSelectResults = [
      {
        data: [
          {
            id: "booking-tomorrow",
            start_date: tomorrow,
            start_time: "10:00:00",
            renter_id: "renter-1",
            cars: { id: "car-1", brand: "Toyota", model: "Vitz", owner_id: "host-1" },
          },
        ],
        error: null,
      },
      {
        data: [
          {
            id: "booking-two-hours",
            start_date: today,
            start_time: "12:00:00",
            renter_id: "renter-2",
            cars: { id: "car-2", brand: "Honda", model: "Fit", owner_id: "host-2" },
          },
        ],
        error: null,
      },
      {
        data: [
          {
            id: "booking-thirty-min",
            start_date: today,
            start_time: "10:30:00",
            renter_id: "renter-3",
            cars: { id: "car-3", brand: "Mazda", model: "Demio", owner_id: "host-3" },
          },
        ],
        error: null,
      },
    ];

    let bookingSelectIndex = 0;
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = jest.fn().mockImplementation(() => makeUpdateQuery());

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: jest.fn(() => makeSelectQuery(bookingSelectResults[bookingSelectIndex++])),
          update: updateMock,
        };
      }

      if (table === "notifications") {
        return {
          insert: insertMock,
        };
      }

      return {
        select: jest.fn(() => makeSelectQuery({ data: null, error: null })),
      };
    });

    await EnhancedBookingService.createBookingReminders();

    // Tomorrow reminder creates renter + host notification.
    // 2-hour reminder creates renter + host notification.
    // 30-minute reminder creates renter + host notification.
    expect(insertMock).toHaveBeenCalledTimes(6);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("sends post-confirmation guidance to host", async () => {
    const booking = {
      id: "booking-host",
      start_date: "2026-04-08",
      start_time: "09:00",
      renter_id: "renter-9",
      cars: {
        id: "car-9",
        brand: "Nissan",
        model: "Note",
        owner_id: "host-9",
      },
    };

    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: jest.fn(() => makeSelectQuery({ data: booking, error: null })),
        };
      }

      if (table === "notifications") {
        return {
          insert: insertMock,
        };
      }

      return {
        select: jest.fn(() => makeSelectQuery({ data: null, error: null })),
      };
    });

    await EnhancedBookingService.sendPostConfirmationGuidance("booking-host", "host");

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "host-9",
        type: "booking_confirmed_host",
        role_target: "host_only",
      }),
    );
  });

  it("returns early when booking is not found", async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: jest.fn(() => makeSelectQuery({ data: null, error: null })),
        };
      }

      if (table === "notifications") {
        return {
          insert: insertMock,
        };
      }

      return {
        select: jest.fn(() => makeSelectQuery({ data: null, error: null })),
      };
    });

    await EnhancedBookingService.sendPostConfirmationGuidance("missing-booking", "renter");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("sends post-confirmation guidance to renter", async () => {
    const booking = {
      id: "booking-renter",
      start_date: "2026-04-10",
      start_time: "08:30",
      renter_id: "renter-20",
      cars: {
        id: "car-20",
        brand: "Suzuki",
        model: "Swift",
        owner_id: "host-20",
      },
    };

    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: jest.fn(() => makeSelectQuery({ data: booking, error: null })),
        };
      }

      if (table === "notifications") {
        return {
          insert: insertMock,
        };
      }

      return {
        select: jest.fn(() => makeSelectQuery({ data: null, error: null })),
      };
    });

    await EnhancedBookingService.sendPostConfirmationGuidance("booking-renter", "renter");

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "renter-20",
        type: "booking_confirmed_renter",
        role_target: "renter_only",
      }),
    );
  });

  it("handles reminder query errors without throwing", async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: jest.fn(() => {
            throw new Error("booking query failed");
          }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await expect(EnhancedBookingService.createBookingReminders()).resolves.toBeUndefined();
  });
});
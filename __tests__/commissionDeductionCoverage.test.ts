const toast = {
  error: jest.fn(),
  success: jest.fn(),
};
const query = {
  select: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};
const from = jest.fn((_table: string) => query);
const getCurrentCommissionRate = jest.fn();
const checkHostCanAcceptBooking = jest.fn();

jest.mock("sonner", () => ({ toast }));
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => from(table),
  },
}));
jest.mock("@/services/commission/commissionRates", () => ({
  getCurrentCommissionRate: () => getCurrentCommissionRate(),
}));
jest.mock("@/services/commission/walletValidation", () => ({
  checkHostCanAcceptBooking: (hostId: string, bookingTotal: number) => checkHostCanAcceptBooking(hostId, bookingTotal),
}));

describe("commissionDeduction coverage", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.insert.mockResolvedValue({ error: null });
    query.eq.mockReturnValue(query);
    getCurrentCommissionRate.mockResolvedValue(0.15);
    checkHostCanAcceptBooking.mockResolvedValue({ canAccept: true });
  });

  it("deducts commission, records the transaction, and updates booking metadata", async () => {
    const { deductCommissionFromEarnings } = await import("@/services/commission/commissionDeduction");

    query.single.mockResolvedValue({ data: { id: "wallet-1", balance: 200 }, error: null });

    await expect(deductCommissionFromEarnings("host-1", "booking-abcdef12", 400)).resolves.toBe(true);

    expect(checkHostCanAcceptBooking).toHaveBeenCalledWith("host-1", 400);
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ balance: 140 }));
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet_id: "wallet-1",
        booking_id: "booking-abcdef12",
        amount: -60,
        balance_before: 200,
        balance_after: 140,
        commission_rate: 0.15,
        booking_reference: "BOOKING_abcdef12",
      }),
    );
    expect(query.update).toHaveBeenCalledWith({ commission_amount: 60, commission_status: "deducted" });
    expect(toast.success).toHaveBeenCalledWith("Booking confirmed! Commission of P60.00 deducted from wallet");
  });

  it("returns false when host cannot accept or wallet fetch fails", async () => {
    const { deductCommissionFromEarnings } = await import("@/services/commission/commissionDeduction");

    checkHostCanAcceptBooking.mockResolvedValueOnce({ canAccept: false, message: "Top up first" });
    await expect(deductCommissionFromEarnings("host-1", "booking-1", 100)).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Top up first");

    checkHostCanAcceptBooking.mockResolvedValueOnce({ canAccept: true });
    query.single.mockResolvedValueOnce({ data: null, error: { message: "wallet missing" } });
    await expect(deductCommissionFromEarnings("host-1", "booking-1", 100)).resolves.toBe(false);
  });

  it("returns false on balance update failure and tolerates non-critical transaction or booking update failures", async () => {
    const { deductCommissionFromEarnings, deductCommissionOnBookingAcceptance } = await import("@/services/commission/commissionDeduction");

    query.single.mockResolvedValue({ data: { id: "wallet-1", balance: 100 }, error: null });
    query.eq.mockImplementationOnce(() => query).mockResolvedValueOnce({ error: { message: "update failed" } });
    await expect(deductCommissionFromEarnings("host-1", "booking-1", 100)).resolves.toBe(false);

    query.eq.mockReset();
    query.eq.mockReturnValue(query);
    query.insert.mockResolvedValueOnce({ error: { message: "transaction log failed" } });
    query.eq
      .mockImplementationOnce(() => query)
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "booking update failed" } });
    await expect(deductCommissionOnBookingAcceptance("host-1", "booking-1", 100)).resolves.toBe(true);
  });

  it("catches unexpected commission failures", async () => {
    const { deductCommissionFromEarnings } = await import("@/services/commission/commissionDeduction");

    getCurrentCommissionRate.mockRejectedValueOnce(new Error("rate unavailable"));

    await expect(deductCommissionFromEarnings("host-1", "booking-1", 100)).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to process commission. Please try again.");
  });
});

export {};

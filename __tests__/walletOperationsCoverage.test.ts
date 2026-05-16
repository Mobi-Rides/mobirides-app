import { walletOperations } from "@/services/wallet/walletOperations";
import { supabase } from "@/integrations/supabase/client";
import { getWalletBalance } from "@/services/wallet/walletBalance";
import { notificationService } from "@/services/wallet/notificationService";
import { toast } from "sonner";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/services/wallet/walletBalance", () => ({
  getWalletBalance: jest.fn(),
}));

jest.mock("@/services/wallet/notificationService", () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const updateQuery = (error: unknown = null) => ({
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error }),
  }),
});

const insertQuery = (error: unknown = null) => ({
  insert: jest.fn().mockResolvedValue({ error }),
});

describe("walletOperations coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects booking fee deductions when the wallet is missing", async () => {
    (getWalletBalance as jest.Mock).mockResolvedValue(null);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(walletOperations.deductBookingFee(makeId("host"), makeId("booking"), 50)).resolves.toBe(false);

    expect(supabase.from).not.toHaveBeenCalled();
    (console.error as jest.Mock).mockRestore();
  });

  it("rejects booking fee deductions when the balance is insufficient", async () => {
    (getWalletBalance as jest.Mock).mockResolvedValue({ id: makeId("wallet"), balance: 25, currency: "BWP" });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(walletOperations.deductBookingFee(makeId("host"), makeId("booking"), 50)).resolves.toBe(false);

    expect(toast.error).toHaveBeenCalledWith("Insufficient wallet balance for booking fee");
    (console.error as jest.Mock).mockRestore();
  });

  it("deducts booking fees and records wallet transactions", async () => {
    const walletId = makeId("wallet");
    const bookingId = makeId("booking");
    const hostId = makeId("host");
    (getWalletBalance as jest.Mock).mockResolvedValue({ id: walletId, balance: 200, currency: "BWP" });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateQuery())
      .mockReturnValueOnce(insertQuery());
    (notificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

    await expect(walletOperations.deductBookingFee(hostId, bookingId, 45)).resolves.toBe(true);

    expect(supabase.from).toHaveBeenNthCalledWith(1, "host_wallets");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "wallet_transactions");
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      hostId,
      "wallet_deduction",
      "Platform fee of P45.00 deducted for booking",
      bookingId
    );
  });

  it("records rental earnings without changing the wallet balance", async () => {
    const hostId = makeId("host");
    const bookingId = makeId("booking");
    (getWalletBalance as jest.Mock).mockResolvedValue({ id: makeId("wallet"), balance: 300, currency: "BWP" });
    (supabase.from as jest.Mock).mockReturnValue(insertQuery());
    (notificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

    await expect(walletOperations.processRentalEarnings(hostId, bookingId, 450)).resolves.toBe(true);

    expect(notificationService.createNotification).toHaveBeenCalledWith(
      hostId,
      "rental_earnings",
      "You earned P450.00 from your rental",
      bookingId
    );
  });

  it("credits insurance payouts and writes payout metadata", async () => {
    const userId = makeId("user");
    const claimId = makeId("claim");
    const claimNumber = `CLM-${crypto.randomUUID().slice(0, 8)}`;
    (getWalletBalance as jest.Mock).mockResolvedValue({ id: makeId("wallet"), balance: 100, currency: "BWP" });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateQuery())
      .mockReturnValueOnce(insertQuery());
    (notificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

    await expect(walletOperations.creditInsurancePayout(userId, claimId, 800, claimNumber)).resolves.toBe(true);

    const transactionInsert = (supabase.from as jest.Mock).mock.results[1].value.insert;
    expect(transactionInsert).toHaveBeenCalledWith(expect.objectContaining({
      transaction_type: "insurance_payout",
      amount: 800,
      metadata: { claim_id: claimId, claim_number: claimNumber },
    }));
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      userId,
      "insurance_payout",
      `Insurance claim ${claimNumber} payout of P800.00 credited to your wallet`
    );
  });

  it("routes booking commission processing through rental earnings", async () => {
    const spy = jest.spyOn(walletOperations, "processRentalEarnings").mockResolvedValue(true);

    await expect(walletOperations.processBookingCommission(
      makeId("host"),
      makeId("booking"),
      30,
      270
    )).resolves.toBe(true);

    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^host-/), expect.stringMatching(/^booking-/), 300);
    spy.mockRestore();
  });
});

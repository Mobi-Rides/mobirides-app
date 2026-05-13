import { topUpWallet } from "@/services/wallet/walletTopUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createWalletForHost, getWalletBalance } from "@/services/wallet/walletBalance";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

jest.mock("@/services/wallet/walletBalance", () => ({
  getWalletBalance: jest.fn(),
  createWalletForHost: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

describe("walletTopUp coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects invalid top-up amounts before authentication", async () => {
    await expect(topUpWallet(makeId("host"), {
      amount: 0,
      payment_method: "card",
    })).resolves.toBe(false);

    expect(supabase.auth.getUser).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Invalid top-up parameters");
  });

  it("rejects top-up attempts from a different authenticated user", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: makeId("other-user") } },
      error: null,
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(topUpWallet(makeId("host"), {
      amount: 100,
      payment_method: "card",
    })).resolves.toBe(false);

    expect(getWalletBalance).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Authentication required for wallet top-up");
    (console.error as jest.Mock).mockRestore();
  });

  it("creates a missing wallet before a successful top-up", async () => {
    const hostId = makeId("host");
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: hostId } }, error: null });
    (getWalletBalance as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: makeId("wallet"), balance: 0, currency: "BWP" });
    (createWalletForHost as jest.Mock).mockResolvedValue(true);
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { success: true, wallet_id: makeId("wallet"), balance: 125, transaction_id: makeId("txn") },
      error: null,
    });

    await expect(topUpWallet(hostId, {
      amount: 125,
      payment_method: "card",
      payment_reference: makeId("payment"),
    })).resolves.toBe(true);

    expect(createWalletForHost).toHaveBeenCalledWith(hostId);
    expect(supabase.rpc).toHaveBeenCalledWith("wallet_topup", expect.objectContaining({
      p_amount: 125,
      p_payment_method: "card",
      p_payment_reference: expect.stringMatching(/^payment-/),
    }));
    expect(toast.success).toHaveBeenCalledWith("Successfully added P125.00 to your wallet");
  });

  it("returns false when the wallet top-up RPC fails", async () => {
    const hostId = makeId("host");
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: hostId } }, error: null });
    (getWalletBalance as jest.Mock).mockResolvedValue({ id: makeId("wallet"), balance: 20, currency: "BWP" });
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: { success: false }, error: null });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(topUpWallet(hostId, {
      amount: 75,
      payment_method: "bank_transfer",
    })).resolves.toBe(false);

    expect(toast.error).toHaveBeenCalledWith("Failed to update wallet balance");
    (console.error as jest.Mock).mockRestore();
  });
});

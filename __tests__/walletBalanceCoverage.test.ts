import { createWalletForHost, getWalletBalance } from "@/services/wallet/walletBalance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
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

const walletQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(response),
    }),
  }),
});

describe("walletBalance coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing wallet balance", async () => {
    const wallet = { id: makeId("wallet"), balance: 250, currency: "BWP" };
    (supabase.from as jest.Mock).mockReturnValue(walletQuery({ data: wallet, error: null }));

    await expect(getWalletBalance(makeId("host"))).resolves.toEqual(wallet);
  });

  it("returns null for non-not-found wallet fetch errors", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (supabase.from as jest.Mock).mockReturnValue(walletQuery({
      data: null,
      error: { code: "42501", message: "denied" },
    }));

    await expect(getWalletBalance(makeId("host"))).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith(
      "WalletBalance: Error fetching wallet balance:",
      { code: "42501", message: "denied" }
    );
    (console.error as jest.Mock).mockRestore();
  });

  it("creates a wallet for the authenticated host", async () => {
    const hostId = makeId("host");
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: makeId("wallet"), host_id: hostId },
          error: null,
        }),
      }),
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: hostId } }, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(createWalletForHost(hostId)).resolves.toBe(true);

    expect(insert).toHaveBeenCalledWith({
      host_id: hostId,
      balance: 0.00,
      currency: "BWP",
    });
    expect(toast.success).toHaveBeenCalledWith("Wallet created successfully");
  });

  it("rejects wallet creation when the authenticated user does not match the host", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: makeId("other-user") } },
      error: null,
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(createWalletForHost(makeId("host"))).resolves.toBe(false);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Authentication required to create wallet");
    (console.error as jest.Mock).mockRestore();
  });

  it("treats duplicate wallet creation as successful", async () => {
    const hostId = makeId("host");
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "already exists" },
        }),
      }),
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: hostId } }, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(createWalletForHost(hostId)).resolves.toBe(true);
  });
});

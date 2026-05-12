const query = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  insert: jest.fn(),
};
const from = jest.fn((_table: string) => query);
const rpc = jest.fn();
const getUser = jest.fn();
const sendWalletNotification = jest.fn();
const sendEmail = jest.fn();

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => from(table),
    rpc: (name: string, params: unknown) => rpc(name, params),
    auth: {
      getUser: () => getUser(),
    },
  },
}));
jest.mock("@/services/pushNotificationService", () => ({
  pushNotificationService: {
    sendWalletNotification: (userId: string, data: unknown) => sendWalletNotification(userId, data),
  },
}));
jest.mock("@/services/notificationService", () => ({
  ResendEmailService: {
    getInstance: () => ({ sendEmail }),
  },
}));

describe("wallet internal services coverage", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockResolvedValue({ data: [], error: null });
    query.insert.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "host-1", email: "host@example.com", user_metadata: { full_name: "Host User" } } } });
    sendWalletNotification.mockResolvedValue({ success: true });
    sendEmail.mockResolvedValue({ success: true });
  });

  it("returns transaction history, empty wallet history, and errors as empty arrays", async () => {
    const { transactionHistory } = await import("@/services/wallet/transactionHistory");

    query.single.mockResolvedValueOnce({ data: { id: "wallet-1" }, error: null });
    query.limit.mockResolvedValueOnce({
      data: [{ id: "tx-1", transaction_type: "topup", amount: 100 }],
      error: null,
    });
    await expect(transactionHistory.getTransactionHistory("host-1", 10)).resolves.toEqual([
      { id: "tx-1", transaction_type: "topup", amount: 100 },
    ]);
    expect(query.limit).toHaveBeenCalledWith(10);

    query.single.mockResolvedValueOnce({ data: null, error: null });
    await expect(transactionHistory.getTransactionHistory("host-2")).resolves.toEqual([]);

    query.single.mockResolvedValueOnce({ data: { id: "wallet-1" }, error: null });
    query.limit.mockResolvedValueOnce({ data: null, error: { message: "history failed" } });
    await expect(transactionHistory.getTransactionHistory("host-1")).resolves.toEqual([]);

    query.select.mockImplementationOnce(() => {
      throw new Error("wallet lookup crashed");
    });
    await expect(transactionHistory.getTransactionHistory("host-1")).resolves.toEqual([]);
  });

  it("creates wallet notifications with push and email channels", async () => {
    const { notificationService } = await import("@/services/wallet/notificationService");

    await notificationService.createWalletNotification("host-1", "topup", 125, "Manual top up");

    expect(rpc).toHaveBeenCalledWith("create_wallet_notification", {
      p_host_id: "host-1",
      p_type: "topup",
      p_amount: 125,
      p_description: "Manual top up",
    });
    expect(sendWalletNotification).toHaveBeenCalledWith("host-1", { type: "topup", amount: 125 });
    expect(sendEmail).toHaveBeenCalledWith(
      "host@example.com",
      "wallet-topup",
      expect.objectContaining({
        name: "Host User",
        amount: "125.00",
        description: "Manual top up",
      }),
      "Wallet Topup - MobiRides",
    );
  });

  it("handles wallet notification rpc failures, missing users, and unexpected errors", async () => {
    const { notificationService } = await import("@/services/wallet/notificationService");

    rpc.mockResolvedValueOnce({ error: { message: "rpc failed" } });
    await expect(notificationService.createWalletNotification("host-1", "deduction", 50)).resolves.toBeUndefined();
    expect(sendWalletNotification).not.toHaveBeenCalled();

    getUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(notificationService.createWalletNotification("host-1", "payment_received", 75)).resolves.toBeUndefined();

    rpc.mockRejectedValueOnce(new Error("rpc crashed"));
    await expect(notificationService.createWalletNotification("host-1", "topup", 20)).resolves.toBeUndefined();
  });

  it("creates generic mapped notifications and logs insert failures safely", async () => {
    const { notificationService } = await import("@/services/wallet/notificationService");

    await notificationService.createNotification("host-1", "wallet_created", "Wallet ready", "booking-1");
    expect(query.insert).toHaveBeenCalledWith({
      user_id: "host-1",
      type: "wallet_topup",
      title: "Notification",
      content: "Wallet ready",
      related_booking_id: "booking-1",
      is_read: false,
    });

    query.insert.mockResolvedValueOnce({ error: { message: "insert failed" } });
    await expect(notificationService.createNotification("host-1", "unknown_type", "Fallback")).resolves.toBeUndefined();

    query.insert.mockImplementationOnce(() => {
      throw new Error("insert crashed");
    });
    await expect(notificationService.createNotification("host-1", "booking_request", "Request")).resolves.toBeUndefined();
  });
});

export {};

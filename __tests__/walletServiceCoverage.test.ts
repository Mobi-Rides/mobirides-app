const getWalletBalance = jest.fn();
const createWalletForHost = jest.fn();
const topUpWallet = jest.fn();
const walletOperations = {
  deductBookingFee: jest.fn(),
  processBookingCommission: jest.fn(),
  deductBookingCommission: jest.fn(),
  creditInsurancePayout: jest.fn(),
};
const transactionHistory = {
  getTransactionHistory: jest.fn(),
};
const notificationService = {
  createWalletNotification: jest.fn(),
  createNotification: jest.fn(),
};

jest.mock("@/services/wallet/walletBalance", () => ({
  getWalletBalance: (...args: unknown[]) => getWalletBalance(...args),
  createWalletForHost: (...args: unknown[]) => createWalletForHost(...args),
}));
jest.mock("@/services/wallet/walletTopUp", () => ({
  topUpWallet: (...args: unknown[]) => topUpWallet(...args),
}));
jest.mock("@/services/wallet/walletOperations", () => ({ walletOperations }));
jest.mock("@/services/wallet/transactionHistory", () => ({ transactionHistory }));
jest.mock("@/services/wallet/notificationService", () => ({ notificationService }));

describe("walletService coverage", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadService = async () => (await import("@/services/walletService")).walletService;

  it("delegates wallet reads, transaction history, and wallet operations", async () => {
    const walletService = await loadService();

    getWalletBalance.mockResolvedValue({ balance: 250 });
    transactionHistory.getTransactionHistory.mockResolvedValue([{ id: "tx-1" }]);
    walletOperations.deductBookingFee.mockResolvedValue(true);
    walletOperations.processBookingCommission.mockResolvedValue(true);
    walletOperations.deductBookingCommission.mockResolvedValue(true);
    walletOperations.creditInsurancePayout.mockResolvedValue(true);

    await expect(walletService.getWalletBalance("host-1")).resolves.toEqual({ balance: 250 });
    await expect(walletService.getTransactionHistory("host-1", 5)).resolves.toEqual([{ id: "tx-1" }]);
    await expect(walletService.deductBookingFee("host-1", "booking-1", 10)).resolves.toBe(true);
    await expect(walletService.processRentalEarnings("host-1", "booking-1", 15, 85)).resolves.toBe(true);
    await expect(walletService.deductBookingCommission("host-1", "booking-1", 15)).resolves.toBe(true);
    await expect(walletService.creditInsurancePayout("user-1", "claim-1", 400, "CLM-1")).resolves.toBe(true);

    expect(transactionHistory.getTransactionHistory).toHaveBeenCalledWith("host-1", 5);
    expect(walletOperations.processBookingCommission).toHaveBeenCalledWith("host-1", "booking-1", 15, 85);
  });

  it("creates notifications only when wallet top-up and wallet creation succeed", async () => {
    const walletService = await loadService();

    topUpWallet.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    createWalletForHost.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(walletService.topUpWallet("host-1", { amount: 100, payment_method: "card" })).resolves.toBe(true);
    await expect(walletService.topUpWallet("host-2", { amount: 50, payment_method: "card" })).resolves.toBe(false);
    await expect(walletService.createWalletForHost("host-1")).resolves.toBe(true);
    await expect(walletService.createWalletForHost("host-2")).resolves.toBe(false);

    expect(notificationService.createWalletNotification).toHaveBeenCalledTimes(1);
    expect(notificationService.createWalletNotification).toHaveBeenCalledWith("host-1", "topup", 100);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      "host-1",
      "wallet_created",
      "Your wallet has been created successfully",
    );
  });
});

export {};

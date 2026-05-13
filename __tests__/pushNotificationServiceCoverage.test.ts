const invoke = jest.fn();
const eq = jest.fn();
const select = jest.fn(() => ({ eq }));
const from = jest.fn((_table: string) => ({ select }));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => from(table),
    functions: {
      invoke: (name: string, options: unknown) => invoke(name, options),
    },
  },
}));

describe("PushNotificationService coverage", () => {
  beforeEach(() => {
    jest.resetModules();
    from.mockClear();
    select.mockClear();
    eq.mockReset();
    invoke.mockReset();
  });

  const loadService = async () => (await import("@/services/pushNotificationService")).pushNotificationService;

  it("returns fetch errors and empty success when there are no subscriptions", async () => {
    const service = await loadService();

    eq.mockResolvedValueOnce({ data: null, error: { message: "cannot read subscriptions" } });
    await expect(service.sendPushNotification("user-1", { title: "Hi", body: "Body" })).resolves.toEqual({
      success: false,
      error: "cannot read subscriptions",
    });

    eq.mockResolvedValueOnce({ data: [], error: null });
    await expect(service.sendPushNotification("user-1", { title: "Hi", body: "Body" })).resolves.toEqual({
      success: true,
      messageIds: [],
    });
  });

  it("sends push notifications to each subscription and reports partial success", async () => {
    const service = await loadService();

    eq.mockResolvedValueOnce({
      data: [
        { endpoint: "https://push/1", p256dh: "key-1", auth: "auth-1" },
        { endpoint: "https://push/2", p256dh: "key-2", auth: "auth-2" },
      ],
      error: null,
    });
    invoke
      .mockResolvedValueOnce({ data: { ok: true }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "device expired" } });

    const result = await service.sendPushNotification("user-1", {
      title: "Title",
      body: "Body",
      icon: "/icon.png",
      url: "/target",
    });

    expect(result).toEqual({ success: true, messageIds: ["push_sent"], error: undefined });
    expect(invoke).toHaveBeenCalledWith("send-push-notification", {
      body: expect.objectContaining({
        payload: { title: "Title", body: "Body", icon: "/icon.png", url: "/target" },
      }),
    });
  });

  it("reports all-device failures and unhandled failures", async () => {
    const service = await loadService();

    eq.mockResolvedValueOnce({
      data: [{ endpoint: "https://push/1", p256dh: "key-1", auth: "auth-1" }],
      error: null,
    });
    invoke.mockRejectedValueOnce(new Error("network down"));

    await expect(service.sendPushNotification("user-1", { title: "Hi", body: "Body" })).resolves.toEqual({
      success: false,
      messageIds: [],
      error: "All push notifications failed",
    });

    from.mockImplementationOnce(() => {
      throw new Error("db unavailable");
    });
    await expect(service.sendPushNotification("user-1", { title: "Hi", body: "Body" })).resolves.toEqual({
      success: false,
      error: "db unavailable",
    });
  });

  it("builds booking, message, and wallet notification payloads", async () => {
    const service = await loadService();
    const sendSpy = jest.spyOn(service, "sendPushNotification").mockResolvedValue({ success: true, messageIds: ["sent"] });

    await service.sendBookingNotification("renter-1", {
      type: "awaiting_payment",
      carBrand: "Toyota",
      carModel: "Aqua",
      bookingReference: "booking-ref",
    });
    await service.sendBookingNotification("host-1", {
      type: "request",
      carBrand: "Honda",
      carModel: "Fit",
      bookingReference: "booking-ref",
    });
    await service.sendMessageNotification("user-1", {
      senderName: "Naledi",
      messagePreview: "This message preview is deliberately longer than fifty characters.",
    });
    await service.sendMessageNotification("user-2", { senderName: "Kago" });
    await service.sendWalletNotification("user-3", { type: "topup", amount: 125 });
    await service.sendWalletNotification("user-4", { type: "deduction", amount: 75.5 });
    await service.sendWalletNotification("user-5", { type: "payment_received", amount: 90 });

    expect(sendSpy).toHaveBeenCalledWith(
      "renter-1",
      expect.objectContaining({
        title: "Payment Required",
        url: "/rental-details/booking-ref?pay=true",
      }),
    );
    expect(sendSpy).toHaveBeenCalledWith(
      "host-1",
      expect.objectContaining({
        title: "New Booking Request",
        url: "/host-bookings",
      }),
    );
    expect(sendSpy).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        body: "Naledi: This message preview is deliberately longer than f...",
      }),
    );
    expect(sendSpy).toHaveBeenCalledWith("user-5", expect.objectContaining({ body: "You received P90.00 in your wallet" }));
  });
});

export {};

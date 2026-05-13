const toast = {
  error: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
};
const invoke = jest.fn();
const upsert = jest.fn();
const getUser = jest.fn();

jest.mock("sonner", () => ({ toast }));
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => getUser(),
    },
    functions: {
      invoke: (name: string) => invoke(name),
    },
    from: (_table: string) => ({ upsert }),
  },
}));

describe("browser push notification utilities", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("requests permission and reports unsupported, granted, and denied states", async () => {
    const { requestNotificationPermission } = await import("@/utils/pushNotifications");
    const originalNotification = window.Notification;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Notification;
    await requestNotificationPermission();
    expect(toast.error).toHaveBeenCalledWith("This browser does not support notifications.");

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { requestPermission: jest.fn().mockResolvedValue("granted") },
    });
    await requestNotificationPermission();
    expect(toast.success).toHaveBeenCalledWith("Notifications enabled!");

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { requestPermission: jest.fn().mockResolvedValue("denied") },
    });
    await requestNotificationPermission();
    expect(toast.warning).toHaveBeenCalledWith("Notifications denied or dismissed.");

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: originalNotification,
    });
  });

  it("subscribes to push and persists the subscription for a logged-in user", async () => {
    const subscription = {
      endpoint: "https://push.example/subscription",
      toJSON: () => ({ keys: { p256dh: "p256dh-key", auth: "auth-key" } }),
    };
    const subscribe = jest.fn().mockResolvedValue(subscription);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { subscribe } }) },
    });
    invoke.mockResolvedValue({ data: { vapidKey: "AQIDBA" }, error: null });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    upsert.mockResolvedValue({ error: null });

    const { subscribeToPush } = await import("@/utils/pushNotifications");

    await expect(subscribeToPush()).resolves.toBe(subscription);
    expect(subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 2, 3, 4]),
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        endpoint: "https://push.example/subscription",
        p256dh: "p256dh-key",
        auth: "auth-key",
      }),
      { onConflict: "user_id" },
    );
    expect(toast.success).toHaveBeenCalledWith("Push notifications enabled!");
  });

  it("handles missing VAPID keys, missing users, database errors, and subscription failures", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { subscribe: jest.fn() } }) },
    });
    const { subscribeToPush } = await import("@/utils/pushNotifications");

    invoke.mockResolvedValueOnce({ data: {}, error: null });
    await expect(subscribeToPush()).resolves.toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("Failed to configure push notifications");

    const subscription = {
      endpoint: "https://push.example/subscription",
      toJSON: () => ({ keys: {} }),
    };
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { subscribe: jest.fn().mockResolvedValue(subscription) } }) },
    });
    invoke.mockResolvedValueOnce({ data: { vapidKey: "AQIDBA" }, error: null });
    getUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(subscribeToPush()).resolves.toBe(subscription);

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { subscribe: jest.fn().mockResolvedValue(subscription) } }) },
    });
    invoke.mockResolvedValueOnce({ data: { vapidKey: "AQIDBA" }, error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-2" } } });
    upsert.mockResolvedValueOnce({ error: { message: "duplicate" } });
    await expect(subscribeToPush()).resolves.toBe(subscription);

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager: { subscribe: jest.fn().mockRejectedValue(new Error("blocked")) } }) },
    });
    invoke.mockResolvedValueOnce({ data: { vapidKey: "AQIDBA" }, error: null });
    await expect(subscribeToPush()).resolves.toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("Failed to enable push notifications");
  });
});

export {};

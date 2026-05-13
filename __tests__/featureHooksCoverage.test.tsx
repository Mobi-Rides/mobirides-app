import { act, renderHook, waitFor } from "@testing-library/react";

const rpc = jest.fn();
const query = {
  select: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  eq: jest.fn(),
};
const from = jest.fn((_table: string) => query);
const useAuth = jest.fn();
const useIsAdmin = jest.fn();
const useNavigate = jest.fn();
const useLocation = jest.fn();
const isNativePlatform = jest.fn();
const addListener = jest.fn();
const exitApp = jest.fn();

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (name: string, params?: unknown) => rpc(name, params),
    from: (table: string) => from(table),
  },
}));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuth(),
}));
jest.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: () => useIsAdmin(),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: () => useNavigate(),
  useLocation: () => useLocation(),
}));
jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));
jest.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: unknown[]) => addListener(...args),
    exitApp: () => exitApp(),
  },
}));

describe("feature hook coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpc.mockResolvedValue({ data: [], error: null });
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.eq.mockResolvedValue({ data: [], error: null });
    useAuth.mockReturnValue({ user: { id: "admin-1" } });
    useIsAdmin.mockReturnValue({ isAdmin: true, isSuperAdmin: false });
    useNavigate.mockReturnValue(jest.fn());
    useLocation.mockReturnValue({ pathname: "/details/1" });
    isNativePlatform.mockReturnValue(true);
    addListener.mockResolvedValue({ remove: jest.fn() });
  });

  it("loads, reads, updates, refreshes, and handles platform setting errors", async () => {
    const { usePlatformSettings } = await import("@/hooks/usePlatformSettings");
    rpc.mockResolvedValueOnce({
      data: [
        { setting_key: "commission_rate", setting_value: "0.15" },
        { setting_key: "support_email", setting_value: "support@example.com" },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePlatformSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings).toEqual({
      commission_rate: "0.15",
      support_email: "support@example.com",
    });
    expect(result.current.getSetting("commission_rate", "0.10")).toBe("0.15");
    expect(result.current.getSetting("missing", 25)).toBe(25);

    rpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: [], error: null });
    await expect(result.current.updateSetting("commission_rate", 0.2)).resolves.toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("update_platform_setting", { p_key: "commission_rate", p_value: "0.2" });

    rpc.mockResolvedValueOnce({ data: null, error: new Error("update failed") });
    const failed = await result.current.updateSetting("commission_rate", 0.3);
    expect(failed.success).toBe(false);
    expect(failed.error).toBeInstanceOf(Error);

    rpc.mockResolvedValueOnce({ data: null, error: new Error("load failed") });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("fetches and writes admin activity logs for regular and super admins", async () => {
    const { useAdminActivityLog } = await import("@/hooks/useAdminActivityLog");
    const rows = [{ id: "log-1", admin_id: "admin-1", action: "login", details: {}, created_at: "2026-05-12" }];
    query.eq.mockResolvedValueOnce({ data: rows, error: null });

    const { result } = renderHook(() => useAdminActivityLog());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toEqual(rows);
    expect(query.eq).toHaveBeenCalledWith("admin_id", "admin-1");

    rpc.mockResolvedValueOnce({ error: null });
    query.eq.mockResolvedValueOnce({ data: rows, error: null });
    await expect(result.current.logActivity("user_deleted", "user", "user-1", { reason: "test" })).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("log_admin_activity", {
      p_admin_id: "admin-1",
      p_action: "user_deleted",
      p_resource_type: "user",
      p_resource_id: "user-1",
      p_details: { reason: "test" },
    });

    useIsAdmin.mockReturnValue({ isAdmin: true, isSuperAdmin: true });
    query.limit.mockResolvedValueOnce({ data: rows, error: null });
    const superAdmin = renderHook(() => useAdminActivityLog());
    await waitFor(() => expect(superAdmin.result.current.isLoading).toBe(false));
    expect(query.eq).toHaveBeenCalledTimes(2);

    query.eq.mockResolvedValueOnce({ data: rows, error: null });
    await act(async () => {
      await superAdmin.result.current.refetch("admin-2");
    });
    expect(query.eq).toHaveBeenCalledWith("admin_id", "admin-2");
  });

  it("short-circuits admin hooks when unauthorized and handles errors", async () => {
    const { useAdminActivityLog } = await import("@/hooks/useAdminActivityLog");

    useAuth.mockReturnValue({ user: null });
    useIsAdmin.mockReturnValue({ isAdmin: false, isSuperAdmin: false });

    const { result } = renderHook(() => useAdminActivityLog());

    await expect(result.current.logActivity("login")).resolves.toBe(false);
    expect(from).not.toHaveBeenCalledWith("admin_activity_logs");

    useAuth.mockReturnValue({ user: { id: "admin-1" } });
    useIsAdmin.mockReturnValue({ isAdmin: true, isSuperAdmin: false });
    query.eq.mockResolvedValueOnce({ data: null, error: new Error("fetch failed") });
    const failingFetch = renderHook(() => useAdminActivityLog());
    await waitFor(() => expect(failingFetch.result.current.isLoading).toBe(false));
    expect(failingFetch.result.current.logs).toEqual([]);

    rpc.mockRejectedValueOnce(new Error("write failed"));
    await expect(failingFetch.result.current.logActivity("login")).resolves.toBe(false);
  });

  it("handles hardware back navigation on native platforms", async () => {
    const { useHardwareBackButton } = await import("@/hooks/useHardwareBackButton");
    const navigate = jest.fn();
    const remove = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useLocation.mockReturnValue({ pathname: "/rental-details/booking-1" });
    addListener.mockResolvedValueOnce({ remove });

    const { unmount } = renderHook(() => useHardwareBackButton());

    await waitFor(() => expect(addListener).toHaveBeenCalledWith("backButton", expect.any(Function)));
    const handler = addListener.mock.calls[0][1];

    act(() => {
      handler({ canGoBack: true });
    });
    expect(navigate).toHaveBeenCalledWith(-1);

    useLocation.mockReturnValue({ pathname: "/bookings" });
    renderHook(() => useHardwareBackButton());
    await waitFor(() => expect(addListener).toHaveBeenCalledTimes(2));
    act(() => {
      addListener.mock.calls[1][1]({ canGoBack: false });
    });
    expect(exitApp).toHaveBeenCalled();

    unmount();
    await waitFor(() => expect(remove).toHaveBeenCalled());
  });

  it("respects disabled, web platform, and custom hardware back handlers", async () => {
    const { useHardwareBackButton } = await import("@/hooks/useHardwareBackButton");
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    renderHook(() => useHardwareBackButton(undefined, { enabled: false }));
    expect(addListener).not.toHaveBeenCalled();

    isNativePlatform.mockReturnValue(false);
    renderHook(() => useHardwareBackButton());
    expect(addListener).not.toHaveBeenCalled();

    isNativePlatform.mockReturnValue(true);
    renderHook(() => useHardwareBackButton(() => true));
    await waitFor(() => expect(addListener).toHaveBeenCalledTimes(1));
    act(() => {
      addListener.mock.calls[0][1]({ canGoBack: true });
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });
});

export {};

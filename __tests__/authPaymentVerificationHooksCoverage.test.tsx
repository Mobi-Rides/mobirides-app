import { act, renderHook, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockUseIsAdmin = jest.fn();
const mockToast = jest.fn();
const mockLoadVerificationData = jest.fn();
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
  },
  functions: {
    invoke: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: () => mockUseIsAdmin(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock("@/services/verificationService", () => ({
  VerificationService: {
    loadVerificationData: (...args: unknown[]) => mockLoadVerificationData(...args),
  },
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

const adminSessionFetchQuery = (rows: unknown[] = [], error: unknown = null) => {
  const order = jest.fn().mockResolvedValue({ data: rows, error });
  const eq = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, order };
};

const adminSessionInsertQuery = (row: unknown, error: unknown = null) => {
  const single = jest.fn().mockResolvedValue({ data: row, error });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  return { insert, select, single };
};

const adminSessionUpdateQuery = (error: unknown = null) => {
  const secondEq = jest.fn().mockResolvedValue({ error });
  const firstEq = jest.fn().mockReturnValue({ eq: secondEq });
  const update = jest.fn().mockReturnValue({ eq: firstEq });
  return { update, firstEq, secondEq };
};

describe("auth, payment, and verification hook coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    mockSupabase.functions.invoke.mockResolvedValue({ data: {}, error: null });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads, creates, deactivates, and cleans up admin sessions", async () => {
    const { useAdminSession } = await import("@/hooks/useAdminSession");
    const existingSession = {
      id: "session-1",
      session_token: "token-1",
      created_at: "2026-05-12T10:00:00Z",
      expires_at: "2026-05-12T11:00:00Z",
      last_activity: "2026-05-12T10:30:00Z",
      is_active: true,
      admin_id: "user-1",
      ip_address: null,
      user_agent: "Jest",
    };
    const createdSession = { ...existingSession, id: "session-2", session_token: "token-2" };
    const firstFetch = adminSessionFetchQuery([existingSession]);
    const insert = adminSessionInsertQuery(createdSession);
    const secondFetch = adminSessionFetchQuery([createdSession]);
    const update = adminSessionUpdateQuery();
    const thirdFetch = adminSessionFetchQuery([]);
    const fourthFetch = adminSessionFetchQuery([]);

    mockSupabase.from
      .mockReturnValueOnce(firstFetch)
      .mockReturnValueOnce(insert)
      .mockReturnValueOnce(secondFetch)
      .mockReturnValueOnce(update)
      .mockReturnValueOnce(thirdFetch)
      .mockReturnValueOnce(fourthFetch);

    const { result } = renderHook(() => useAdminSession());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toEqual([existingSession]);
    expect(firstFetch.eq).toHaveBeenCalledWith("admin_id", "user-1");
    expect(firstFetch.order).toHaveBeenCalledWith("created_at", { ascending: false });

    await expect(result.current.createSession()).resolves.toEqual(createdSession);
    expect(insert.insert).toHaveBeenCalledWith({
      admin_id: "user-1",
      session_token: expect.any(String),
    });
    expect(mockSupabase.rpc).toHaveBeenCalledWith("log_admin_activity", {
      p_admin_id: "user-1",
      p_action: "session_created",
      p_resource_type: "admin_session",
      p_resource_id: "session-2",
    });

    await expect(result.current.deactivateSession("session-2")).resolves.toBe(true);
    expect(update.update).toHaveBeenCalledWith({ is_active: false });
    expect(update.firstEq).toHaveBeenCalledWith("id", "session-2");
    expect(update.secondEq).toHaveBeenCalledWith("admin_id", "user-1");

    await expect(result.current.cleanupExpiredSessions()).resolves.toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("cleanup_expired_admin_sessions");
  });

  it("short-circuits and reports admin session failures", async () => {
    const { useAdminSession } = await import("@/hooks/useAdminSession");
    mockUseAuth.mockReturnValue({ user: null });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });

    const unauthorized = renderHook(() => useAdminSession());
    await expect(unauthorized.result.current.createSession()).resolves.toBeNull();
    await expect(unauthorized.result.current.deactivateSession("session-1")).resolves.toBe(false);
    await expect(unauthorized.result.current.cleanupExpiredSessions()).resolves.toBe(false);

    mockUseAuth.mockReturnValue({ user: { id: "admin-1" } });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true });
    mockSupabase.from.mockReturnValueOnce(adminSessionFetchQuery([], new Error("fetch failed")));
    const failing = renderHook(() => useAdminSession());
    await waitFor(() => expect(failing.result.current.isLoading).toBe(false));
    expect(failing.result.current.sessions).toEqual([]);

    mockSupabase.from.mockReturnValueOnce(adminSessionInsertQuery(null, new Error("insert failed")));
    await expect(failing.result.current.createSession()).resolves.toBeNull();

    mockSupabase.from.mockReturnValueOnce(adminSessionUpdateQuery(new Error("update failed")));
    await expect(failing.result.current.deactivateSession("session-3")).resolves.toBe(false);

    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: new Error("cleanup failed") });
    await expect(failing.result.current.cleanupExpiredSessions()).resolves.toBe(false);
  });

  it("initiates booking payments and surfaces provider failures", async () => {
    const { useBookingPayment } = await import("@/hooks/useBookingPayment");
    const onError = jest.fn();
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { paymentUrl: `${window.location.origin}/payment/return?booking=booking-1` },
      error: null,
    });

    const { result } = renderHook(() => useBookingPayment({ onError }));

    await act(async () => {
      await result.current.initiatePayment({
        booking_id: "booking-1",
        payment_method: "card",
        amount: 250,
      } as never);
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("initiate-payment", {
      body: {
        booking_id: "booking-1",
        payment_method: "card",
        success_url: `${window.location.origin}/payment/return`,
        cancel_url: `${window.location.origin}/rental-details/booking-1`,
      },
    });
    expect(result.current.processingStep).toBe("confirming");
    expect(onError).not.toHaveBeenCalled();

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: "provider unavailable" },
    });
    await act(async () => {
      await result.current.initiatePayment({
        booking_id: "booking-2",
        payment_method: "card",
        amount: 125,
      } as never);
    });

    expect(result.current.processingStep).toBe("error");
    expect(result.current.error).toBe("provider unavailable");
    expect(mockToast).toHaveBeenCalledWith({
      title: "Payment Failed",
      description: "provider unavailable",
      variant: "destructive",
    });
    expect(onError).toHaveBeenCalledWith("provider unavailable");
  });

  it("checks verification status, refetches on events, and handles load failures", async () => {
    const { VerificationStatus } = await import("@/types/verification");
    const { triggerVerificationCompletionEvent, useVerificationStatus } = await import("@/hooks/useVerificationStatus");
    const completed = {
      user_id: "user-1",
      overall_status: VerificationStatus.COMPLETED,
      documents: [],
      submitted_at: "2026-05-12T10:00:00Z",
    };

    mockLoadVerificationData.mockResolvedValueOnce(completed).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useVerificationStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.verificationData).toEqual(completed);
    expect(result.current.isVerified).toBe(true);

    act(() => {
      triggerVerificationCompletionEvent();
    });

    await waitFor(() => expect(result.current.verificationData).toBeNull());
    expect(result.current.isVerified).toBe(false);

    mockLoadVerificationData.mockRejectedValueOnce(new Error("load failed"));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.verificationData).toBeNull();
    expect(result.current.isVerified).toBe(false);
  });
});

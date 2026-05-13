import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

const analyticsService = {
  getAnalytics: jest.fn(),
  getSecurityEvents: jest.fn(),
  getUserRegistrationStats: jest.fn(),
  getBookingGrowthStats: jest.fn(),
  getUserMetrics: jest.fn(),
  getSystemMetrics: jest.fn(),
  subscribeToAnalytics: jest.fn(),
  exportAnalytics: jest.fn(),
  getDashboardSummary: jest.fn(),
};
const useSuperAdminRoles = jest.fn();
const verificationService = {
  initializeVerification: jest.fn(),
  loadVerificationData: jest.fn(),
  refreshFromProfile: jest.fn(),
  updatePersonalInfo: jest.fn(),
  completeDocumentUpload: jest.fn(),
  updatePhoneVerification: jest.fn(),
  submitForReview: jest.fn(),
  navigateToStep: jest.fn(),
};

jest.mock("@/services/analyticsService", () => ({
  analyticsService,
}));

jest.mock("@/hooks/useSuperAdminRoles", () => ({
  useSuperAdminRoles: () => useSuperAdminRoles(),
}));

jest.mock("@/services/verificationService", () => ({
  VerificationService: verificationService,
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const baseVerificationData = {
  id: "verification-1",
  user_id: "user-1",
  current_step: "document_upload",
  overall_status: "in_progress",
  started_at: "2026-05-13T08:00:00Z",
  last_updated_at: "2026-05-13T08:00:00Z",
  personal_info_completed: true,
  documents_completed: false,
  selfie_completed: false,
  phone_verified: false,
  address_confirmed: false,
  personal_info: {},
};

describe("website feature coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSuperAdminRoles.mockReturnValue({
      users: [{ id: "admin-1", email: "admin@example.com" }],
    });
    analyticsService.getSecurityEvents.mockResolvedValue([
      {
        id: "event-1",
        event_type: "login",
        severity: "high",
        actor_id: "admin-1",
        target_id: null,
        created_at: "2026-05-13T08:00:00Z",
        action_details: {},
        resource_type: "session",
      },
      {
        id: "event-2",
        event_type: "booking_update",
        severity: "low",
        actor_id: "admin-2",
        target_id: "booking-1",
        created_at: "2026-05-13T09:00:00Z",
        action_details: {},
        resource_type: "booking",
      },
    ]);
    analyticsService.getAnalytics.mockResolvedValue([
      {
        date: "2026-05-13",
        event_type: "login",
        severity: "high",
        event_count: 2,
        unique_actors: 1,
        unique_targets: 1,
      },
      {
        date: "2026-05-13",
        event_type: "booking_update",
        severity: "low",
        event_count: 3,
        unique_actors: 2,
        unique_targets: 2,
      },
    ]);
    analyticsService.getUserRegistrationStats.mockResolvedValue([{ name: "May 13", value: 3 }]);
    analyticsService.getBookingGrowthStats.mockResolvedValue([{ name: "May 13", value: 2 }]);
    analyticsService.getUserMetrics.mockResolvedValue({
      total_users: 10,
      active_users: 7,
      active_today: 2,
      new_users: 3,
      new_users_today: 1,
      suspended_users: 0,
      role_distribution: { renter: 8, host: 2 },
      role_users: {},
      user_profiles: [],
    });
    analyticsService.getSystemMetrics.mockResolvedValue({
      total_bookings: 5,
      completed_bookings: 3,
      cancelled_bookings: 1,
      pending_bookings: 1,
      revenue: 400,
      platform_commission: 40,
      average_booking_value: 80,
      booking_stats: {},
    });
    analyticsService.subscribeToAnalytics.mockReturnValue({
      subscription: { unsubscribe: jest.fn() },
      unsubscribe: jest.fn(),
    });
    analyticsService.exportAnalytics.mockResolvedValue({ ok: true });
    analyticsService.getDashboardSummary.mockResolvedValue({ users: 10 });
    verificationService.initializeVerification.mockResolvedValue(baseVerificationData);
    verificationService.loadVerificationData.mockResolvedValue(baseVerificationData);
    verificationService.refreshFromProfile.mockResolvedValue(true);
    verificationService.updatePersonalInfo.mockResolvedValue(true);
    verificationService.completeDocumentUpload.mockResolvedValue(true);
    verificationService.updatePhoneVerification.mockResolvedValue(true);
    verificationService.submitForReview.mockResolvedValue(true);
    verificationService.navigateToStep.mockResolvedValue(true);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("drives optimized feature data through filtering, sorting, pagination, lazy loading, and virtualization", async () => {
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 4 })
      .mockResolvedValueOnce({ data: [{ id: 4 }, { id: 5 }], total: 6 })
      .mockResolvedValueOnce({ data: [{ id: 5 }, { id: 6 }], total: 6 })
      .mockResolvedValueOnce({ data: [{ id: 7 }], total: 7 });

    const { result } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: true,
        enableDebouncing: false,
        enableMemoization: true,
        enableLazyLoading: true,
        debounceDelay: 0,
        maxItemsPerPage: 2,
        maxVisibleItems: 2,
        enableCache: false,
        cacheTimeout: 30,
      }),
    );

    await act(async () => {
      await result.current.fetchData({ status: "active" });
    });

    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.pagination).toMatchObject({ page: 1, total: 4, hasMore: true });
    expect(fetchData).toHaveBeenCalledWith({
      filters: { status: "active" },
      sort: null,
      page: 1,
      pageSize: 2,
    });

    await act(async () => {
      result.current.handleSort("created_at", "desc");
    });
    await waitFor(() => expect(result.current.sort).toEqual({ field: "created_at", direction: "desc" }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data).toEqual([{ id: 4 }, { id: 5 }, { id: 5 }, { id: 6 }]);
    expect(result.current.pagination.page).toBe(2);

    act(() => {
      result.current.setVirtualization({
        enabled: true,
        itemHeight: 20,
        containerHeight: 40,
        overscan: 1,
      });
    });

    expect(result.current.getVirtualizedItems(20)).toEqual({ startIndex: 0, endIndex: 4 });

    await act(async () => {
      await result.current.fetchData({ status: "active" }, { field: "created_at", direction: "desc" }, 1);
    });
    expect(fetchData).toHaveBeenCalledTimes(4);
  });

  it("handles optimized feature data cache hits, invalid page guards, and request failures", async () => {
    jest.useFakeTimers();
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "cached" }], total: 1 })
      .mockRejectedValueOnce(new Error("feature data unavailable"));

    const { result } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: false,
        enableDebouncing: true,
        enableMemoization: false,
        enableLazyLoading: false,
        debounceDelay: 25,
        maxItemsPerPage: 1,
        maxVisibleItems: 10,
        enableCache: true,
        cacheTimeout: 30,
      }),
    );

    await act(async () => {
      result.current.fetchData({ feature: "analytics" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(result.current.data).toEqual([{ id: "cached" }]));
    expect(result.current.getCacheSize()).toBe(1);

    await act(async () => {
      result.current.fetchData({ feature: "analytics" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.goToPage(99);
      result.current.previousPage();
    });
    expect(result.current.pagination.page).toBe(1);

    await act(async () => {
      result.current.clearCache();
      result.current.fetchData({ feature: "broken" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(result.current.error).toBe("feature data unavailable"));
  });

  it("exercises optimized feature data memoization, paging controls, cleanup, and lazy-load failures", async () => {
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "first" }, { id: "second" }], total: 4 })
      .mockResolvedValueOnce({ data: [{ id: "page-2" }], total: 4 })
      .mockRejectedValueOnce(new Error("load more failed"));

    const { result, unmount } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: false,
        enableDebouncing: false,
        enableMemoization: true,
        enableLazyLoading: true,
        debounceDelay: 0,
        maxItemsPerPage: 2,
        maxVisibleItems: 10,
        enableCache: true,
        cacheTimeout: 30,
      }),
    );

    await act(async () => {
      await result.current.fetchData({ role: "host" });
    });
    expect(fetchData).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.nextPage();
    });
    await waitFor(() => expect(result.current.pagination.page).toBe(2));
    expect(fetchData).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.changePageSize(5);
    });
    expect(result.current.pagination.pageSize).toBe(5);

    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.error).toBe("load more failed"));

    act(() => {
      result.current.clearMemoization();
      result.current.cleanup();
    });
    expect(result.current.getMemoizationSize()).toBe(0);
    expect(result.current.getCacheSize()).toBe(0);
    expect(result.current.getVirtualizedItems(100)).toEqual({ startIndex: 0, endIndex: result.current.data.length });

    unmount();
  });

  it("memoizes debounced feature data and reuses it before calling the backend again", async () => {
    jest.useFakeTimers();
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest.fn().mockResolvedValue({ data: [{ id: "memoized" }], total: 1 });

    const { result } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: false,
        enableDebouncing: true,
        enableMemoization: true,
        enableLazyLoading: true,
        debounceDelay: 25,
        maxItemsPerPage: 1,
        maxVisibleItems: 10,
        enableCache: false,
        cacheTimeout: 30,
      }),
    );

    await act(async () => {
      result.current.fetchData({ role: "renter" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(result.current.getMemoizationSize()).toBe(1));

    await act(async () => {
      await result.current.fetchData({ role: "renter" });
    });
    expect(result.current.data).toEqual([{ id: "memoized" }]);
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it("expires cached optimized data, filters without backend messages, and trims debounced oversized responses", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-13T10:00:00Z"));
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 3 })
      .mockRejectedValueOnce({});

    const { result } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: false,
        enableDebouncing: true,
        enableMemoization: false,
        enableLazyLoading: true,
        debounceDelay: 25,
        maxItemsPerPage: 2,
        maxVisibleItems: 2,
        enableCache: true,
        cacheTimeout: 0.5,
      }),
    );

    await act(async () => {
      result.current.fetchData({ query: "oversized" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]));
    expect(result.current.getCacheSize()).toBe(1);

    await act(async () => {
      jest.setSystemTime(new Date("2026-05-13T10:02:00Z"));
      jest.advanceTimersByTime(60000);
    });
    expect(result.current.getCacheSize()).toBe(0);

    await act(async () => {
      result.current.handleFilterChange({ query: "broken" });
      jest.advanceTimersByTime(25);
    });
    await waitFor(() => expect(result.current.error).toBe("Failed to fetch data"));
  });

  it("reports lazy-load failures without backend messages", async () => {
    const { usePerformanceOptimization } = await import("@/hooks/usePerformanceOptimization");
    const fetchData = jest.fn().mockRejectedValue({});

    const { result } = renderHook(() =>
      usePerformanceOptimization(fetchData, {
        enablePagination: true,
        enableVirtualization: false,
        enableDebouncing: false,
        enableMemoization: false,
        enableLazyLoading: true,
        debounceDelay: 0,
        maxItemsPerPage: 2,
        maxVisibleItems: 10,
        enableCache: false,
        cacheTimeout: 30,
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBe("Failed to load more data");
  });

  it("loads super admin analytics, summarizes severity, exports data, and refreshes from realtime", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    const createObjectURL = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:analytics");
    const revokeObjectURL = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    const { useSuperAdminAnalytics } = await import("@/hooks/useSuperAdminAnalytics");
    const { result, unmount } = renderHook(() => useSuperAdminAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(analyticsService.subscribeToAnalytics).toHaveBeenCalledTimes(1);
    expect(result.current.events).toHaveLength(2);
    expect(result.current.securityMetrics).toMatchObject({
      total_events: 2,
      high_severity_events: 1,
      low_severity_events: 1,
    });
    expect(result.current.userMetrics).toMatchObject({
      total_users: 10,
      admin_users: 1,
    });
    expect(result.current.getSeverityDistribution()).toEqual([
      { name: "Critical", value: 0 },
      { name: "High", value: 1 },
      { name: "Medium", value: 0 },
      { name: "Low", value: 1 },
    ]);

    await expect(result.current.exportAnalytics("json")).resolves.toBe(true);
    expect(analyticsService.exportAnalytics).toHaveBeenCalledWith(expect.objectContaining({
      format: "json",
      includeEvents: true,
      includeMetrics: true,
      includeUsers: true,
    }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:analytics");

    await expect(result.current.getDashboardSummary()).resolves.toEqual({ users: 10 });
    expect(result.current.getTimeSeriesData()).toEqual([
      { date: "2026-05-13", value: 2, category: "login" },
      { date: "2026-05-13", value: 3, category: "booking_update" },
    ]);
    expect(result.current.getEventTypeDistribution()).toEqual([
      { name: "login", value: 2 },
      { name: "booking_update", value: 3 },
    ]);
    expect(result.current.getUserGrowthData()).toEqual([]);
    act(() => {
      result.current.refreshData();
    });

    const realtimeHandler = analyticsService.subscribeToAnalytics.mock.calls[0][0];
    act(() => {
      realtimeHandler({ eventType: "INSERT" });
    });
    await waitFor(() => expect(analyticsService.getSecurityEvents).toHaveBeenCalledTimes(3));
    expect(analyticsService.subscribeToAnalytics).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("surfaces analytics load, export, and dashboard summary failures without crashing", async () => {
    analyticsService.getSecurityEvents.mockRejectedValueOnce(new Error("analytics unavailable"));
    analyticsService.exportAnalytics.mockRejectedValueOnce(new Error("export unavailable"));
    analyticsService.getDashboardSummary.mockRejectedValueOnce(new Error("summary unavailable"));

    const { useSuperAdminAnalytics } = await import("@/hooks/useSuperAdminAnalytics");
    const { result } = renderHook(() => useSuperAdminAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(console.error).toHaveBeenCalledWith("Analytics fetch error:", expect.any(Error));
    expect(result.current.getSeverityDistribution()).toEqual([]);
    await expect(result.current.exportAnalytics("csv")).resolves.toBe(false);
    await expect(result.current.getDashboardSummary()).resolves.toBeNull();
  });

  it("initializes verification, gates steps, updates flow actions, and resets state", async () => {
    const { VerificationProvider } = await import("@/contexts/VerificationContext");
    const { VerificationStep } = await import("@/types/verification");
    const { useVerification } = await import("@/hooks/useVerification");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VerificationProvider>{children}</VerificationProvider>
    );

    const { result } = renderHook(() => useVerification(), { wrapper });

    expect(result.current.canNavigateToStep(VerificationStep.PERSONAL_INFO)).toBe(false);
    expect(result.current.getStepProgress()).toEqual({ completed: 0, total: 3, percentage: 0 });

    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });

    expect(verificationService.initializeVerification).toHaveBeenCalledWith("user-1", "renter");
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.verificationData).toMatchObject(baseVerificationData);
    expect(result.current.canNavigateToStep(VerificationStep.PERSONAL_INFO)).toBe(true);
    expect(result.current.canNavigateToStep(VerificationStep.DOCUMENT_UPLOAD)).toBe(true);
    expect(result.current.canNavigateToStep(VerificationStep.REVIEW_SUBMIT)).toBe(false);
    expect(result.current.getStepProgress()).toEqual({ completed: 2, total: 3, percentage: 67 });

    await act(async () => {
      await result.current.updatePersonalInfo({ fullName: "Feature Tester" });
      await result.current.completeDocumentUpload("user-1");
      await result.current.updatePhoneVerification({ isVerified: true });
      await result.current.submitForReview();
      await result.current.navigateToStep(VerificationStep.REVIEW_SUBMIT);
      await result.current.refreshFromProfile();
    });

    expect(verificationService.updatePersonalInfo).toHaveBeenCalledWith("user-1", { fullName: "Feature Tester" });
    expect(verificationService.completeDocumentUpload).toHaveBeenCalledWith("user-1");
    expect(verificationService.updatePhoneVerification).toHaveBeenCalledWith("user-1", { isVerified: true });
    expect(verificationService.submitForReview).toHaveBeenCalledWith("user-1");
    expect(verificationService.navigateToStep).toHaveBeenCalledWith("user-1", VerificationStep.REVIEW_SUBMIT);
    expect(verificationService.refreshFromProfile).toHaveBeenCalledWith("user-1");
    expect(verificationService.loadVerificationData).toHaveBeenCalled();

    act(() => {
      result.current.resetVerification();
    });

    expect(result.current.verificationData).toBeNull();
    expect(result.current.isInitialized).toBe(false);
  });

  it("covers verification failure paths and legacy progress fallbacks users can hit", async () => {
    const { VerificationProvider } = await import("@/contexts/VerificationContext");
    const { VerificationStep } = await import("@/types/verification");
    const { useVerification } = await import("@/hooks/useVerification");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VerificationProvider>{children}</VerificationProvider>
    );

    const { result } = renderHook(() => useVerification(), { wrapper });

    await expect(result.current.updatePersonalInfo({ fullName: "Missing User" })).rejects.toThrow("No verification data");
    await expect(result.current.updatePhoneVerification({ isVerified: true })).rejects.toThrow("No verification data");
    await expect(result.current.submitForReview()).rejects.toThrow("No verification data");
    await expect(result.current.navigateToStep(VerificationStep.REVIEW_SUBMIT)).rejects.toThrow("No verification data");

    verificationService.initializeVerification.mockRejectedValueOnce(new Error("identity service down"));
    await act(async () => {
      await result.current.initializeVerification("user-1", "host");
    });
    expect(result.current.error).toBe("identity service down");

    verificationService.initializeVerification.mockResolvedValueOnce({
      ...baseVerificationData,
      current_step: "unknown_step",
      personal_info_completed: true,
      documents_completed: true,
      selfie_completed: true,
      phone_verified: true,
    });
    await act(async () => {
      await result.current.initializeVerification("user-1", "host");
    });

    expect(result.current.canNavigateToStep(VerificationStep.SELFIE_VERIFICATION)).toBe(true);
    expect(result.current.canNavigateToStep(VerificationStep.PHONE_VERIFICATION)).toBe(true);
    expect(result.current.canNavigateToStep(VerificationStep.REVIEW_SUBMIT)).toBe(true);
    expect(result.current.getStepProgress()).toEqual({ completed: 3, total: 3, percentage: 100 });

    verificationService.loadVerificationData.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("refresh failed"));
    await act(async () => {
      await result.current.refreshData();
      await result.current.refreshData();
    });

    verificationService.completeDocumentUpload.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("upload failed"));
    await expect(result.current.completeDocumentUpload("user-1")).resolves.toBe(false);
    await expect(result.current.completeDocumentUpload("user-1")).resolves.toBe(false);

    verificationService.refreshFromProfile.mockRejectedValueOnce(new Error("profile sync failed"));
    await expect(result.current.refreshFromProfile()).rejects.toThrow("profile sync failed");

    verificationService.updatePersonalInfo.mockRejectedValueOnce(new Error("personal info failed"));
    await expect(result.current.updatePersonalInfo({ fullName: "Broken" })).rejects.toThrow("personal info failed");

    verificationService.updatePhoneVerification.mockRejectedValueOnce(new Error("phone failed"));
    await expect(result.current.updatePhoneVerification({ isVerified: false })).rejects.toThrow("phone failed");

    verificationService.submitForReview.mockRejectedValueOnce(new Error("submit failed"));
    await expect(result.current.submitForReview()).rejects.toThrow("submit failed");

    verificationService.navigateToStep.mockRejectedValueOnce(new Error("step failed"));
    await expect(result.current.navigateToStep(VerificationStep.DOCUMENT_UPLOAD)).rejects.toThrow("step failed");
  });

  it("covers verification initialization skips and progress branch variants", async () => {
    const { VerificationProvider } = await import("@/contexts/VerificationContext");
    const { VerificationStep } = await import("@/types/verification");
    const { useVerification } = await import("@/hooks/useVerification");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VerificationProvider>{children}</VerificationProvider>
    );

    const { result } = renderHook(() => useVerification(), { wrapper });

    verificationService.initializeVerification.mockResolvedValueOnce({
      ...baseVerificationData,
      current_step: VerificationStep.PERSONAL_INFO,
      personal_info_completed: false,
      documents_completed: false,
    });
    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });
    expect(result.current.getStepProgress()).toEqual({ completed: 1, total: 3, percentage: 33 });
    expect(result.current.canNavigateToStep("unknown_step" as never)).toBe(false);

    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });
    expect(console.log).toHaveBeenCalledWith("[VerificationContext] Skipping initialization - already loading or initialized");

    act(() => {
      result.current.resetVerification();
    });
    verificationService.initializeVerification.mockResolvedValueOnce({
      ...baseVerificationData,
      current_step: VerificationStep.COMPLETION,
      personal_info_completed: true,
      documents_completed: true,
    });
    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });
    expect(result.current.getStepProgress()).toEqual({ completed: 3, total: 3, percentage: 100 });

    act(() => {
      result.current.resetVerification();
    });
    verificationService.initializeVerification.mockResolvedValueOnce({
      ...baseVerificationData,
      current_step: "legacy_unknown",
      personal_info_completed: true,
      documents_completed: false,
    });
    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });
    expect(result.current.getStepProgress()).toEqual({ completed: 2, total: 3, percentage: 67 });

    act(() => {
      result.current.resetVerification();
    });
    verificationService.initializeVerification.mockResolvedValueOnce({
      ...baseVerificationData,
      current_step: "legacy_unknown",
      personal_info_completed: false,
      documents_completed: false,
    });
    await act(async () => {
      await result.current.initializeVerification("user-1", "renter");
    });
    expect(result.current.getStepProgress()).toEqual({ completed: 1, total: 3, percentage: 33 });
  });
});

export {};

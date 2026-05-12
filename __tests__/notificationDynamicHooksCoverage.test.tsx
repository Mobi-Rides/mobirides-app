import React, { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockUseAuth = jest.fn();
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  channel: jest.fn(),
  removeChannel: jest.fn(),
};

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

const wrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const pricingFetchQuery = (response: unknown) => {
  const order = jest.fn().mockResolvedValue(response);
  const select = jest.fn().mockReturnValue({ order });
  return { select, order };
};

const pricingUpdateQuery = (response: unknown) => {
  const eq = jest.fn().mockResolvedValue(response);
  const update = jest.fn().mockReturnValue({ eq });
  return { update, eq };
};

const pricingInsertQuery = (response: unknown) => ({
  insert: jest.fn().mockResolvedValue(response),
});

const pricingDeleteQuery = (response: unknown) => {
  const eq = jest.fn().mockResolvedValue(response);
  const deleteFn = jest.fn().mockReturnValue({ eq });
  return { delete: deleteFn, eq };
};

const notificationFetchQuery = (response: unknown) => {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockResolvedValue(response);

  return query;
};

const notificationUpdateQuery = (response: unknown, eqCount = 1) => {
  const query = {
    update: jest.fn(),
    eq: jest.fn(),
  };
  query.update.mockReturnValue(query);
  if (eqCount === 1) {
    query.eq.mockResolvedValue(response);
  } else {
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce(response);
  }
  return query;
};

const notificationDeleteQuery = (response: unknown) => {
  const eq = jest.fn().mockResolvedValue(response);
  const deleteFn = jest.fn().mockReturnValue({ eq });
  return { delete: deleteFn, eq };
};

const profileRoleQuery = (response: unknown) => {
  const single = jest.fn().mockResolvedValue(response);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, single };
};

describe("notification and dynamic pricing hook coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads, maps, updates, adds, deletes, and refreshes dynamic pricing rules", async () => {
    const { useDynamicPricingRules } = await import("@/hooks/useDynamicPricingRules");
    const dbRule = {
      id: "rule-1",
      rule_name: "Weekend",
      condition_type: "day_of_week",
      condition_value: { days: [5, 6] },
      is_active: true,
      multiplier: 1.2,
      priority: 10,
      created_at: "2026-05-12T10:00:00Z",
    };
    const firstFetch = pricingFetchQuery({ data: [dbRule], error: null });
    const update = pricingUpdateQuery({ error: null });
    const secondFetch = pricingFetchQuery({ data: [{ ...dbRule, multiplier: 1.3 }], error: null });
    const insert = pricingInsertQuery({ error: null });
    const thirdFetch = pricingFetchQuery({ data: [dbRule], error: null });
    const deleteQuery = pricingDeleteQuery({ error: null });
    const fourthFetch = pricingFetchQuery({ data: [], error: null });
    const fifthFetch = pricingFetchQuery({ data: [dbRule], error: null });

    mockSupabase.from
      .mockReturnValueOnce(firstFetch)
      .mockReturnValueOnce(update)
      .mockReturnValueOnce(secondFetch)
      .mockReturnValueOnce(insert)
      .mockReturnValueOnce(thirdFetch)
      .mockReturnValueOnce(deleteQuery)
      .mockReturnValueOnce(fourthFetch)
      .mockReturnValueOnce(fifthFetch);

    const { result } = renderHook(() => useDynamicPricingRules());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rules).toEqual([
      {
        id: "rule-1",
        name: "Weekend",
        type: "day_of_week",
        is_active: true,
        multiplier: 1.2,
        conditions: { days: [5, 6] },
        priority: 10,
        created_at: "2026-05-12T10:00:00Z",
        updated_at: "2026-05-12T10:00:00Z",
      },
    ]);
    expect(firstFetch.order).toHaveBeenCalledWith("priority", { ascending: false });

    await expect(result.current.updateRule("rule-1", {
      name: "Weekend updated",
      type: "seasonal" as never,
      conditions: { months: [12] } as never,
      is_active: false,
      multiplier: 1.3,
      priority: 12,
    })).resolves.toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({
      rule_name: "Weekend updated",
      condition_type: "seasonal",
      condition_value: { months: [12] },
      is_active: false,
      multiplier: 1.3,
      priority: 12,
    });
    expect(update.eq).toHaveBeenCalledWith("id", "rule-1");

    await expect(result.current.addRule({
      id: "rule-2",
      name: "Holiday",
      type: "seasonal" as never,
      conditions: { dates: ["2026-12-25"] } as never,
      is_active: true,
      multiplier: 1.5,
      priority: 20,
    })).resolves.toEqual({ success: true });
    expect(insert.insert).toHaveBeenCalledWith([{
      id: "rule-2",
      rule_name: "Holiday",
      condition_type: "seasonal",
      condition_value: { dates: ["2026-12-25"] },
      is_active: true,
      multiplier: 1.5,
      priority: 20,
    }]);

    await expect(result.current.deleteRule("rule-1")).resolves.toEqual({ success: true });
    expect(deleteQuery.eq).toHaveBeenCalledWith("id", "rule-1");

    await act(async () => {
      await result.current.refresh();
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("dynamic_pricing_rules");
  });

  it("returns dynamic pricing rule operation errors", async () => {
    const { useDynamicPricingRules } = await import("@/hooks/useDynamicPricingRules");
    const fetchError = new Error("fetch failed");
    mockSupabase.from
      .mockReturnValueOnce(pricingFetchQuery({ data: null, error: fetchError }))
      .mockReturnValueOnce(pricingUpdateQuery({ error: new Error("update failed") }))
      .mockReturnValueOnce(pricingInsertQuery({ error: new Error("insert failed") }))
      .mockReturnValueOnce(pricingDeleteQuery({ error: new Error("delete failed") }));

    const { result } = renderHook(() => useDynamicPricingRules());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(fetchError);

    await expect(result.current.updateRule("rule-1", { multiplier: 2 })).resolves.toMatchObject({ success: false });
    await expect(result.current.addRule({
      id: "rule-2",
      name: "Broken",
      type: "seasonal" as never,
      conditions: {} as never,
      is_active: true,
      multiplier: 1,
      priority: 1,
    })).resolves.toMatchObject({ success: false });
    await expect(result.current.deleteRule("rule-2")).resolves.toMatchObject({ success: false });
  });

  it("loads notifications, filters them, mutates read state, deletes, and cleans expired rows", async () => {
    const { useNotifications } = await import("@/hooks/useNotifications");
    const notifications = [
      { id: 1, is_read: false, role_target: "host_only", created_at: "2026-05-12T10:00:00Z" },
      { id: 2, is_read: true, role_target: "system_wide", created_at: "2026-05-12T11:00:00Z" },
      { id: 3, is_read: false, role_target: "renter_only", created_at: "2026-05-12T12:00:00Z" },
    ];
    const fetch = notificationFetchQuery({ data: notifications, error: null });
    const markOne = notificationUpdateQuery({ error: null });
    const markAll = notificationUpdateQuery({ error: null }, 2);
    const deleteQuery = notificationDeleteQuery({ error: null });
    const profile = profileRoleQuery({ data: { role: "host" }, error: null });
    mockSupabase.from
      .mockReturnValueOnce(fetch)
      .mockReturnValueOnce(markOne)
      .mockReturnValueOnce(notificationFetchQuery({ data: notifications, error: null }))
      .mockReturnValueOnce(markAll)
      .mockReturnValueOnce(notificationFetchQuery({ data: notifications, error: null }))
      .mockReturnValueOnce(deleteQuery)
      .mockReturnValueOnce(notificationFetchQuery({ data: notifications, error: null }))
      .mockReturnValueOnce(notificationFetchQuery({ data: notifications, error: null }))
      .mockReturnValueOnce(profile);

    const { result, unmount } = renderHook(() => useNotifications({
      roleFilter: ["host_only" as never],
    }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.unreadCount).toBe(2);
    expect(fetch.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(fetch.or).toHaveBeenCalledWith(expect.stringContaining("expires_at.is.null"));
    expect(fetch.in).toHaveBeenCalledWith("role_target", ["host_only"]);
    expect(fetch.order).toHaveBeenCalledWith("created_at", { ascending: false });

    expect(result.current.getNotificationsByRole("host_only" as never)).toEqual([notifications[0], notifications[1]]);

    await expect(result.current.markAsRead(1)).resolves.toEqual({ error: null });
    expect(markOne.update).toHaveBeenCalledWith({ is_read: true });
    expect(markOne.eq).toHaveBeenCalledWith("id", 1);

    await expect(result.current.markAllAsRead()).resolves.toEqual({ error: null });
    expect(markAll.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(markAll.eq).toHaveBeenCalledWith("is_read", false);

    await expect(result.current.deleteNotification(2)).resolves.toEqual({ error: null });
    expect(deleteQuery.eq).toHaveBeenCalledWith("id", 2);

    await expect(result.current.cleanupExpiredNotifications()).resolves.toEqual({ error: null });
    expect(mockSupabase.rpc).toHaveBeenCalledWith("cleanup_expired_notifications_enhanced");

    await expect(result.current.getUserRoleNotifications()).resolves.toEqual([notifications[0], notifications[1]]);
    expect(profile.eq).toHaveBeenCalledWith("id", "user-1");

    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("handles anonymous and error notification paths", async () => {
    const { useNotifications } = await import("@/hooks/useNotifications");
    mockUseAuth.mockReturnValue({ user: null });
    const anonymous = renderHook(() => useNotifications(), { wrapper: wrapper() });

    expect(anonymous.result.current.notifications).toEqual([]);
    await expect(anonymous.result.current.markAllAsRead()).resolves.toEqual({ error: expect.any(Error) });
    await expect(anonymous.result.current.cleanupExpiredNotifications()).resolves.toEqual({ error: expect.any(Error) });
    await expect(anonymous.result.current.getUserRoleNotifications()).resolves.toEqual([]);

    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    const fetch = notificationFetchQuery({ data: [{ id: 1, is_read: false, role_target: "host_only" }], error: null });
    const profile = profileRoleQuery({ data: null, error: new Error("role failed") });
    mockSupabase.from.mockReturnValueOnce(fetch).mockReturnValueOnce(profile);

    const roleFailure = renderHook(() => useNotifications({ includeExpired: true }), { wrapper: wrapper() });
    await waitFor(() => expect(roleFailure.result.current.isLoading).toBe(false));
    await waitFor(() => expect(roleFailure.result.current.notifications).toHaveLength(1));
    expect(fetch.or).not.toHaveBeenCalled();
    await expect(roleFailure.result.current.getUserRoleNotifications()).resolves.toEqual(roleFailure.result.current.notifications);

    mockSupabase.rpc.mockRejectedValueOnce(new Error("cleanup threw"));
    await expect(roleFailure.result.current.cleanupExpiredNotifications()).resolves.toEqual({ error: expect.any(Error) });
  });
});

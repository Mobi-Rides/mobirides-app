import { analyticsService, FullAnalyticsExport } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: jest.fn(),
    from: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const makeQuery = (result: unknown) => {
  const query: any = {
    eq: jest.fn(() => query),
    gte: jest.fn(() => query),
    in: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(result)),
    lte: jest.fn(() => query),
    not: jest.fn(() => query),
    order: jest.fn(() => query),
    select: jest.fn(() => query),
    then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),
  };
  return query;
};

describe("analyticsService coverage helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T08:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("converts a full analytics export into readable CSV sections", () => {
    const exportData: FullAnalyticsExport = {
      exported_at: "2026-05-12T08:00:00.000Z",
      format: "csv",
      version: "2.0",
      date_range: { start: "2026-05-01", end: "2026-05-12" },
      applied_filters: {
        severity_levels: ["critical", "high"] as any,
        event_types: ["admin_login"] as any,
        actor_ids: ["admin-1"],
        resource_types: ["booking"],
        search_term: "suspicious",
        status: "open",
        user_status: "active",
      },
      users: {
        total_users: 10,
        active_users: 7,
        active_today: 3,
        new_users: 2,
        new_users_today: 1,
        suspended_users: 1,
        role_distribution: { renter: 6, host: 4 },
        role_users: { renter: ["u1"], host: ["u2"] },
        user_profiles: [],
      },
      metrics: {
        system: {
          total_bookings: 5,
          completed_bookings: 3,
          cancelled_bookings: 1,
          pending_bookings: 1,
          revenue: 1200,
          platform_commission: 180,
          average_booking_value: 240,
          booking_stats: { completed: 3, cancelled: 1, pending: 1 },
        },
        security: {
          total_events: 4,
          critical_events: 1,
          high_severity_events: 1,
          medium_severity_events: 1,
          low_severity_events: 1,
          top_event_types: [{ type: "admin_login", count: 2 }],
          top_actors: [{ actor_id: "admin-1", count: 2 }],
          security_trends: [{ date: "2026-05-12", count: 2, severity: "critical" }],
        },
      },
      security_alerts: {
        total_alerts: 1,
        critical_alerts: 1,
        acknowledged_alerts: 0,
        unacknowledged_alerts: 1,
        alerts: [
          {
            id: "alert-1",
            title: "Risky login",
            description: "Admin login from new device",
            severity: "critical",
            category: "auth",
            timestamp: "2026-05-12T08:00:00.000Z",
            source: "audit",
            action_required: true,
            acknowledged: false,
          },
        ],
      },
    };

    const csv = analyticsService.convertToCSV(exportData);

    expect(csv).toContain("MobiRides Analytics Export");
    expect(csv).toContain("Applied Filters:");
    expect(csv).toContain("Role Distribution:");
    expect(csv).toContain("System Metrics:");
    expect(csv).toContain("Security Metrics:");
    expect(csv).toContain("Top Event Types:");
    expect(csv).toContain("Security Alerts Details:");
    expect(csv).toContain("admin_login,2");
    expect(csv).toContain("Risky login");
  });

  it("returns JSON export data assembled from selected analytics sections", async () => {
    jest.spyOn(analyticsService, "getSecurityEvents").mockResolvedValue([
      {
        id: "event-1",
        event_type: "admin_login" as any,
        severity: "low" as any,
        actor_id: "admin-1",
        target_id: null,
        created_at: "2026-05-12T08:00:00.000Z",
        action_details: {},
        resource_type: "auth",
      },
    ]);
    jest.spyOn(analyticsService, "getSecurityMetrics").mockResolvedValue({
      total_events: 1,
      critical_events: 0,
      high_severity_events: 0,
      medium_severity_events: 0,
      low_severity_events: 1,
      top_event_types: [{ type: "admin_login", count: 1 }],
      top_actors: [{ actor_id: "admin-1", count: 1 }],
      security_trends: [],
    });
    jest.spyOn(analyticsService, "getSystemMetrics").mockResolvedValue({
      total_bookings: 2,
      completed_bookings: 1,
      cancelled_bookings: 0,
      pending_bookings: 1,
      revenue: 500,
      platform_commission: 75,
      average_booking_value: 250,
      booking_stats: { completed: 1, pending: 1 },
    });
    jest.spyOn(analyticsService, "getUserMetrics").mockResolvedValue({
      total_users: 3,
      active_users: 2,
      active_today: 1,
      new_users: 1,
      new_users_today: 1,
      suspended_users: 0,
      role_distribution: { renter: 2, host: 1 },
      role_users: { renter: ["u1", "u2"], host: ["u3"] },
      user_profiles: [],
    });

    const result = await analyticsService.exportAnalytics({
      format: "json",
      includeEvents: true,
      includeMetrics: true,
      includeUsers: true,
      includeSecurityAlerts: true,
      dateRange: { start: "2026-05-01", end: "2026-05-12" },
    }) as FullAnalyticsExport;

    expect(result.version).toBe("2.0");
    expect(result.events).toHaveLength(1);
    expect(result.metrics?.system.revenue).toBe(500);
    expect(result.users?.role_distribution.host).toBe(1);
    expect(result.security_alerts?.total_alerts).toBe(0);
  });

  it("fetches analytics and security events with all supported filters", async () => {
    const analyticsQuery = makeQuery({ data: [{ date: "2026-05-12" }], error: null });
    const eventsQuery = makeQuery({ data: [{ id: "event-1" }], error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(analyticsQuery)
      .mockReturnValueOnce(eventsQuery);

    await expect(analyticsService.getAnalytics({
      startDate: "2026-05-01",
      endDate: "2026-05-12",
      eventTypes: ["admin_login"] as any,
      severityLevels: ["critical"] as any,
    })).resolves.toEqual([{ date: "2026-05-12" }]);

    await expect(analyticsService.getSecurityEvents({
      startDate: "2026-05-01",
      endDate: "2026-05-12",
      eventTypes: ["admin_login"] as any,
      severityLevels: ["critical"] as any,
      actorIds: ["admin-1"],
      resourceTypes: ["auth"],
    }, 25)).resolves.toEqual([{ id: "event-1" }]);

    expect(analyticsQuery.gte).toHaveBeenCalledWith("date", "2026-05-01");
    expect(analyticsQuery.lte).toHaveBeenCalledWith("date", "2026-05-12");
    expect(analyticsQuery.in).toHaveBeenCalledWith("event_type", ["admin_login"]);
    expect(analyticsQuery.in).toHaveBeenCalledWith("severity", ["critical"]);
    expect(eventsQuery.in).toHaveBeenCalledWith("actor_id", ["admin-1"]);
    expect(eventsQuery.in).toHaveBeenCalledWith("resource_type", ["auth"]);
    expect(eventsQuery.limit).toHaveBeenCalledWith(25);
  });

  it("aggregates user metrics from profile counts and role data", async () => {
    const roleData = [
      { id: "u1", role: "renter", created_at: "2026-05-12T06:00:00.000Z", last_login_attempt: "2026-05-12T07:00:00.000Z" },
      { id: "u2", role: "host", created_at: "2026-05-01T06:00:00.000Z", last_login_attempt: "2026-05-02T07:00:00.000Z" },
      { id: "u3", role: null, created_at: null, last_login_attempt: null },
    ];

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeQuery({ count: 3, error: null }))
      .mockReturnValueOnce(makeQuery({ count: 2, error: null }))
      .mockReturnValueOnce(makeQuery({ count: 1, error: null }))
      .mockReturnValueOnce(makeQuery({ count: 1, error: null }))
      .mockReturnValueOnce(makeQuery({ data: roleData, error: null }))
      .mockReturnValueOnce(makeQuery({ data: [{ id: "u1", full_name: "Renter One", created_at: "2026-05-12" }], error: null }));

    await expect(analyticsService.getUserMetrics({ start: "2026-05-01", end: "2026-05-12" })).resolves.toMatchObject({
      total_users: 3,
      active_users: 2,
      active_today: 1,
      new_users: 1,
      new_users_today: 1,
      suspended_users: 1,
      role_distribution: { renter: 2, host: 1 },
      role_users: { renter: ["u1", "u3"], host: ["u2"] },
    });
  });

  it("aggregates system metrics from bookings, payments, and wallet transactions", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeQuery({ count: 4, error: null }))
      .mockReturnValueOnce(makeQuery({
        data: [{ status: "completed" }, { status: "completed" }, { status: "cancelled" }, { status: "pending" }],
        error: null,
      }))
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValueOnce(makeQuery({
        data: [
          { amount: 400, host_earnings: 340, platform_commission: 60 },
          { amount: 300, host_earnings: 255, platform_commission: 45 },
        ],
        error: null,
      }))
      .mockReturnValueOnce(makeQuery({ data: [{ amount: 900, transaction_type: "rental_earnings" }], error: null }));

    await expect(analyticsService.getSystemMetrics({
      start: "2026-05-01",
      end: "2026-05-12",
    })).resolves.toEqual({
      total_bookings: 4,
      completed_bookings: 2,
      cancelled_bookings: 1,
      pending_bookings: 1,
      revenue: 900,
      platform_commission: 105,
      average_booking_value: 225,
      booking_stats: { completed: 2, cancelled: 1, pending: 1 },
    });
  });

  it("aggregates security metrics by severity, event type, actor, and day", async () => {
    (supabase.from as jest.Mock).mockReturnValue(makeQuery({
      data: [
        { event_type: "admin_login", severity: "critical", actor_id: "admin-1", created_at: "2026-05-11T08:00:00Z" },
        { event_type: "admin_login", severity: "high", actor_id: "admin-1", created_at: "2026-05-11T09:00:00Z" },
        { event_type: "profile_update", severity: "medium", actor_id: "user-1", created_at: "2026-05-12T08:00:00Z" },
        { event_type: "view", severity: "low", actor_id: null, created_at: "2026-05-12T10:00:00Z" },
      ],
      error: null,
    }));

    const result = await analyticsService.getSecurityMetrics({ start: "2026-05-01", end: "2026-05-12" });

    expect(result).toMatchObject({
      total_events: 4,
      critical_events: 1,
      high_severity_events: 1,
      medium_severity_events: 1,
      low_severity_events: 1,
      top_event_types: [
        { type: "admin_login", count: 2 },
        { type: "profile_update", count: 1 },
        { type: "view", count: 1 },
      ],
      top_actors: [
        { actor_id: "admin-1", count: 2 },
        { actor_id: "user-1", count: 1 },
      ],
    });
    expect(result.security_trends).toContainEqual({ date: "2026-05-11", severity: "critical", count: 1 });
    expect(result.security_trends).toContainEqual({ date: "2026-05-12", severity: "low", count: 1 });
  });

  it("exports selected analytics sections to CSV", async () => {
    jest.spyOn(analyticsService, "getSecurityEvents").mockResolvedValue([
      {
        id: "event-2",
        event_type: "admin_login" as any,
        severity: "critical" as any,
        actor_id: "admin-2",
        target_id: "target-1",
        created_at: "2026-05-12T08:00:00.000Z",
        action_details: {},
        resource_type: "auth",
      },
    ]);

    const csv = await analyticsService.exportAnalytics({
      format: "csv",
      includeEvents: true,
      includeMetrics: false,
      includeUsers: false,
    });

    expect(csv).toContain("Security Events:");
    expect(csv).toContain("event-2,admin_login,critical,admin-2,target-1");
  });

  it("subscribes and unsubscribes from audit log changes", () => {
    const subscription = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue("channel-1"),
    };
    (supabase.channel as jest.Mock).mockReturnValue(subscription);
    const callback = jest.fn();

    const result = analyticsService.subscribeToAnalytics(callback);
    result.unsubscribe();

    expect(supabase.channel).toHaveBeenCalledWith("analytics-updates");
    expect(subscription.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "audit_logs" },
      callback,
    );
    expect(supabase.removeChannel).toHaveBeenCalledWith("channel-1");
  });

  it("groups user registrations and booking growth by month", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeQuery({
        data: [
          { created_at: "2026-04-01T00:00:00Z" },
          { created_at: "2026-04-15T00:00:00Z" },
          { created_at: "2026-05-01T00:00:00Z" },
          { created_at: null },
        ],
        error: null,
      }))
      .mockReturnValueOnce(makeQuery({
        data: [
          { created_at: "2026-05-01T00:00:00Z" },
          { created_at: "2026-05-03T00:00:00Z" },
        ],
        error: null,
      }));

    await expect(analyticsService.getUserRegistrationStats()).resolves.toEqual([
      { name: "Apr 2026", value: 2 },
      { name: "May 2026", value: 1 },
    ]);
    await expect(analyticsService.getBookingGrowthStats()).resolves.toEqual([
      { name: "May 2026", value: 2 },
    ]);
  });
});

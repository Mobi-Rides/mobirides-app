const getSession = jest.fn();
const rpc = jest.fn();
const insert = jest.fn();
const from = jest.fn((_table: string) => ({ insert }));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
    },
    rpc: (name: string, params: unknown) => rpc(name, params),
    from: (table: string) => from(table),
  },
}));

describe("auditLogger coverage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    rpc.mockResolvedValue({ data: { success: true }, error: null });
    insert.mockResolvedValue({ data: null, error: null });
    from.mockClear();
    global.fetch = jest.fn();
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("parses common browsers, operating systems, and device types", async () => {
    const { parseUserAgent } = await import("@/utils/auditLogger");

    expect(parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Version/17.0 Safari/605.1.15")).toMatchObject({
      browser: "Safari",
      browserVersion: "17.0",
      os: "macOS",
      osVersion: "14.4",
      deviceType: "desktop",
    });
    expect(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) Mobile/15E148 Firefox/120.0")).toMatchObject({
      browser: "Firefox",
      os: "macOS",
      osVersion: "",
      deviceType: "mobile",
    });
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel Tablet) Edg/120.0")).toMatchObject({
      browser: "Edge",
      os: "Android",
      osVersion: "14",
      deviceType: "tablet",
    });
    expect(parseUserAgent("Opera/9.80 (X11; Linux x86_64) OPR/90.0")).toMatchObject({
      browser: "Opera",
      os: "Linux",
    });
  });

  it("fetches IP geolocation success, failed responses, API failures, and network errors", async () => {
    const { fetchIPGeolocation } = await import("@/utils/auditLogger");
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "success",
        country: "Botswana",
        countryCode: "BW",
        region: "SE",
        city: "Gaborone",
        timezone: "Africa/Gaborone",
        isp: "Example ISP",
        org: "Example Org",
        lat: -24.6,
        lon: 25.9,
      }),
    });

    await expect(fetchIPGeolocation("203.0.113.1")).resolves.toEqual({
      ip: "203.0.113.1",
      country: "Botswana",
      countryCode: "BW",
      region: "SE",
      city: "Gaborone",
      timezone: "Africa/Gaborone",
      isp: "Example ISP",
      org: "Example Org",
      lat: -24.6,
      lon: 25.9,
    });

    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(fetchIPGeolocation("203.0.113.2")).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "fail", message: "reserved range" }),
    });
    await expect(fetchIPGeolocation("203.0.113.3")).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchIPGeolocation("203.0.113.4")).resolves.toBeNull();
  });

  it("logs audit events through RPC and falls back to direct insert", async () => {
    const { logAuditEvent } = await import("@/utils/auditLogger");
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ip: "203.0.113.10" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "success", country: "Botswana" }) });

    await logAuditEvent({
      event_type: "admin_login",
      action_details: { reason: "dashboard access" },
      resource_type: "session",
      resource_id: "session-1",
    });

    expect(rpc).toHaveBeenCalledWith(
      "log_admin_activity",
      expect.objectContaining({
        p_admin_id: "admin-1",
        p_action: "admin_login",
        p_resource_type: "session",
        p_resource_id: "session-1",
        p_ip_address: "203.0.113.10",
      }),
    );

    rpc.mockRejectedValueOnce(new Error("rpc missing"));
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: "success", country: "Botswana" }) });
    await logAuditEvent({
      event_type: "verification_approved",
      actor_id: "admin-2",
      ip_address: "198.51.100.20",
      user_agent: "Mozilla/5.0 (Windows NT 6.1) Chrome/90.0",
      action_details: { target: "verification-1" },
    });

    expect(from).toHaveBeenCalledWith("admin_activity_logs");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-2",
        action: "verification_approved",
        ip_address: "198.51.100.20",
      }),
    );
  });
});

export {};

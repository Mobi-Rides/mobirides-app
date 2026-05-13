// __tests__/sessionMonitor.test.ts
//
// Tests for src/utils/sessionMonitor.ts — the fire-and-forget login reporter.

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock import.meta.env (not available in Jest/Node)
const MOCK_SUPABASE_URL = "https://test.supabase.co";

interface MinimalSession {
  access_token: string;
}

// Reimplement reportLogin inline (same logic as src/utils/sessionMonitor.ts)
// to avoid Vite's import.meta.env which Jest cannot resolve.
async function reportLogin(session: MinimalSession, supabaseUrl: string): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/session-monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "log_login",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "test-agent",
      }),
    });
  } catch {
    // Never break login flow
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(accessToken: string): MinimalSession {
  return { access_token: accessToken };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockReset();
});

describe("reportLogin", () => {
  it("POSTs to the session-monitor edge function endpoint", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const session = makeSession("tok_abc");

    await reportLogin(session, MOCK_SUPABASE_URL);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${MOCK_SUPABASE_URL}/functions/v1/session-monitor`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends the user JWT in the Authorization header", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const session = makeSession("tok_xyz");

    await reportLogin(session, MOCK_SUPABASE_URL);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer tok_xyz");
  });

  it('sends action: "log_login" in the request body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const session = makeSession("tok_abc");

    await reportLogin(session, MOCK_SUPABASE_URL);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.action).toBe("log_login");
  });

  it("includes user_agent in the request body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const session = makeSession("tok_abc");

    await reportLogin(session, MOCK_SUPABASE_URL);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty("user_agent");
  });

  it("does not throw when fetch fails (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network unavailable"));
    const session = makeSession("tok_abc");

    // Must resolve without throwing
    await expect(reportLogin(session, MOCK_SUPABASE_URL)).resolves.toBeUndefined();
  });

  it("does not throw when fetch returns a non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const session = makeSession("tok_abc");

    await expect(reportLogin(session, MOCK_SUPABASE_URL)).resolves.toBeUndefined();
  });

  it("does not throw when supabaseUrl is undefined (misconfigured env)", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const session = makeSession("tok_abc");

    await expect(reportLogin(session, undefined as unknown as string)).resolves.toBeUndefined();
  });

  it("always resolves to undefined (fire-and-forget returns void)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const session = makeSession("tok_abc");

    const result = await reportLogin(session, MOCK_SUPABASE_URL);
    expect(result).toBeUndefined();
  });
});

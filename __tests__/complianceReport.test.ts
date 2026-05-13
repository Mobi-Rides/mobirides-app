// __tests__/complianceReport.test.ts

// ── Pure helpers duplicated here for Jest testability ─────────────────────────
// These functions are identical to the ones in supabase/functions/compliance-report/index.ts
// Testing them here validates the logic without needing the Deno runtime.

function resolveReportMonth(monthParam?: string): string {
  if (monthParam) return monthParam;
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function canonicalizeReport(payload: object): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

function buildSummaryStats(records: Array<{ event_type: string; severity: string }>) {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const r of records) {
    byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
  }
  return { byType, bySeverity };
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("resolveReportMonth", () => {
  it("returns provided month when given", () => {
    expect(resolveReportMonth("2026-03")).toBe("2026-03");
  });

  it("defaults to previous month when no param given", () => {
    const result = resolveReportMonth();
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    expect(result).toBe(expected);
  });
});

describe("canonicalizeReport", () => {
  it("sorts keys alphabetically", () => {
    const result = canonicalizeReport({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it("produces identical output for same input regardless of insertion order", () => {
    const a = canonicalizeReport({ report_month: "2026-05", generated_at: "T", record_count: 1, records: [] });
    const b = canonicalizeReport({ records: [], generated_at: "T", record_count: 1, report_month: "2026-05" });
    expect(a).toBe(b);
  });

  it("contains no extra whitespace", () => {
    const result = canonicalizeReport({ a: 1, b: 2 });
    expect(result).not.toContain(" ");
  });
});

describe("buildSummaryStats", () => {
  const records = [
    { event_type: "user_deleted", severity: "high" },
    { event_type: "user_deleted", severity: "high" },
    { event_type: "vehicle_transferred", severity: "medium" },
    { event_type: "admin_login", severity: "low" },
  ];

  it("counts event types correctly", () => {
    const { byType } = buildSummaryStats(records);
    expect(byType.user_deleted).toBe(2);
    expect(byType.vehicle_transferred).toBe(1);
    expect(byType.admin_login).toBe(1);
  });

  it("counts severity correctly", () => {
    const { bySeverity } = buildSummaryStats(records);
    expect(bySeverity.high).toBe(2);
    expect(bySeverity.medium).toBe(1);
    expect(bySeverity.low).toBe(1);
  });

  it("returns empty objects for empty records", () => {
    const { byType, bySeverity } = buildSummaryStats([]);
    expect(byType).toEqual({});
    expect(bySeverity).toEqual({});
  });
});

describe("pemToDer", () => {
  it("strips PEM headers and decodes base64 to bytes", () => {
    // "hello" base64 = "aGVsbG8="
    const pem = `-----BEGIN PUBLIC KEY-----\naGVsbG8=\n-----END PUBLIC KEY-----`;
    const result = pemToDer(pem);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]); // "hello"
  });
});

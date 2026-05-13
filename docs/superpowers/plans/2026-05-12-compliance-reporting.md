# T4.3 Automated Compliance Reporting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate RSA-SHA256-signed monthly PDF audit reports of all SuperAdmin actions, store them in Supabase Storage, email them to SuperAdmins, and expose a dashboard for downloading and verifying past reports.

**Architecture:** A Deno Edge Function (`compliance-report`) runs on a monthly pg_cron schedule. It queries `audit_logs` for all admin actions, canonicalizes and RSA-signs the payload using `crypto.subtle`, renders a PDF with `pdf-lib`, uploads to Supabase Storage, and emails SuperAdmins via Resend. A React dashboard at `/admin/compliance` lists past reports and provides a signature verification UI.

**Tech Stack:** Deno (Edge Function), `pdf-lib` (npm), `crypto.subtle` (Deno built-in), Supabase Storage, Resend API, React + shadcn/ui, TanStack Query, PostgreSQL pg_cron + pg_net.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260512160000_compliance_reports.sql` | `compliance_reports` table, RLS, `get_audit_logs_for_month()` RPC, pg_cron schedule |
| Create | `supabase/functions/compliance-report/index.ts` | Full report pipeline + verify endpoint |
| Create | `src/pages/admin/AdminCompliance.tsx` | Page shell with AdminLayout + AdminProtectedRoute |
| Create | `src/components/admin/ComplianceReportDashboard.tsx` | Two-tab dashboard (Reports + Verify) |
| Create | `__tests__/complianceReport.test.ts` | Jest tests for pure helper functions |
| Modify | `src/App.tsx` | Add lazy import + `/admin/compliance` route |
| Modify | `src/components/admin/AdminSidebar.tsx` | Add "Compliance" nav item |
| Modify | `.env.example` | Add 3 compliance env var stubs |

---

## Task 1: Database Migration — compliance_reports table + RPC

**Files:**
- Create: `supabase/migrations/20260512160000_compliance_reports.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260512160000_compliance_reports.sql

BEGIN;

-- ── compliance_reports: tracks every generated compliance report ──────────────
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month           date        NOT NULL,
  storage_path           text,
  public_key_fingerprint text        NOT NULL,
  signature_b64          text,
  generated_by           uuid        REFERENCES auth.users(id),
  generated_at           timestamptz NOT NULL DEFAULT now(),
  record_count           int         NOT NULL DEFAULT 0,
  status                 text        NOT NULL DEFAULT 'completed',
  error_details          text,
  CONSTRAINT compliance_reports_status_check CHECK (status IN ('completed', 'failed')),
  UNIQUE (report_month)
);

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can read reports
CREATE POLICY "superadmins_read_compliance_reports"
  ON public.compliance_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Only service_role can insert/update (cron + edge function)
CREATE POLICY "service_role_manage_compliance_reports"
  ON public.compliance_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── get_audit_logs_for_month: query admin actions for a calendar month ────────
CREATE OR REPLACE FUNCTION public.get_audit_logs_for_month(month date)
RETURNS SETOF public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT al.*
  FROM public.audit_logs al
  JOIN public.profiles p ON p.id = al.actor_id
  WHERE al.event_timestamp >= date_trunc('month', month::timestamptz)
    AND al.event_timestamp <  date_trunc('month', month::timestamptz) + INTERVAL '1 month'
    AND p.role IN ('admin', 'superadmin')
  ORDER BY al.event_timestamp ASC;
END;
$$;

-- Only callable by service_role (edge function uses service key)
REVOKE ALL ON FUNCTION public.get_audit_logs_for_month(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_audit_logs_for_month(date) TO service_role;

-- ── pg_cron: run compliance report on 1st of each month at 09:00 UTC ─────────
-- Requires pg_cron + pg_net extensions (enabled in Supabase by default)
SELECT cron.schedule(
  'monthly-compliance-report',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/compliance-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

COMMIT;
```

- [ ] **Step 2: Verify the migration applies cleanly**

Run in Supabase SQL editor or via CLI:
```bash
supabase db push
```

Expected: no errors. Then confirm:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'compliance_reports' ORDER BY ordinal_position;
-- Should return: id, report_month, storage_path, public_key_fingerprint,
--   signature_b64, generated_by, generated_at, record_count, status, error_details

SELECT proname FROM pg_proc WHERE proname = 'get_audit_logs_for_month';
-- Should return 1 row
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260512160000_compliance_reports.sql
git commit -m "feat(T4.3): add compliance_reports table and get_audit_logs_for_month RPC"
```

---

## Task 2: Pure Helper Functions + Jest Tests

These functions are extracted from the edge function logic so they can be tested with Jest in Node (no Deno APIs).

**Files:**
- Create: `__tests__/complianceReport.test.ts`

The functions under test will be copy-pasted inline in the test file (since the edge function lives in Deno-land, not importable by Jest). This tests the logic in isolation.

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/complianceReport.test.ts

// ── Pure helpers duplicated here for Jest testability ─────────────────────────

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
```

- [ ] **Step 2: Run tests — verify they fail (functions not yet in real code)**

```bash
npx jest __tests__/complianceReport.test.ts --no-coverage
```

Expected: All tests PASS (the helpers are duplicated inline in the test file — this validates the logic before porting to Deno).

- [ ] **Step 3: Commit**

```bash
git add __tests__/complianceReport.test.ts
git commit -m "test(T4.3): add Jest tests for compliance report pure helpers"
```

---

## Task 3: Edge Function — Full Report Pipeline

**Files:**
- Create: `supabase/functions/compliance-report/index.ts`

- [ ] **Step 1: Create the edge function file**

```typescript
// supabase/functions/compliance-report/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { Resend } from "npm:resend@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const signingKeyB64 = Deno.env.get("COMPLIANCE_SIGNING_KEY")!;
const publicKeyB64 = Deno.env.get("COMPLIANCE_PUBLIC_KEY")!;
const keyFingerprint = Deno.env.get("COMPLIANCE_KEY_FINGERPRINT")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// ── Pure helpers ──────────────────────────────────────────────────────────────

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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// ── Signing ───────────────────────────────────────────────────────────────────

async function signPayload(canonicalJson: string): Promise<string> {
  if (!signingKeyB64) throw new Error("COMPLIANCE_SIGNING_KEY env var not set");
  const pemDecoded = atob(signingKeyB64);
  const derBytes = pemToDer(pemDecoded);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    derBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const encoder = new TextEncoder();
  const sigBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(canonicalJson)
  );
  return uint8ToBase64(new Uint8Array(sigBuffer));
}

// ── Signature Verification ────────────────────────────────────────────────────

async function verifySignature(canonicalJson: string, signatureB64: string): Promise<boolean> {
  if (!publicKeyB64) throw new Error("COMPLIANCE_PUBLIC_KEY env var not set");
  const pemDecoded = atob(publicKeyB64);
  const derBytes = pemToDer(pemDecoded);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    derBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const encoder = new TextEncoder();
  const sigBytes = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    sigBytes.buffer,
    encoder.encode(canonicalJson)
  );
}

// ── PDF Rendering ─────────────────────────────────────────────────────────────

async function renderPdf(
  reportMonth: string,
  records: Array<Record<string, unknown>>,
  signatureB64: string,
  stats: { byType: Record<string, number>; bySeverity: Record<string, number> }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28;
  const H = 841.89; // A4
  const margin = 50;
  const black = rgb(0, 0, 0);
  const gray = rgb(0.5, 0.5, 0.5);
  const primary = rgb(0.1, 0.3, 0.7);

  const footer = (page: ReturnType<typeof pdfDoc.addPage>) => {
    const sigTrunc = signatureB64.slice(0, 64) + "…";
    page.drawText(`Signed: ${sigTrunc}`, {
      x: margin, y: 25, size: 7, font: helvetica, color: gray,
    });
    page.drawText(`Key fingerprint: ${keyFingerprint} | Verify: /admin/compliance`, {
      x: margin, y: 14, size: 7, font: helvetica, color: gray,
    });
  };

  // Cover page
  const cover = pdfDoc.addPage([W, H]);
  cover.drawText("MobiRides", { x: margin, y: H - 80, size: 28, font: helveticaBold, color: primary });
  cover.drawText("SuperAdmin Compliance Report", { x: margin, y: H - 110, size: 16, font: helvetica, color: black });
  cover.drawText(`Report Period: ${reportMonth}`, { x: margin, y: H - 150, size: 12, font: helvetica, color: black });
  cover.drawText(`Generated: ${new Date().toISOString()}`, { x: margin, y: H - 170, size: 10, font: helvetica, color: gray });
  cover.drawText(`Records: ${records.length}`, { x: margin, y: H - 190, size: 10, font: helvetica, color: gray });
  cover.drawText(`Key Fingerprint: ${keyFingerprint}`, { x: margin, y: H - 210, size: 9, font: helvetica, color: gray });
  footer(cover);

  // Summary page
  const summary = pdfDoc.addPage([W, H]);
  summary.drawText("Event Summary", { x: margin, y: H - 60, size: 14, font: helveticaBold, color: black });

  let y = H - 90;
  summary.drawText("By Event Type", { x: margin, y, size: 11, font: helveticaBold, color: black });
  y -= 18;
  for (const [type, count] of Object.entries(stats.byType)) {
    summary.drawText(`${type}`, { x: margin + 10, y, size: 9, font: helvetica, color: black });
    summary.drawText(`${count}`, { x: W - margin - 40, y, size: 9, font: helvetica, color: black });
    y -= 14;
    if (y < 80) break;
  }

  y -= 10;
  summary.drawText("By Severity", { x: margin, y, size: 11, font: helveticaBold, color: black });
  y -= 18;
  for (const [sev, count] of Object.entries(stats.bySeverity)) {
    summary.drawText(`${sev}`, { x: margin + 10, y, size: 9, font: helvetica, color: black });
    summary.drawText(`${count}`, { x: W - margin - 40, y, size: 9, font: helvetica, color: black });
    y -= 14;
  }
  footer(summary);

  // Detail pages — 30 rows per page
  const chunkSize = 30;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const page = pdfDoc.addPage([W, H]);
    page.drawText(`Audit Log Detail (${i + 1}–${Math.min(i + chunkSize, records.length)} of ${records.length})`, {
      x: margin, y: H - 50, size: 11, font: helveticaBold, color: black,
    });

    let ry = H - 75;
    // Header row
    const cols = [
      { label: "Timestamp", x: margin },
      { label: "Event Type", x: margin + 140 },
      { label: "Severity", x: margin + 290 },
      { label: "Resource", x: margin + 360 },
    ];
    for (const col of cols) {
      page.drawText(col.label, { x: col.x, y: ry, size: 8, font: helveticaBold, color: black });
    }
    ry -= 14;

    for (const rec of chunk) {
      const ts = String(rec.event_timestamp ?? "").slice(0, 19).replace("T", " ");
      const et = String(rec.event_type ?? "").slice(0, 30);
      const sv = String(rec.severity ?? "");
      const rs = String(rec.resource_type ?? rec.resource_id ?? "—").slice(0, 20);
      page.drawText(ts, { x: margin, y: ry, size: 7, font: helvetica, color: black });
      page.drawText(et, { x: margin + 140, y: ry, size: 7, font: helvetica, color: black });
      page.drawText(sv, { x: margin + 290, y: ry, size: 7, font: helvetica, color: black });
      page.drawText(rs, { x: margin + 360, y: ry, size: 7, font: helvetica, color: black });
      ry -= 12;
    }
    footer(page);
  }

  return pdfDoc.save();
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Parse body once before any branching — req.json() can only be called once
  const body = await req.json().catch(() => ({}));

  try {
    const action = body.action as string | undefined;

    // ── Verify action ──────────────────────────────────────────────────────
    if (action === "verify") {
      const { canonical_json, signature_b64 } = body as {
        canonical_json: string;
        signature_b64: string;
      };
      if (!canonical_json || !signature_b64) {
        return new Response(
          JSON.stringify({ error: "canonical_json and signature_b64 required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const valid = await verifySignature(canonical_json, signature_b64);
      return new Response(
        JSON.stringify({ valid, key_fingerprint: keyFingerprint }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Auth gate for report generation ───────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!profile || !["admin", "superadmin"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Resolve month ──────────────────────────────────────────────────────
    const reportMonth = resolveReportMonth(body.month);
    const monthDate = `${reportMonth}-01`;

    // ── Query audit logs ───────────────────────────────────────────────────
    const { data: records, error: queryError } = await supabase
      .rpc("get_audit_logs_for_month", { month: monthDate });
    if (queryError) throw new Error(`Query failed: ${queryError.message}`);

    const safeRecords = records ?? [];

    // ── Canonicalize + Sign ────────────────────────────────────────────────
    const payload = {
      generated_at: new Date().toISOString(),
      record_count: safeRecords.length,
      records: safeRecords,
      report_month: reportMonth,
    };
    const canonicalJson = canonicalizeReport(payload);
    const signatureB64 = await signPayload(canonicalJson);

    // ── Render PDF ─────────────────────────────────────────────────────────
    const stats = buildSummaryStats(
      safeRecords.map((r: Record<string, unknown>) => ({
        event_type: String(r.event_type ?? ""),
        severity: String(r.severity ?? "low"),
      }))
    );
    const pdfBytes = await renderPdf(reportMonth, safeRecords, signatureB64, stats);

    // ── Upload to Storage ──────────────────────────────────────────────────
    const storagePath = `reports/${reportMonth}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("compliance-reports")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // ── Email SuperAdmins ──────────────────────────────────────────────────
    const { data: admins } = await supabase
      .from("profiles")
      .select("email:id, id")
      .in("role", ["admin", "superadmin"]);

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const adminEmails = (admins ?? [])
      .map((a: { id: string }) => authUsers?.users?.find((u) => u.id === a.id)?.email)
      .filter(Boolean) as string[];

    if (adminEmails.length > 0) {
      const resend = new Resend(resendApiKey);
      const sigBytes = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));

      await resend.emails.send({
        from: "MobiRides Compliance <noreply@app.mobirides.com>",
        to: adminEmails,
        subject: `MobiRides Compliance Report — ${reportMonth}`,
        html: `
          <h2>MobiRides SuperAdmin Compliance Report</h2>
          <p><strong>Period:</strong> ${reportMonth}</p>
          <p><strong>Records:</strong> ${safeRecords.length} admin actions</p>
          <p><strong>Key Fingerprint:</strong> <code>${keyFingerprint}</code></p>
          <p>The PDF and detached signature (.sig) are attached. Verify with:<br/>
          <code>openssl dgst -sha256 -verify public_key.pem -signature report.sig report_payload.json</code></p>
          <p>Access reports and the public key at <strong>/admin/compliance</strong>.</p>
        `,
        attachments: [
          {
            filename: `compliance-${reportMonth}.pdf`,
            content: uint8ToBase64(pdfBytes),
          },
          {
            filename: `compliance-${reportMonth}.sig`,
            content: uint8ToBase64(sigBytes),
          },
        ],
      });
    }

    // ── Log to compliance_reports ──────────────────────────────────────────
    await supabase.from("compliance_reports").upsert({
      report_month: monthDate,
      storage_path: storagePath,
      public_key_fingerprint: keyFingerprint,
      signature_b64: signatureB64,
      generated_by: isServiceRole ? null : undefined,
      record_count: safeRecords.length,
      status: "completed",
      error_details: null,
    }, { onConflict: "report_month" });

    return new Response(
      JSON.stringify({ success: true, report_month: reportMonth, record_count: safeRecords.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("compliance-report error:", message);

    // Best-effort failure log (body already parsed above)
    try {
      const reportMonth = resolveReportMonth(body.month);
      await supabase.from("compliance_reports").upsert({
        report_month: `${reportMonth}-01`,
        public_key_fingerprint: keyFingerprint ?? "unknown",
        record_count: 0,
        status: "failed",
        error_details: message,
      }, { onConflict: "report_month" });
    } catch (_) { /* ignore secondary failure */ }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Create the compliance-reports storage bucket**

In Supabase Dashboard → Storage → New Bucket:
- Name: `compliance-reports`
- Public: NO (private)
- File size limit: 50MB

Or via SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-reports', 'compliance-reports', false)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Deploy the edge function**

```bash
supabase functions deploy compliance-report --no-verify-jwt
```

Expected output: `Deployed compliance-report`

- [ ] **Step 4: Set edge function secrets**

```bash
supabase secrets set COMPLIANCE_SIGNING_KEY="<base64-encoded-private-key-pem>"
supabase secrets set COMPLIANCE_PUBLIC_KEY="<base64-encoded-public-key-pem>"
supabase secrets set COMPLIANCE_KEY_FINGERPRINT="sha256:<fingerprint-hex>"
```

(Generate keys per the Key Generation section below — Task 7)

- [ ] **Step 5: Smoke test the verify endpoint**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/compliance-report \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","canonical_json":"{\"a\":1}","signature_b64":"invalid"}'
```

Expected: `{"valid":false,"key_fingerprint":"sha256:..."}`

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/compliance-report/index.ts
git commit -m "feat(T4.3): add compliance-report edge function with RSA signing and PDF generation"
```

---

## Task 4: Frontend — Page Shell + Routing

**Files:**
- Create: `src/pages/admin/AdminCompliance.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create the page shell**

```typescript
// src/pages/admin/AdminCompliance.tsx
import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ComplianceReportDashboard } from "@/components/admin/ComplianceReportDashboard";

const AdminCompliance = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Compliance Reports</h1>
            <p className="text-muted-foreground">
              Monthly signed audit reports for regulatory compliance (T4.3)
            </p>
          </div>
          <ComplianceReportDashboard />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminCompliance;
```

- [ ] **Step 2: Add lazy import to App.tsx**

In `src/App.tsx`, add after the `AdminCampaigns` import line (around line 112):

```typescript
const AdminCompliance = lazy(() => import("@/pages/admin/AdminCompliance"));
```

- [ ] **Step 3: Add route to App.tsx**

In `src/App.tsx`, add after the `/admin/campaigns` route (around line 498):

```tsx
<Route path="/admin/compliance" element={
  <Suspense fallback={<div>Loading...</div>}>
    <AdminCompliance />
  </Suspense>
} />
```

- [ ] **Step 4: Add sidebar nav item to AdminSidebar.tsx**

In `src/components/admin/AdminSidebar.tsx`, add `FileCheck` to the lucide imports:

```typescript
import {
  BarChart3, Users, Car, CreditCard, ClipboardCheck, Settings, Home,
  MessageSquare, UserCog, Shield, TrendingUp, Tag, FileText, Star,
  DollarSign, Megaphone, FileCheck
} from "lucide-react";
```

Then add to the `adminMenuItems` array after the `"Audit Logs"` entry:

```typescript
{ title: "Compliance", url: "/admin/compliance", icon: FileCheck },
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminCompliance.tsx src/App.tsx src/components/admin/AdminSidebar.tsx
git commit -m "feat(T4.3): add AdminCompliance page shell and route"
```

---

## Task 5: Frontend — ComplianceReportDashboard (Tab 1: Reports)

**Files:**
- Create: `src/components/admin/ComplianceReportDashboard.tsx`

- [ ] **Step 1: Create the dashboard component (Tab 1 only)**

```typescript
// src/components/admin/ComplianceReportDashboard.tsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Download, RefreshCw, FileLock, ShieldCheck, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface ComplianceReport {
  id: string;
  report_month: string;
  storage_path: string | null;
  public_key_fingerprint: string;
  signature_b64: string | null;
  generated_by: string | null;
  generated_at: string;
  record_count: number;
  status: "completed" | "failed";
  error_details: string | null;
}

const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

function ReportsTab() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: reports, isLoading } = useQuery<ComplianceReport[]>({
    queryKey: ["compliance-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_reports")
        .select("*")
        .order("report_month", { ascending: false });
      if (error) throw error;
      return data as ComplianceReport[];
    },
  });

  const handleDownload = async (storagePath: string, month: string) => {
    const { data, error } = await supabase.storage
      .from("compliance-reports")
      .createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Failed to generate download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = `compliance-${month}.pdf`;
    a.click();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance-report`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ month: selectedMonth }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      toast.success(`Report for ${selectedMonth} generated (${result.record_count} records)`);
      queryClient.invalidateQueries({ queryKey: ["compliance-reports"] });
      setGenerateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {reports?.length ?? 0} report(s) on record
        </p>
        <Button onClick={() => setGenerateOpen(true)} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Compliance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Report Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!reports?.length ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <FileLock className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No reports yet</p>
          <p className="text-sm">Generate your first compliance report above.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <React.Fragment key={r.id}>
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{r.report_month}</TableCell>
                    <TableCell className="text-right font-mono">{r.record_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.generated_by ? r.generated_by.slice(0, 8) + "…" : "cron"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.generated_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "completed" && r.storage_path && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(r.storage_path!, r.report_month)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {r.status === "failed" && r.error_details && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-0">
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-red-600 py-1">
                            <ChevronDown className="h-3 w-3" /> Show error
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="text-xs bg-red-50 text-red-800 p-2 rounded mb-2 whitespace-pre-wrap">
                              {r.error_details}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Tab 2 (Verify Signature) and export**

Append to the same file (`src/components/admin/ComplianceReportDashboard.tsx`):

```typescript
function VerifyTab() {
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; key_fingerprint: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const publicKeyPem = atob(import.meta.env.VITE_COMPLIANCE_PUBLIC_KEY ?? "");
  const keyFingerprint = import.meta.env.VITE_COMPLIANCE_KEY_FINGERPRINT ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKeyPem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!sigFile || !jsonFile) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const [sigB64, canonicalJson] = await Promise.all([
        sigFile.arrayBuffer().then((buf) => {
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (const b of bytes) binary += String.fromCharCode(b);
          return btoa(binary);
        }),
        jsonFile.text(),
      ]);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance-report`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "verify", canonical_json: canonicalJson, signature_b64: sigB64 }),
        }
      );
      const result = await res.json();
      setVerifyResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            System Public Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Fingerprint (SHA-256):</span>
            <code className="bg-muted px-2 py-0.5 rounded text-xs break-all">{keyFingerprint}</code>
          </div>
          <div className="relative">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap break-all">
              {publicKeyPem || "VITE_COMPLIANCE_PUBLIC_KEY not set"}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 text-xs"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OpenSSL Verification Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Download a report's <code>.sig</code> file and its canonical JSON payload, then run:</p>
          <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
{`# Save the public key above to public_key.pem, then:
openssl dgst -sha256 \\
  -verify public_key.pem \\
  -signature compliance-YYYY-MM.sig \\
  report_payload.json

# Expected output on success:
# Verified OK`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a <code>.sig</code> file and the canonical JSON payload to verify server-side.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Signature file (.sig)</label>
              <input
                type="file"
                accept=".sig"
                onChange={(e) => setSigFile(e.target.files?.[0] ?? null)}
                className="text-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Canonical JSON payload (.json)</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)}
                className="text-sm w-full"
              />
            </div>
          </div>
          <Button
            onClick={handleVerify}
            disabled={!sigFile || !jsonFile || verifying}
          >
            {verifying ? "Verifying…" : "Verify Signature"}
          </Button>
          {verifyResult && (
            <div className={`p-3 rounded text-sm font-medium ${verifyResult.valid ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {verifyResult.valid ? "✓ Signature VALID — document is authentic" : "✗ Signature INVALID — document may be tampered"}
              <div className="text-xs font-normal mt-1">Key fingerprint: {verifyResult.key_fingerprint}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ComplianceReportDashboard() {
  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="verify">Verify Signature</TabsTrigger>
      </TabsList>
      <TabsContent value="reports">
        <ReportsTab />
      </TabsContent>
      <TabsContent value="verify">
        <VerifyTab />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ComplianceReportDashboard.tsx
git commit -m "feat(T4.3): add ComplianceReportDashboard with reports list and signature verification"
```

---

## Task 6: Environment Variables + Key Generation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Generate RSA-2048 key pair (run once on developer machine)**

```bash
# Generate private key
openssl genrsa -out compliance_private.pem 2048

# Extract public key
openssl rsa -in compliance_private.pem -pubout -out compliance_public.pem

# Get SHA-256 fingerprint
openssl rsa -in compliance_public.pem -pubin -outform DER | openssl dgst -sha256
# Output: SHA2-256(stdin)= <hex-fingerprint>
# Prefix it with "sha256:" when setting the env var

# Base64-encode (no line wrapping) for env vars
base64 -w0 compliance_private.pem   # → COMPLIANCE_SIGNING_KEY value
base64 -w0 compliance_public.pem    # → COMPLIANCE_PUBLIC_KEY value

# IMPORTANT: Delete the PEM files after storing in Supabase secrets
rm compliance_private.pem compliance_public.pem
```

- [ ] **Step 2: Set Supabase edge function secrets**

```bash
supabase secrets set \
  COMPLIANCE_SIGNING_KEY="<output of base64 compliance_private.pem>" \
  COMPLIANCE_PUBLIC_KEY="<output of base64 compliance_public.pem>" \
  COMPLIANCE_KEY_FINGERPRINT="sha256:<hex-from-fingerprint-command>"
```

- [ ] **Step 3: Set Vite env vars for frontend**

Add to your `.env.local` (never commit real values):
```
VITE_COMPLIANCE_PUBLIC_KEY=<same base64 public key — safe to expose>
VITE_COMPLIANCE_KEY_FINGERPRINT=sha256:<hex-fingerprint>
```

- [ ] **Step 4: Update .env.example**

```bash
# In .env.example, add after the existing RESEND_API_KEY line:
```

```dotenv
# Compliance Reporting (T4.3) — RSA-2048 key pair for signed audit reports
# Generate with: openssl genrsa -out priv.pem 2048 && openssl rsa -in priv.pem -pubout -out pub.pem
# Then base64 -w0 each file and store private key ONLY in Supabase secrets
COMPLIANCE_SIGNING_KEY=base64_encoded_pkcs8_private_key_pem
COMPLIANCE_PUBLIC_KEY=base64_encoded_public_key_pem
COMPLIANCE_KEY_FINGERPRINT=sha256:fingerprint_hex

# Frontend-visible (safe to expose — public key only)
VITE_COMPLIANCE_PUBLIC_KEY=base64_encoded_public_key_pem
VITE_COMPLIANCE_KEY_FINGERPRINT=sha256:fingerprint_hex
```

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "docs(T4.3): add compliance env var stubs to .env.example"
```

---

## Task 7: End-to-End Smoke Test

- [ ] **Step 1: Run all Jest tests**

```bash
npx jest --passWithNoTests --no-coverage
```

Expected: All tests pass including `__tests__/complianceReport.test.ts`

- [ ] **Step 2: Manually trigger a report generation**

Navigate to `/admin/compliance` in the browser. Click **Generate Report**, select the previous month, click **Generate**. Expected:
- Toast: "Report for YYYY-MM generated (N records)"
- Table shows new row with status `completed`
- PDF download button appears

- [ ] **Step 3: Verify the PDF downloads correctly**

Click **Download PDF**. Expected: a PDF opens with the cover page showing the correct month, record count, and key fingerprint in the footer.

- [ ] **Step 4: Test signature verification**

In the **Verify Signature** tab, upload the `.sig` file from the email attachment and the canonical JSON (retrieve from storage or generate inline). Click **Verify Signature**. Expected: "Signature VALID" result.

- [ ] **Step 5: Test error path**

Temporarily pass an invalid month format: `{"month": "not-a-date"}` via curl. Expected: function returns 500 with error logged to `compliance_reports` as `status: 'failed'`.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(T4.3): complete automated compliance reporting with RSA-signed PDF audit reports"
```

---

## Key Generation Reference (Quick Cheatsheet)

```bash
# 1. Generate
openssl genrsa -out compliance_private.pem 2048
openssl rsa -in compliance_private.pem -pubout -out compliance_public.pem

# 2. Fingerprint (prefix result with "sha256:")
openssl rsa -in compliance_public.pem -pubin -outform DER | openssl dgst -sha256

# 3. Encode for env vars
base64 -w0 compliance_private.pem  # → COMPLIANCE_SIGNING_KEY (secret, Supabase only)
base64 -w0 compliance_public.pem   # → COMPLIANCE_PUBLIC_KEY (safe to expose)

# 4. Verify a report manually
echo "<signature_b64>" | base64 -d > report.sig
openssl dgst -sha256 -verify compliance_public.pem -signature report.sig payload.json

# 5. Cleanup (critical — never commit private key)
rm compliance_private.pem compliance_public.pem
```

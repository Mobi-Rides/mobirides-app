import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { Resend } from "npm:resend@4";
import { getRequiredSecret } from "../_shared/secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const signingKeyB64 = getRequiredSecret("COMPLIANCE_SIGNING_KEY");
const publicKeyB64 = getRequiredSecret("COMPLIANCE_PUBLIC_KEY");
const keyFingerprint = getRequiredSecret("COMPLIANCE_KEY_FINGERPRINT");
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function resolveReportMonth(monthParam?: string): string {
  if (monthParam) return monthParam;
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function canonicalizeReport(payload: unknown): string {
  const sortedReplacer = (_key: string, value: unknown) =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b)
          )
        )
      : value;
  return JSON.stringify(payload, sortedReplacer);
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

  const addFooter = (page: ReturnType<typeof pdfDoc.addPage>) => {
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
  addFooter(cover);

  // Summary page
  const summary = pdfDoc.addPage([W, H]);
  summary.drawText("Event Summary", { x: margin, y: H - 60, size: 14, font: helveticaBold, color: black });

  let y = H - 90;
  summary.drawText("By Event Type", { x: margin, y, size: 11, font: helveticaBold, color: black });
  y -= 18;
  for (const [type, count] of Object.entries(stats.byType)) {
    summary.drawText(String(type), { x: margin + 10, y, size: 9, font: helvetica, color: black });
    summary.drawText(String(count), { x: W - margin - 40, y, size: 9, font: helvetica, color: black });
    y -= 14;
    if (y < 80) break;
  }

  y -= 10;
  summary.drawText("By Severity", { x: margin, y, size: 11, font: helveticaBold, color: black });
  y -= 18;
  for (const [sev, count] of Object.entries(stats.bySeverity)) {
    summary.drawText(String(sev), { x: margin + 10, y, size: 9, font: helvetica, color: black });
    summary.drawText(String(count), { x: W - margin - 40, y, size: 9, font: helvetica, color: black });
    y -= 14;
    if (y < 80) break;
  }
  addFooter(summary);

  // Detail pages — 30 rows per page
  const chunkSize = 30;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const page = pdfDoc.addPage([W, H]);
    page.drawText(
      `Audit Log Detail (${i + 1}–${Math.min(i + chunkSize, records.length)} of ${records.length})`,
      { x: margin, y: H - 50, size: 11, font: helveticaBold, color: black }
    );

    let ry = H - 75;
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
    addFooter(page);
  }

  return pdfDoc.save();
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Parse body once — req.json() can only be called once
  const body = await req.json().catch(() => ({}));

  let userId: string | null = null;

  try {
    const action = body.action as string | undefined;

    // ── Verify action ────────────────────────────────────────────────────────
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

    // ── Auth gate for report generation ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    // Accept either exact token match (legacy JWT) or a JWT whose role claim is service_role.
    // The latter handles new-format sb_secret_ keys that Supabase resolves to a role-claim JWT.
    const jwtRole = (() => {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        return (JSON.parse(atob(parts[1])) as { role?: string }).role ?? null;
      } catch { return null; }
    })();
    const isServiceRole = token === serviceRoleKey || jwtRole === "service_role";

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Resolve month ─────────────────────────────────────────────────────────
    const reportMonth = resolveReportMonth(body.month);
    const monthDate = `${reportMonth}-01`;

    // ── Query audit logs ──────────────────────────────────────────────────────
    const { data: records, error: queryError } = await supabase
      .rpc("get_audit_logs_for_month", { month: monthDate });
    if (queryError) throw new Error(`Query failed: ${queryError.message}`);

    const safeRecords = (records ?? []) as Array<Record<string, unknown>>;

    // ── Canonicalize + Sign ───────────────────────────────────────────────────
    const payload = {
      generated_at: new Date().toISOString(),
      record_count: safeRecords.length,
      records: safeRecords,
      report_month: reportMonth,
    };
    const canonicalJson = canonicalizeReport(payload);
    const signatureB64 = await signPayload(canonicalJson);

    // ── Render PDF ────────────────────────────────────────────────────────────
    const stats = buildSummaryStats(
      safeRecords.map((r) => ({
        event_type: String(r.event_type ?? ""),
        severity: String(r.severity ?? "low"),
      }))
    );
    const pdfBytes = await renderPdf(reportMonth, safeRecords, signatureB64, stats);

    // ── Upload to Storage ─────────────────────────────────────────────────────
    const storagePath = `reports/${reportMonth}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("compliance-reports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // ── Email SuperAdmins ─────────────────────────────────────────────────────
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    const { data: authData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) console.warn("compliance-report: could not fetch auth users:", listErr.message);
    const adminEmails = (adminProfiles ?? [])
      .map((a: { id: string }) => authData?.users?.find((u) => u.id === a.id)?.email)
      .filter(Boolean) as string[];

    if (adminEmails.length > 0) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: "MobiRides Compliance <noreply@app.mobirides.com>",
        to: adminEmails,
        subject: `MobiRides Compliance Report — ${reportMonth}`,
        html: `
          <h2>MobiRides SuperAdmin Compliance Report</h2>
          <p><strong>Period:</strong> ${reportMonth}</p>
          <p><strong>Records:</strong> ${safeRecords.length} admin actions</p>
          <p><strong>Key Fingerprint:</strong> <code>${keyFingerprint}</code></p>
          <p>The PDF and detached signature (.sig) are attached.<br/>
          Verify with: <code>openssl dgst -sha256 -verify public_key.pem -signature report.sig payload.json</code></p>
          <p>Access reports at <strong>/admin/compliance</strong>.</p>
        `,
        attachments: [
          { filename: `compliance-${reportMonth}.pdf`, content: uint8ToBase64(pdfBytes) },
          { filename: `compliance-${reportMonth}.sig`, content: signatureB64 },
        ],
      });
    }

    // ── Log result ────────────────────────────────────────────────────────────
    await supabase.from("compliance_reports").upsert(
      {
        report_month: monthDate,
        storage_path: storagePath,
        public_key_fingerprint: keyFingerprint,
        signature_b64: signatureB64,
        generated_by: isServiceRole ? null : userId,
        record_count: safeRecords.length,
        status: "completed",
        error_details: null,
      },
      { onConflict: "report_month" }
    );

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
      await supabase.from("compliance_reports").upsert(
        {
          report_month: `${reportMonth}-01`,
          public_key_fingerprint: keyFingerprint || "unknown",
          record_count: 0,
          status: "failed",
          error_details: message,
        },
        { onConflict: "report_month" }
      );
    } catch (_) { /* ignore secondary failure */ }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

# Automated Compliance Reporting — Design Spec
**Reference:** `docs/plans/20260423_SUPERADMIN_CORE_LOGIC_REMEDIATION_PLAN.md` (T4.3)
**Date:** 2026-05-12
**Status:** Approved

---

## Overview

Implement cryptographic non-repudiation for administrative actions to meet regulatory audit requirements. A monthly cron job generates a PDF report of all SuperAdmin actions from `audit_logs`, signs it with an RSA-SHA256 system key, stores the PDF in Supabase Storage, and emails it to all SuperAdmins. A dashboard allows manual triggering and public-key-based external verification.

---

## Requirements Traceability

| Plan Requirement | Implementation |
|---|---|
| Generate monthly PDF reports | Edge Function on monthly pg_cron schedule |
| All SuperAdmin actions included | `get_audit_logs_for_month()` RPC filtered to SuperAdmin actors |
| Signed with a system key | RSA-SHA256 via Deno `crypto.subtle`, key in env vars |
| Non-repudiation for regulatory audits | Asymmetric key pair — public key published for external verification |
| PDF generation library | `pdf-lib` (Deno-compatible ESM, no browser APIs) |
| Digital signature logic using system PKI | `crypto.subtle.sign("RSASSA-PKCS1-v1_5", ...)` built into Deno runtime |
| Automated report generation schedule | Monthly Supabase pg_cron trigger |
| Verify PDF integrity with external tools | Public key endpoint + `openssl dgst -verify` instructions in dashboard |

---

## Architecture

```
pg_cron (monthly)
       │
       ▼
compliance-report (Edge Function)
       │
       ├─► get_audit_logs_for_month() RPC  ──► audit_logs table
       │
       ├─► Canonicalize JSON payload
       │
       ├─► crypto.subtle.sign (RSA-SHA256)
       │       └── COMPLIANCE_SIGNING_KEY (env var, PEM base64)
       │
       ├─► pdf-lib → render PDF
       │       └── cover page + summary table + detail pages + signature footer
       │
       ├─► Supabase Storage  →  compliance-reports/reports/YYYY-MM.pdf
       │
       ├─► resend-service → email SuperAdmins (PDF attachment + .sig file)
       │
       └─► compliance_reports table (log run metadata)

Frontend (/admin/compliance)
       ├─► Tab 1: Reports list + Download + Manual Trigger
       └─► Tab 2: Verify Signature (public key display + server-side verify endpoint)
```

---

## Section 1: Database Layer

### Table: `compliance_reports`

```sql
CREATE TABLE public.compliance_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month          date NOT NULL,          -- first day of covered month
  storage_path          text,                   -- Supabase Storage object path
  public_key_fingerprint text NOT NULL,         -- SHA-256 of signing public key
  signature_b64         text,                   -- detached RSA-SHA256 signature (base64)
  generated_by          uuid REFERENCES auth.users(id), -- null = cron
  generated_at          timestamptz NOT NULL DEFAULT now(),
  record_count          int NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'completed', -- 'completed' | 'failed'
  error_details         text,
  UNIQUE (report_month)
);
```

RLS: SuperAdmin-only SELECT. Service role INSERT/UPDATE.

### RPC: `get_audit_logs_for_month(month date)`

- SECURITY DEFINER, `search_path = public`
- Returns all `audit_logs` rows where `event_timestamp` falls within the given month AND `actor_id` belongs to a profile with `role IN ('admin', 'superadmin')`
- Granted to `service_role` only

---

## Section 2: Edge Function (`compliance-report`)

**Location:** `supabase/functions/compliance-report/index.ts`

### Request

```
POST /functions/v1/compliance-report
Authorization: Bearer <service_role_key | superadmin_jwt>
Body: { "month": "2026-05" }   -- optional, defaults to previous month
```

### Pipeline

1. **Auth gate** — service role key accepted for cron; SuperAdmin JWT validated for manual calls via profile role check.

2. **Resolve month** — parse `month` from body or default to first day of previous calendar month.

3. **Query** — call `get_audit_logs_for_month(month)` with the service role Supabase client.

4. **Canonicalize** — build JSON payload:
   ```json
   {
     "report_month": "2026-05",
     "generated_at": "<iso8601>",
     "record_count": 42,
     "records": [...]
   }
   ```
   Keys sorted alphabetically, no extra whitespace — deterministic serialization.

5. **Sign** — load private key from `COMPLIANCE_SIGNING_KEY` env var (PKCS#8 PEM, base64-encoded). Use `crypto.subtle.importKey` then `crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, payload)`. Encode signature as base64.

6. **Render PDF** — using `pdf-lib`:
   - **Cover page:** MobiRides logo text, "SuperAdmin Compliance Report", period, generated timestamp, record count, key fingerprint, signature (truncated to 64 chars + "…")
   - **Summary page:** Event type breakdown table (event type, count, severity distribution)
   - **Detail pages:** Full audit log rows (timestamp, actor, event type, severity, resource, reason) using `pdf-lib` table layout
   - **Footer (every page):** "Signed with key fingerprint: <fingerprint> | Verify: /admin/compliance"

7. **Upload** — upload PDF bytes to Supabase Storage bucket `compliance-reports` at `reports/YYYY-MM.pdf`. Bucket is private; signed URLs generated on demand.

8. **Email** — call `resend-service` with:
   - Recipients: all profiles where `role = 'superadmin'`
   - Subject: `MobiRides Compliance Report — <Month Year>`
   - Body: summary stats, verification instructions
   - Attachments: PDF + detached `.sig` file (raw signature bytes as base64)

9. **Log** — upsert row in `compliance_reports` with status, path, signature, key fingerprint, record count. On any pipeline error, upsert with `status = 'failed'` and `error_details`.

### Environment Variables Required

| Variable | Description |
|---|---|
| `COMPLIANCE_SIGNING_KEY` | PKCS#8 RSA-2048 private key, PEM base64-encoded |
| `COMPLIANCE_PUBLIC_KEY` | Matching RSA-2048 public key, PEM base64-encoded |
| `COMPLIANCE_KEY_FINGERPRINT` | SHA-256 fingerprint of the public key |

Key pair generated once via `openssl` and stored in Supabase Edge Function secrets.

---

## Section 3: Frontend Dashboard

**Route:** `/admin/compliance`
**Files:**
- `src/pages/admin/AdminCompliance.tsx` — page shell with AdminLayout + AdminProtectedRoute
- `src/components/admin/ComplianceReportDashboard.tsx` — two-tab dashboard component

### Tab 1 — Reports

- Table columns: Month, Records, Generated By, Generated At, Status badge
- **Download PDF** button per row — fetches signed Supabase Storage URL, triggers browser download
- **Generate Report** button (top-right) — month picker dialog → POST to `compliance-report` Edge Function → progress toast → table refresh on completion
- Failed rows: expandable `error_details` panel

### Tab 2 — Verify Signature

- Current system public key displayed in a copyable code block (PEM format)
- Key fingerprint (SHA-256) displayed prominently
- Step-by-step `openssl` verification instructions:
  ```bash
  openssl dgst -sha256 -verify public_key.pem -signature report.sig report_payload.json
  ```
- **Test Verification** panel — user uploads `.sig` file + canonical JSON payload → POST to `compliance-report` Edge Function with `action: "verify"` → returns pass/fail with detail (signature is over the JSON payload, not the PDF bytes)

### Wiring

- Lazy-loaded route added to `src/App.tsx`: `<Route path="/admin/compliance" element={<AdminCompliance />} />`
- Sidebar link added in `src/components/admin/AdminLayout.tsx` under the SuperAdmin section

---

## Key Generation (One-Time Setup)

```bash
# Generate RSA-2048 key pair
openssl genrsa -out compliance_private.pem 2048
openssl rsa -in compliance_private.pem -pubout -out compliance_public.pem

# Get fingerprint
openssl rsa -in compliance_public.pem -pubin -outform DER | openssl dgst -sha256

# Base64-encode for env var
base64 -w0 compliance_private.pem
base64 -w0 compliance_public.pem
```

Store private key in Supabase Edge Function secrets (never committed to git). Public key is safe to expose in the dashboard.

---

## Error Handling

| Failure Point | Behaviour |
|---|---|
| No audit logs for month | Generate empty report, log with `record_count = 0`, still sign and store |
| Storage upload fails | Log as `failed`, email SuperAdmins with inline report (no PDF attachment) |
| Email send fails | Log as `failed` with error details; PDF already stored and retrievable from dashboard |
| Invalid JWT on manual trigger | Return 401 immediately |
| Signing key missing from env | Return 500, log critical error, do not generate unsigned report |

---

## Out of Scope

- Slack alerting (deferred to T3.1 Slack webhook work)
- System health monitoring dashboard (T3.1 — separate implementation)
- Audit log archiving (separate migration under T3.2)

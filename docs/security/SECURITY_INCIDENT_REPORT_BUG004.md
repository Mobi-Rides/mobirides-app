# Security Incident Report — BUG-004: Service Role Key Exposure & SSRF

| Field | Detail |
|-------|--------|
| **Incident ID** | BUG-004 |
| **Severity** | Critical |
| **Status** | Remediated |
| **Date Detected** | 2026-04-04 |
| **Date Remediated** | 2026-04-06 |
| **Reported By** | Matthias Luft, Supabase Security |
| **Incident Owner** | Modisa Maphanyane |

---

## 1. Executive Summary

A Supabase `service_role` key and `anon` key were hardcoded in 16 administrative scripts committed to the project repository. This exposure allowed unauthorized outbound requests (SSRF) originating from MobiRides edge functions, including scans to malicious domains such as `vip.66591.vip/.env.test` and `dheeraj98reddy.workers.dev/.env.save`. The incident was flagged by Supabase Security on 2026-04-04.

---

## 2. Timeline of Events

| Date & Time (UTC) | Event |
|--------------------|-------|
| Unknown (pre-2026-04-04) | `service_role` key hardcoded in 16 admin scripts (`check-schema.js`, `check-rls.cjs`, `apply-migration.cjs`, etc.) |
| Unknown (pre-2026-04-04) | Supabase `anon` key and `service_role` key stored in `.env` file in repository |
| 2026-04-04 | Supabase Security alerts MobiRides of suspicious outbound scanning traffic |
| 2026-04-04 | Initial investigation confirms hardcoded keys in scripts; BUG-004 logged |
| 2026-04-04 | 16 compromised admin scripts deleted from repository |
| 2026-04-04 | All secrets removed from `.env` file |
| 2026-04-05 | Domain whitelist implemented in `send-push-notification` edge function |
| 2026-04-06 | All Supabase API keys rotated (service_role, anon key) |
| 2026-04-06 | Legacy API keys disabled in Supabase Dashboard |
| 2026-04-06 | `send-push-notification` edge function redeployed with whitelist active |
| 2026-04-06 | Edge function logs confirm `Blocked push to disallowed endpoint` entries — whitelist operational |
| 2026-04-06 | Supabase Security notified of second malicious domain (`dheeraj98reddy.workers.dev`) |
| 2026-04-06 | Confirmed whitelist is blocking new malicious requests; remediation complete |

---

## 3. Root Cause Analysis

### Primary Cause
Hardcoded Supabase `service_role` key in 16 administrative scripts committed to the codebase. This key bypasses all Row Level Security (RLS) policies and grants unrestricted read/write access to the entire database.

### Contributing Factors
1. **No secret management policy** — developers stored keys directly in source files rather than using environment secrets or a vault.
2. **No outbound request validation** — the `send-push-notification` edge function accepted arbitrary URLs without domain whitelisting, enabling SSRF exploitation.
3. **Legacy API keys enabled** — older Supabase key versions remained active alongside current keys, expanding the attack surface.

---

## 4. Data Potentially Exposed

The `service_role` key bypasses all RLS. During the exposure window (unknown start — 2026-04-06), an attacker with the key could have accessed:

| Table | Data Type | Sensitivity |
|-------|-----------|-------------|
| `auth.users` | Email, phone, metadata, password hashes | **Critical** — Personal identifiable information (PII) |
| `profiles` | Full name, avatar, phone number, role, address | **High** — PII |
| `bookings` | Booking details, dates, prices, locations | **Medium** — Financial/location data |
| `host_wallets` / `wallet_transactions` | Balances, transaction history | **High** — Financial data |
| `conversation_messages` | Private messages between users | **High** — Private communications |
| `documents` | KYC documents, file URLs | **Critical** — Identity documents |
| `license_verifications` | Driver's license data | **Critical** — Identity documents |
| `identity_verification_checks` | Verification photos, license photos | **Critical** — Biometric/identity data |
| `notifications` | User notifications | **Low** |
| `insurance_claims` | Claim details, evidence URLs | **Medium** — Sensitive personal data |

### Estimated Affected Users
All registered users of the MobiRides platform are potentially affected, as the `service_role` key grants access to the entire database without RLS restrictions.

---

## 5. Remediation Actions Taken

| # | Action | Status | Date |
|---|--------|--------|------|
| 1 | Deleted 16 scripts containing hardcoded keys | ✅ Complete | 2026-04-04 |
| 2 | Removed all secrets from `.env` file | ✅ Complete | 2026-04-04 |
| 3 | Implemented domain whitelist on `send-push-notification` | ✅ Complete | 2026-04-05 |
| 4 | Rotated all Supabase API keys (service_role + anon) | ✅ Complete | 2026-04-06 |
| 5 | Disabled legacy API keys | ✅ Complete | 2026-04-06 |
| 6 | Redeployed edge function with whitelist | ✅ Complete | 2026-04-06 |
| 7 | Verified whitelist blocking via edge function logs | ✅ Complete | 2026-04-06 |
| 8 | Reduced excessive polling traffic (85% reduction) | ✅ Complete | 2026-04-06 |

---

## 6. Remaining Security Hardening (MOB-701 through MOB-709)

| Task | Description | Status |
|------|-------------|--------|
| MOB-701 | Remove hardcoded keys from all scripts | ✅ Complete |
| MOB-702 | Auth-gate `add-admin` edge function | 🔲 Pending |
| MOB-703 | Drop blanket read policies on notifications | 🔲 Pending |
| MOB-704 | Enable RLS on internal financial tables | 🔲 Pending |
| MOB-705 | Implement Zod input validation in admin edge functions | 🔲 Pending |
| MOB-706 | Secure 11 DB functions against search_path injection | 🔲 Pending |
| MOB-707 | Replace plaintext passwords in `pending_confirmations` with pgcrypto | 🔲 Pending |
| MOB-708 | Create public blog view masking author emails | 🔲 Pending |
| MOB-709 | Push notification endpoint whitelist | ✅ Complete |

---

## 7. Lessons Learned

1. **Never hardcode secrets** — All API keys must be stored in Supabase Dashboard Secrets or a secure vault, never in source code.
2. **Validate outbound requests** — All edge functions making external HTTP requests must enforce domain whitelists.
3. **Audit polling patterns** — Excessive client-side polling creates unnecessary load and can mask anomalous traffic patterns.
4. **Rotate keys immediately** upon any suspected exposure — do not wait for confirmation of exploitation.
5. **Disable legacy keys** — Always disable previous key versions after rotation.

---

## 8. Post-Incident Monitoring

- [ ] Monitor Supabase edge function logs daily for 30 days for any new blocked endpoint attempts
- [ ] Review Postgres query logs for the exposure window (pre-2026-04-06) for bulk `SELECT` patterns
- [ ] Complete remaining MOB-702 through MOB-708 security tasks within Sprint 10
- [ ] Schedule quarterly secret rotation policy

---

*Report prepared by: Modisa Maphanyane*
*Date: 2026-04-06*
*Classification: Internal — Confidential*

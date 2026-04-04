# MobiRides Bug Report

## Active Bugs

### BUG-002: Security Vulnerabilities — MOB-700 Series

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-04 |
| **Severity** | Critical / High / Medium / Low (9 findings) |
| **Status** | 🔴 Open |
| **Affects** | RLS policies, edge functions, credentials, password storage |
| **Plan** | [`docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md`](./hotfixes/SECURITY_REMEDIATION_2026_04_04.md) |

**Description:**  
Security scan identified 9 actionable findings: hardcoded secrets in scripts, unauthenticated admin creation endpoint, blanket notification access, missing RLS on financial tables, no input validation on edge functions, mutable search_path on 11 functions, plaintext password storage, exposed author emails, and missing leaked-password protection.

**Tickets:** MOB-701 through MOB-709. See linked plan for full breakdown with acceptance criteria, consumer searches, migration SQL, and phased execution order.

---

### BUG-003: `notification_type__old_version_to_be_dropped` Dependency Error

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-04 |
| **Severity** | Critical (blocks `supabase db pull`) |
| **Status** | 🔴 Open |
| **Affects** | Shadow DB replay — `20260319212624_remote_schema.sql`, `20260328135949_remote_schema.sql` |
| **Plan** | [`docs/hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md`](./hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md) |

**Description:**  
`supabase db pull` fails with `SQLSTATE 2BP01` — 7 functions still reference the old `notification_type` enum via their parameter signatures, blocking the `DROP TYPE` statement. A redundant enum rename block in the second `remote_schema.sql` compounds the issue.

**Tickets:** MOB-801, MOB-802. See linked plan for SQL fixes, impact assessment, and execution order.

---

## Resolved Bugs

### BUG-001 — `create_handover_notification` Return Type Conflict
Resolved 2026-03-28. See `docs/hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md`.

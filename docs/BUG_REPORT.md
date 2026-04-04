# MobiRides Bug Report

## Active Bugs

### BUG-001: `create_handover_notification` Return Type Conflict

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-03-27 |
| **Severity** | High |
| **Status** | ✅ Resolved — 2026-03-28 |
| **Affects** | Database schema sync (`supabase db pull`) |
| **Error Code** | `SQLSTATE 42P13` |

**Description:**  
Production has **two overloads** of `public.create_handover_notification` with conflicting return types, causing `supabase db pull` to fail:

1. **Legacy 4-arg version** `(uuid, uuid, text, text)` → returns `void`  
   - Origin: migration `20250130000021`
   - Status: **Unused** — no callers found in the current codebase
2. **Current 8-arg version** `(uuid, text, text, text, text, text, text, integer)` → returns `bigint`  
   - Status: Active, used by handover notification logic

**Error Message:**
```
ERROR: cannot change return type of existing function (SQLSTATE 42P13)

At statement: 1033

CREATE OR REPLACE FUNCTION public.create_handover_notification(...)
 RETURNS bigint
```

**Root Cause:**  
Postgres does not allow `CREATE OR REPLACE FUNCTION` to change a function's return type. When `db pull` replays the schema, the legacy `void`-returning 4-arg overload exists first, and the newer `bigint`-returning version triggers the conflict.

**Impact:**
- Blocks `supabase db pull` from completing
- Prevents Supabase type regeneration (`supabase gen types`)
- Does **not** affect runtime behavior — the 8-arg function works correctly in production

**Fix:**  
Create a migration that drops the legacy 4-arg overload:

```sql
DROP FUNCTION IF EXISTS public.create_handover_notification(uuid, uuid, text, text);
```

The 8-arg `bigint`-returning function remains untouched.

**Related Notes:**
- The `NOTICE: index "user_roles_user_id_role_unique" does not exist, skipping` message that appears during `db pull` is **harmless** and unrelated to this bug.

---

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

## Resolved Bugs

### BUG-001 — `create_handover_notification` Return Type Conflict
Resolved 2026-03-28. See `docs/hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md`.

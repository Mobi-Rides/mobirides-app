

# Update Documentation: BUG-004 (Outbound Traffic / SSRF Incident) + Security Fix Status

## Overview

Log the Supabase Security incident as **BUG-004** in `BUG_REPORT.md`, update Sprint 10 to reflect MOB-701 partial completion and the new SSRF fix, and add the incident + remediation to the Week 2 April status report.

## Changes

### 1. `docs/BUG_REPORT.md`

**Add BUG-004** between BUG-003 and Resolved Bugs:

| Field | Value |
|-------|-------|
| **ID** | BUG-004 |
| **Title** | Outbound SSRF Traffic via `send-push-notification` |
| **Date Reported** | 2026-04-06 |
| **Severity** | Critical |
| **Status** | ✅ Resolved |
| **Description** | Supabase Security flagged outbound scanning traffic to `vip.66591.vip/.env.test`. Root cause: attacker used leaked `service_role` key to invoke `send-push-notification` with a malicious `subscription.endpoint`. |
| **Fix Applied** | Deleted 16 scripts with hardcoded keys (9 on Apr 5, 7 on Apr 6), removed `SUPABASE_SERVICE_ROLE_KEY` from `.env`, added SSRF domain whitelist to `send-push-notification/index.ts`, keys rotated in Supabase Dashboard. |

**Update BUG-002 status**: Change from `🔴 Open` to `🟡 In Progress` — MOB-701 (hardcoded secrets) is now partially complete (scripts deleted, keys rotated; remaining: verify no other files contain secrets).

### 2. `docs/Product Status/SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md`

**S10-003 (MOB-701)** — line 483: Change `❌ Not Started` → `🟡 In Progress` with note: "16 scripts deleted, `.env` cleaned, keys rotated (2026-04-06). Remaining: final `grep` verification + credential rotation confirmation."

**Add new ticket S10-022** after S10-021:

| Field | Value |
|-------|-------|
| **Ticket** | S10-022 / MOB-710 |
| **Owner** | Arnold |
| **Priority** | P0 — Done |
| **Summary** | Add SSRF endpoint validation to `send-push-notification` |
| **Status** | ✅ Done (2026-04-06) |

**Update completion table** (lines 503-511): Arnold completed = 1 (S10-022), in progress = 1 (S10-003). Total tickets = 22.

**Update executive summary table** (line 17): Security Hardening current from `10%` → `25%`.

### 3. `docs/Product Status/WEEK_2_APRIL_2026_STATUS_REPORT.md`

**Executive Summary** (line 26): Add sentence about the Supabase Security incident response.

**Key Achievements** (after line 41): Add 3 new bullet points:
- ✅ **SSRF protection shipped** — Domain whitelist added to `send-push-notification/index.ts` (BUG-004)
- ✅ **16 compromised scripts deleted** — All hardcoded `service_role` and `anon` keys removed from codebase
- ✅ **`.env` secured** — `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN` removed

**Critical Issues** (line 47): Update BUG-002 line to note MOB-701 is now in progress.

**Bug Count Rollup table** (line 101): Add BUG-004 row (Critical, ✅ Resolved, SSRF outbound traffic).

**Completed Tasks table** (after line 155): Add 3 rows:
- SSRF endpoint whitelist in `send-push-notification` | 2026-04-06 | Modisa | Blocks malicious outbound scanning
- 16 scripts with hardcoded keys deleted | 2026-04-06 | Modisa | Eliminates credential exposure
- `.env` service role key removed | 2026-04-06 | Modisa | Prevents plaintext secret in source

**Remaining Tasks** (line 175): Update MOB-701 to "In Progress" with note about remaining verification.

**Security Vulnerabilities metric** (line 65): Change from `9` to `7` (2 addressed: hardcoded keys partially fixed + SSRF fixed).

**Known Bugs count** (line 68): Change from `~4` to `~4` but add note "(BUG-004 resolved same period)".

**Security Hardening epic** (line 212): Change from `10%` → `25%`, status from `🔴 Planned` → `🟡 In Progress`.

**New Planning Documents table** (after line 276): No new docs needed — BUG-004 is logged inline (resolved same day).

### 4. Remaining MOB-700 Security Tasks (no changes needed — already tracked)

These stay as-is in Sprint 10:
- **MOB-702**: Auth-gate `add-admin` — S10-004
- **MOB-703**: Drop blanket notifications policy — S10-005
- **MOB-704**: RLS on financial tables — S10-006
- **MOB-705**: Zod validation on edge functions — S10-007
- **MOB-706**: Fix `search_path` on 11 functions — S10-008
- **MOB-707–709**: In P2 backlog (password hashing, author emails, leaked-password protection)

## Files Modified

| File | Change Type |
|------|------------|
| `docs/BUG_REPORT.md` | Add BUG-004, update BUG-002 status |
| `docs/Product Status/SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md` | Update S10-003 status, add S10-022, update completion table |
| `docs/Product Status/WEEK_2_APRIL_2026_STATUS_REPORT.md` | Add incident to achievements, bugs, completed tasks, metrics |

No code changes. No migrations. Documentation-only updates across 3 files.


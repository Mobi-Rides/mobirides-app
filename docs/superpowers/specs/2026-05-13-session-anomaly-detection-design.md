# Session Anomaly Detection — Design Spec
**Reference:** `docs/plans/20260423_SUPERADMIN_CORE_LOGIC_REMEDIATION_PLAN.md` (T2.1 / SAR-002)
**Date:** 2026-05-13
**Status:** Approved

---

## Overview

Implement a server-side session anomaly detection engine covering all platform users (renters, hosts, admins). The engine captures login events via a Supabase Edge Function, enriches them with geolocation data, runs three detection algorithms (Impossible Travel, Concurrent Countries, Brute Force), and flags anomalies for SuperAdmin review. High-confidence anomalies auto-suspend the account after 6 hours if not reviewed. Immediate in-app notifications alert SuperAdmins on each new HIGH-confidence flag.

---

## Requirements Traceability

| Plan Requirement | Implementation |
|---|---|
| Background worker analyzing sessions | `session-monitor` Edge Function called on every login |
| Impossible Travel detection | Algorithm: distance ÷ time_diff > 900 km/h → HIGH |
| Concurrent multi-country IP sessions | 2+ countries in 4h window per user → HIGH or MEDIUM |
| Brute-force attempt monitoring | `profiles.failed_login_attempts` ≥ 10 in 1h → HIGH |
| Auto-trigger `suspend_user` for high-confidence anomalies | pg_cron every 15 min; suspend after 6h unreviewed |
| Surface "Session Risks" in SuperAdmin Security Dashboard | New tab in `AdminSecurityPanel.tsx` |

---

## Architecture

```
User signs in (any platform)
      │
      ▼
onAuthStateChange('SIGNED_IN') — frontend
      │
      ▼
session-monitor Edge Function
      │
      ├─► Extract client IP from x-forwarded-for header (server-side)
      ├─► ip-api.com → { country, countryCode, city, lat, lon }
      ├─► INSERT user_login_events
      │
      ├─► Run detection algorithms:
      │     ├─ Impossible Travel   (compare with previous login)
      │     ├─ Concurrent Countries (logins in last 4h from 2+ countries)
      │     └─ Brute Force         (profiles.failed_login_attempts ≥ 10)
      │
      └─► If anomaly found:
            ├─ INSERT session_anomalies (confidence: HIGH | MEDIUM)
            ├─ If HIGH → set auto_suspend_after = now() + 6h
            └─ If HIGH → notify all super_admins (existing notification system)

pg_cron (every 15 minutes)
      │
      └─► SELECT from session_anomalies
            WHERE status = 'pending'
              AND auto_suspend_after < now()
            → call suspend_user(user_id, reason, NULL) — indefinite
            → UPDATE status = 'auto_suspended'
            → notify super_admins: "User auto-suspended: <email>"

Frontend: /admin/security
      └─► "Session Risks" tab in AdminSecurityPanel.tsx
            ├─ Stats: pending / expiring-soon / dismissed / auto-suspended
            ├─ Anomaly table with Suspend Now / Dismiss per row
            └─ Countdown timer for HIGH-confidence pending flags
```

---

## Section 1: Database Layer

### Table: `user_login_events`

```sql
CREATE TABLE public.user_login_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address    inet,
  country_code  text,
  country       text,
  city          text,
  lat           numeric(9,6),
  lon           numeric(9,6),
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_login_events_user_id_created ON public.user_login_events(user_id, created_at DESC);
```

RLS: Service role INSERT only. SuperAdmin SELECT only.

### Table: `session_anomalies`

```sql
CREATE TABLE public.session_anomalies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_type           text NOT NULL CHECK (risk_type IN ('impossible_travel','concurrent_countries','brute_force')),
  confidence          text NOT NULL CHECK (confidence IN ('low','medium','high')),
  details             jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','reviewed','auto_suspended','dismissed')),
  reviewed_by         uuid REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  auto_suspend_after  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_anomalies_status ON public.session_anomalies(status, auto_suspend_after);
CREATE INDEX idx_session_anomalies_user_id ON public.session_anomalies(user_id, created_at DESC);
```

RLS: SuperAdmin SELECT, UPDATE (status, reviewed_by, reviewed_at). Service role INSERT, UPDATE.

### pg_cron Job

```sql
SELECT cron.schedule(
  'session-anomaly-auto-suspend',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/session-monitor',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{"action":"process_auto_suspensions"}'::jsonb
    );
  $$
);
```

---

## Section 2: Edge Function (`session-monitor`)

**Location:** `supabase/functions/session-monitor/index.ts`

### Actions

The function handles two POST actions via `body.action`:

#### Action: `"log_login"` (called by frontend on every sign-in)

**Request:**
```
POST /functions/v1/session-monitor
Authorization: Bearer <user_jwt>
Body: { "action": "log_login", "user_agent": "..." }
```

**Pipeline:**
1. Verify JWT via `supabase.auth.getUser(token)` — reject if invalid
2. Extract IP from `x-forwarded-for` or `x-real-ip` request header
3. Call `ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon` — skip geo gracefully if fails
4. `INSERT INTO user_login_events (user_id, ip_address, country_code, country, city, lat, lon, user_agent)`
5. Run all three detection algorithms for this user (see Section 3)
6. For each detected anomaly: INSERT into `session_anomalies`
7. For each HIGH-confidence anomaly: notify super_admins via existing notification system
8. Return `{ success: true }`

#### Action: `"process_auto_suspensions"` (called by pg_cron, service role only)

**Pipeline:**
1. Verify token === `SUPABASE_SERVICE_ROLE_KEY` — reject otherwise
2. Query `session_anomalies` WHERE `status = 'pending'` AND `auto_suspend_after < now()`
3. For each: call `suspend_user(user_id, 'Auto-suspended: unreviewed security anomaly', NULL)`
4. UPDATE `session_anomalies SET status = 'auto_suspended'`
5. Notify all super_admins of each auto-suspension

#### Action: `"update_anomaly"` (called by SuperAdmin dashboard)

**Request:**
```
POST /functions/v1/session-monitor
Authorization: Bearer <superadmin_jwt>
Body: { "action": "update_anomaly", "anomaly_id": "...", "verdict": "suspend" | "dismiss" }
```

**Pipeline:**
1. Verify JWT and confirm actor has `role = 'super_admin'`
2. If `verdict = "suspend"` → call `suspend_user(user_id, 'Manually suspended: security anomaly review', '30 days')`, then UPDATE `status = 'reviewed'`
3. If `verdict = "dismiss"` → UPDATE `status = 'dismissed'` (no suspension)
4. Always set `reviewed_by = actor_id, reviewed_at = now()`
5. Return `{ success: true }`

---

## Section 3: Detection Algorithms

All algorithms run inside the `log_login` pipeline using the service role Supabase client.

### Algorithm 1 — Impossible Travel

```
Inputs: current login (lat, lon, created_at), previous login for same user
```

1. Fetch the most recent `user_login_events` row for `user_id` before the current one
2. If either login has no lat/lon → skip (no geo data available)
3. Compute great-circle distance in km using Haversine formula
4. Compute `time_diff_minutes = (current.created_at - previous.created_at) / 60`
5. If `time_diff_minutes < 1` → skip (duplicate/refresh, not a travel event)
6. Compute `speed_kmh = distance_km / (time_diff_minutes / 60)`
7. Thresholds:
   - `speed_kmh > 1800` (2× commercial flight) → confidence = **HIGH**
   - `speed_kmh > 900` (commercial flight) → confidence = **MEDIUM**
   - Below 900 → no flag

**details jsonb:**
```json
{
  "from_country": "ZA", "to_country": "GB",
  "distance_km": 9423, "time_diff_minutes": 18,
  "speed_kmh": 31410,
  "from_ip": "41.x.x.x", "to_ip": "85.x.x.x"
}
```

### Algorithm 2 — Concurrent Countries

```
Inputs: current login country_code, all logins for same user in last 4 hours
```

1. Query `user_login_events` WHERE `user_id = $1` AND `created_at > now() - interval '4 hours'`
2. Collect distinct `country_code` values (include current login)
3. If distinct countries ≤ 1 → no flag
4. Thresholds:
   - Countries from different continents → confidence = **HIGH**
   - Countries from same continent/region → confidence = **MEDIUM**
5. Continent mapping: hardcoded lookup by country code (AF, EU, AS, NA, SA, OC)

**details jsonb:**
```json
{
  "countries": ["ZA", "US"],
  "window_hours": 4,
  "login_count": 3,
  "continents": ["AF", "NA"]
}
```

### Algorithm 3 — Brute Force

```
Inputs: user_id from current login
```

1. Query `profiles WHERE id = user_id` for `failed_login_attempts` and `last_login_attempt`
2. If `failed_login_attempts >= 10`
   AND `last_login_attempt > now() - interval '1 hour'` → confidence = **HIGH**
3. Reset `failed_login_attempts = 0` on successful login is handled by Supabase Auth natively — only flag if the CURRENT login succeeded after many failures

**details jsonb:**
```json
{
  "failed_attempts": 14,
  "window_minutes": 60
}
```

### Deduplication

Before inserting a new anomaly, check if a `pending` anomaly of the same `risk_type` for the same `user_id` already exists within the last 24 hours. If so, skip — do not create duplicates.

---

## Section 4: Frontend

### New File: `src/components/admin/SessionRisksTab.tsx`

Single responsibility: render the Session Risks tab content.

- **Stats row**: 4 cards — Pending, Expiring Soon (<1h), Dismissed (7d), Auto-suspended (7d)
- **Anomaly table** columns: User (email + role), Risk Type badge, Confidence badge, Details, Auto-suspend countdown, Actions
- **Actions per row**:
  - HIGH pending: `Suspend Now` (red) + `Dismiss` (gray)
  - MEDIUM pending: `Suspend` (indigo) + `Dismiss` (gray)
  - Reviewed/dismissed/auto-suspended: read-only status badge
- **Countdown**: for HIGH pending flags, show time remaining to auto-suspend in `Xh Ym` format, red when <1h
- **Data**: `useQuery` on `session_anomalies` joined with `profiles` (email via auth admin RPC)
- **Mutations**: call `session-monitor` Edge Function `update_anomaly` action

### Modified File: `src/components/admin/AdminSecurityPanel.tsx`

Add a fourth tab "Session Risks" with red badge count of pending anomalies:

```tsx
<TabsTrigger value="risks">
  Session Risks {pendingCount > 0 && <Badge variant="destructive">{pendingCount}</Badge>}
</TabsTrigger>
<TabsContent value="risks">
  <SessionRisksTab />
</TabsContent>
```

### New File: `src/utils/sessionMonitor.ts`

Thin utility called after auth state change:

```ts
export async function reportLogin(session: Session): Promise<void>
```

- Called from the app's auth state change handler on `SIGNED_IN` event
- POSTs `{ action: "log_login", user_agent: navigator.userAgent }` to `session-monitor` Edge Function with the user JWT
- Fires and forgets (does not block the login flow)
- Silently swallows errors (never breaks auth)

### Wiring

In the app's existing auth provider / `onAuthStateChange` listener:
```ts
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    reportLogin(session); // fire-and-forget
  }
});
```

---

## Error Handling

| Failure | Behaviour |
|---|---|
| ip-api.com unreachable | Store login event with null geo fields; skip geo-dependent algorithms |
| ip-api.com rate limit (45 req/min) | Same as above — graceful degradation, no retry |
| `session-monitor` unreachable from frontend | Silent failure — never breaks login flow |
| `process_auto_suspensions` fails mid-batch | Each user is processed independently; partial success is fine |
| `suspend_user` RPC fails for a user | Log error, continue with next anomaly; do not mark as auto_suspended |
| Duplicate anomaly detection | Pre-insert deduplication check prevents duplicate flags per 24h window |

---

## Out of Scope

- VPN / Tor exit-node detection (requires paid IP intelligence feed)
- Device fingerprinting (requires browser SDK)
- Per-user travel history / "known locations" allowlist
- Slack alerting (deferred to T3.1)
- Anomaly detection for API key / service-role calls

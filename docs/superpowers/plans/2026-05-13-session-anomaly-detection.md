# Session Anomaly Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement server-side session anomaly detection covering Impossible Travel, Concurrent Countries, and Brute Force detection, with auto-suspension of unreviewed HIGH-confidence flags and a SuperAdmin Session Risks dashboard tab.

**Architecture:** Frontend fires a fire-and-forget POST to `session-monitor` Edge Function on every `SIGNED_IN` event. The Edge Function extracts the client IP server-side, geo-enriches it, inserts a login event, runs three detection algorithms, and flags anomalies. A pg_cron job runs every 15 minutes to auto-suspend unreviewed HIGH-confidence flags after 6 hours.

**Tech Stack:** Supabase Edge Function (Deno/TypeScript), Supabase PostgreSQL (migrations, RLS, pg_cron), ip-api.com (geo), React/TypeScript (frontend tab), TanStack Query, Shadcn UI components.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260513000000_session_anomaly_detection.sql` | Create | Tables, indexes, RLS, pg_cron |
| `supabase/functions/session-monitor/index.ts` | Create | Edge Function: log_login, process_auto_suspensions, update_anomaly |
| `src/utils/sessionMonitor.ts` | Create | Thin fire-and-forget frontend wrapper |
| `src/hooks/useAuth.tsx` | Modify | Wire `reportLogin` into `SIGNED_IN` handler |
| `src/components/admin/SessionRisksTab.tsx` | Create | Session Risks tab content |
| `src/components/admin/AdminSecurityPanel.tsx` | Modify | Add fourth "Session Risks" tab |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260513000000_session_anomaly_detection.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260513000000_session_anomaly_detection.sql
-- T2.1: Session Anomaly Detection
-- Creates user_login_events, session_anomalies tables and pg_cron auto-suspend job.

BEGIN;

-- ── user_login_events ─────────────────────────────────────────────────────────
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

CREATE INDEX idx_user_login_events_user_id_created
  ON public.user_login_events(user_id, created_at DESC);

ALTER TABLE public.user_login_events ENABLE ROW LEVEL SECURITY;

-- Service role only INSERT (edge function uses service role client)
CREATE POLICY "service_role_insert_login_events"
  ON public.user_login_events FOR INSERT TO service_role
  WITH CHECK (true);

-- SuperAdmins can SELECT
CREATE POLICY "superadmins_read_login_events"
  ON public.user_login_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ── session_anomalies ─────────────────────────────────────────────────────────
CREATE TABLE public.session_anomalies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_type           text NOT NULL CHECK (
    risk_type IN ('impossible_travel','concurrent_countries','brute_force')
  ),
  confidence          text NOT NULL CHECK (confidence IN ('low','medium','high')),
  details             jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','reviewed','auto_suspended','dismissed')
  ),
  reviewed_by         uuid REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  auto_suspend_after  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_anomalies_status
  ON public.session_anomalies(status, auto_suspend_after);

CREATE INDEX idx_session_anomalies_user_id
  ON public.session_anomalies(user_id, created_at DESC);

ALTER TABLE public.session_anomalies ENABLE ROW LEVEL SECURITY;

-- SuperAdmins SELECT + UPDATE (for review actions via dashboard)
CREATE POLICY "superadmins_read_session_anomalies"
  ON public.session_anomalies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "superadmins_update_session_anomalies"
  ON public.session_anomalies FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Service role full access (edge function auto-suspend pipeline)
CREATE POLICY "service_role_manage_session_anomalies"
  ON public.session_anomalies FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── pg_cron auto-suspend job (runs every 15 minutes) ─────────────────────────
-- Calls session-monitor edge function with action=process_auto_suspensions
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

COMMIT;
```

- [ ] **Step 2: Apply migration locally and verify**

```bash
npx supabase db push
```

Expected: `Applying migration 20260513000000_session_anomaly_detection.sql... done`

Verify tables exist:
```bash
npx supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('user_login_events','session_anomalies');"
```

Expected output: 2 rows — `user_login_events` and `session_anomalies`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260513000000_session_anomaly_detection.sql
git commit -m "feat(T2.1): add user_login_events + session_anomalies tables with RLS and pg_cron"
```

---

## Task 2: `session-monitor` Edge Function

**Files:**
- Create: `supabase/functions/session-monitor/index.ts`

- [ ] **Step 1: Create the edge function directory and file**

```bash
mkdir -p supabase/functions/session-monitor
```

- [ ] **Step 2: Write `index.ts`**

The function handles three POST actions: `log_login`, `process_auto_suspensions`, `update_anomaly`.

```typescript
// supabase/functions/session-monitor/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { getRequiredSecret } from "../_shared/secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Continent lookup by ISO 3166-1 alpha-2 country code
const CONTINENT_MAP: Record<string, string> = {
  AF: "AF", DZ: "AF", AO: "AF", BJ: "AF", BW: "AF", BF: "AF", BI: "AF",
  CM: "AF", CV: "AF", CF: "AF", TD: "AF", KM: "AF", CG: "AF", CD: "AF",
  DJ: "AF", EG: "AF", GQ: "AF", ER: "AF", ET: "AF", GA: "AF", GM: "AF",
  GH: "AF", GN: "AF", GW: "AF", CI: "AF", KE: "AF", LS: "AF", LR: "AF",
  LY: "AF", MG: "AF", MW: "AF", ML: "AF", MR: "AF", MU: "AF", MA: "AF",
  MZ: "AF", NA: "AF", NE: "AF", NG: "AF", RW: "AF", ST: "AF", SN: "AF",
  SL: "AF", SO: "AF", ZA: "AF", SS: "AF", SD: "AF", SZ: "AF", TZ: "AF",
  TG: "AF", TN: "AF", UG: "AF", ZM: "AF", ZW: "AF",
  AG: "NA", BS: "NA", BB: "NA", BZ: "NA", CA: "NA", CR: "NA", CU: "NA",
  DM: "NA", DO: "NA", SV: "NA", GD: "NA", GT: "NA", HT: "NA", HN: "NA",
  JM: "NA", MX: "NA", NI: "NA", PA: "NA", KN: "NA", LC: "NA", VC: "NA",
  TT: "NA", US: "NA",
  AR: "SA", BO: "SA", BR: "SA", CL: "SA", CO: "SA", EC: "SA", GY: "SA",
  PY: "SA", PE: "SA", SR: "SA", UY: "SA", VE: "SA",
  AL: "EU", AD: "EU", AT: "EU", BY: "EU", BE: "EU", BA: "EU", BG: "EU",
  HR: "EU", CY: "EU", CZ: "EU", DK: "EU", EE: "EU", FI: "EU", FR: "EU",
  DE: "EU", GR: "EU", HU: "EU", IS: "EU", IE: "EU", IT: "EU", XK: "EU",
  LV: "EU", LI: "EU", LT: "EU", LU: "EU", MT: "EU", MD: "EU", MC: "EU",
  ME: "EU", NL: "EU", MK: "EU", NO: "EU", PL: "EU", PT: "EU", RO: "EU",
  RU: "EU", SM: "EU", RS: "EU", SK: "EU", SI: "EU", ES: "EU", SE: "EU",
  CH: "EU", UA: "EU", GB: "EU", VA: "EU",
  AF: "AS", AM: "AS", AZ: "AS", BH: "AS", BD: "AS", BT: "AS", BN: "AS",
  KH: "AS", CN: "AS", GE: "AS", IN: "AS", ID: "AS", IR: "AS", IQ: "AS",
  IL: "AS", JP: "AS", JO: "AS", KZ: "AS", KW: "AS", KG: "AS", LA: "AS",
  LB: "AS", MY: "AS", MV: "AS", MN: "AS", MM: "AS", NP: "AS", KP: "AS",
  OM: "AS", PK: "AS", PS: "AS", PH: "AS", QA: "AS", SA: "AS", SG: "AS",
  KR: "AS", LK: "AS", SY: "AS", TW: "AS", TJ: "AS", TH: "AS", TL: "AS",
  TR: "AS", TM: "AS", AE: "AS", UZ: "AS", VN: "AS", YE: "AS",
  AU: "OC", FJ: "OC", KI: "OC", MH: "OC", FM: "OC", NR: "OC", NZ: "OC",
  PW: "OC", PG: "OC", WS: "OC", SB: "OC", TO: "OC", TV: "OC", VU: "OC",
};

function getContinent(countryCode: string): string {
  return CONTINENT_MAP[countryCode] ?? "UNKNOWN";
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GeoData {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
}

async function fetchGeo(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return { country: data.country, countryCode: data.countryCode, city: data.city, lat: data.lat, lon: data.lon };
  } catch {
    return null;
  }
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = getRequiredSecret("SUPABASE_URL");
  const SERVICE_ROLE_KEY = getRequiredSecret("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = getRequiredSecret("SUPABASE_ANON_KEY");

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const action = body.action as string;

  // ── action: log_login ────────────────────────────────────────────────────────
  if (action === "log_login") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = extractIp(req);
    const geo = ip ? await fetchGeo(ip) : null;
    const userAgent = (body.user_agent as string | undefined) ?? null;

    const { data: loginEvent, error: insertError } = await supabaseAdmin
      .from("user_login_events")
      .insert({
        user_id: user.id,
        ip_address: ip,
        country_code: geo?.countryCode ?? null,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        lat: geo?.lat ?? null,
        lon: geo?.lon ?? null,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert login event:", insertError.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run detection algorithms (parallel)
    const [impossibleTravel, concurrentCountries, bruteForce] = await Promise.all([
      detectImpossibleTravel(supabaseAdmin, user.id, loginEvent),
      detectConcurrentCountries(supabaseAdmin, user.id, loginEvent),
      detectBruteForce(supabaseAdmin, user.id),
    ]);

    const anomalies = [impossibleTravel, concurrentCountries, bruteForce].filter(Boolean) as AnomalyResult[];

    for (const anomaly of anomalies) {
      // Deduplication: skip if same risk_type pending in last 24h
      const { data: existing } = await supabaseAdmin
        .from("session_anomalies")
        .select("id")
        .eq("user_id", user.id)
        .eq("risk_type", anomaly.risk_type)
        .eq("status", "pending")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existing) continue;

      const autoSuspendAfter =
        anomaly.confidence === "high"
          ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
          : null;

      await supabaseAdmin.from("session_anomalies").insert({
        user_id: user.id,
        risk_type: anomaly.risk_type,
        confidence: anomaly.confidence,
        details: anomaly.details,
        auto_suspend_after: autoSuspendAfter,
      });

      if (anomaly.confidence === "high") {
        await notifySuperAdmins(
          supabaseAdmin,
          `Security alert: HIGH-confidence ${anomaly.risk_type.replace(/_/g, " ")} detected for user. Auto-suspend in 6 hours if unreviewed.`
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── action: process_auto_suspensions ─────────────────────────────────────────
  if (action === "process_auto_suspensions") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (token !== SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: due, error } = await supabaseAdmin
      .from("session_anomalies")
      .select("id, user_id")
      .eq("status", "pending")
      .lt("auto_suspend_after", new Date().toISOString());

    if (error) {
      console.error("Failed to query due anomalies:", error.message);
      return new Response(JSON.stringify({ success: false }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const anomaly of due ?? []) {
      try {
        // Ban indefinitely via Auth admin API
        const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(
          anomaly.user_id,
          { ban_duration: "876000h" } // ~100 years = indefinite
        );

        if (banErr) {
          console.error(`Failed to ban user ${anomaly.user_id}:`, banErr.message);
          continue;
        }

        await supabaseAdmin
          .from("session_anomalies")
          .update({ status: "auto_suspended" })
          .eq("id", anomaly.id);

        // Fetch user email for notification
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", anomaly.user_id)
          .maybeSingle();

        const emailHint = profile?.email ?? anomaly.user_id;
        await notifySuperAdmins(
          supabaseAdmin,
          `User auto-suspended (unreviewed security anomaly): ${emailHint}`
        );
      } catch (err) {
        console.error(`Exception processing anomaly ${anomaly.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: due?.length ?? 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── action: update_anomaly ────────────────────────────────────────────────────
  if (action === "update_anomaly") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify super_admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "super_admin" && profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anomalyId = body.anomaly_id as string;
    const verdict = body.verdict as "suspend" | "dismiss";

    if (!anomalyId || !["suspend", "dismiss"].includes(verdict)) {
      return new Response(JSON.stringify({ error: "Invalid anomaly_id or verdict" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: anomaly } = await supabaseAdmin
      .from("session_anomalies")
      .select("user_id")
      .eq("id", anomalyId)
      .single();

    if (!anomaly) {
      return new Response(JSON.stringify({ error: "Anomaly not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (verdict === "suspend") {
      // 30-day suspension
      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(
        anomaly.user_id,
        { ban_duration: "720h" } // 30 days
      );

      if (banErr) {
        console.error("Failed to suspend user:", banErr.message);
        return new Response(JSON.stringify({ error: "Failed to suspend user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    await supabaseAdmin
      .from("session_anomalies")
      .update({
        status: "reviewed",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", anomalyId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// ── Detection algorithms ───────────────────────────────────────────────────────

interface LoginEvent {
  user_id: string;
  ip_address: string | null;
  country_code: string | null;
  lat: number | null;
  lon: number | null;
  created_at: string;
}

interface AnomalyResult {
  risk_type: "impossible_travel" | "concurrent_countries" | "brute_force";
  confidence: "low" | "medium" | "high";
  details: Record<string, unknown>;
}

async function detectImpossibleTravel(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  current: LoginEvent
): Promise<AnomalyResult | null> {
  if (current.lat === null || current.lon === null) return null;

  const { data: rows } = await supabase
    .from("user_login_events")
    .select("lat, lon, country_code, ip_address, created_at")
    .eq("user_id", userId)
    .lt("created_at", current.created_at)
    .order("created_at", { ascending: false })
    .limit(1);

  const prev = rows?.[0];
  if (!prev || prev.lat === null || prev.lon === null) return null;

  const distanceKm = haversineKm(prev.lat, prev.lon, current.lat, current.lon);
  const timeDiffMinutes =
    (new Date(current.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000;

  if (timeDiffMinutes < 1) return null;

  const speedKmh = distanceKm / (timeDiffMinutes / 60);

  if (speedKmh <= 900) return null;

  return {
    risk_type: "impossible_travel",
    confidence: speedKmh > 1800 ? "high" : "medium",
    details: {
      from_country: prev.country_code,
      to_country: current.country_code,
      distance_km: Math.round(distanceKm),
      time_diff_minutes: Math.round(timeDiffMinutes),
      speed_kmh: Math.round(speedKmh),
      from_ip: prev.ip_address,
      to_ip: current.ip_address,
    },
  };
}

async function detectConcurrentCountries(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  current: LoginEvent
): Promise<AnomalyResult | null> {
  const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("user_login_events")
    .select("country_code, created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  const allCodes = [
    ...(rows ?? []).map((r: { country_code: string | null }) => r.country_code),
    current.country_code,
  ].filter(Boolean) as string[];

  const distinctCountries = [...new Set(allCodes)];
  if (distinctCountries.length <= 1) return null;

  const continents = [...new Set(distinctCountries.map(getContinent))];
  const crossContinent = continents.length > 1 && !continents.includes("UNKNOWN");

  return {
    risk_type: "concurrent_countries",
    confidence: crossContinent ? "high" : "medium",
    details: {
      countries: distinctCountries,
      window_hours: 4,
      login_count: (rows?.length ?? 0) + 1,
      continents,
    },
  };
}

async function detectBruteForce(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<AnomalyResult | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("failed_login_attempts, last_login_attempt")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;
  if ((profile.failed_login_attempts ?? 0) < 10) return null;

  const windowStart = new Date(Date.now() - 60 * 60 * 1000);
  if (!profile.last_login_attempt || new Date(profile.last_login_attempt) < windowStart) return null;

  return {
    risk_type: "brute_force",
    confidence: "high",
    details: {
      failed_attempts: profile.failed_login_attempts,
      window_minutes: 60,
    },
  };
}

async function notifySuperAdmins(
  supabase: ReturnType<typeof createClient>,
  message: string
): Promise<void> {
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "super_admin");

  if (!admins?.length) return;

  const notifications = admins.map((a: { id: string }) => ({
    user_id: a.id,
    type: "security_alert",
    content: message,
  }));

  await supabase.from("notifications").insert(notifications);
}
```

- [ ] **Step 3: Deploy the edge function**

```bash
npx supabase functions deploy session-monitor --no-verify-jwt
```

Expected: `Deployed session-monitor`

- [ ] **Step 4: Smoke-test the deployed function**

```bash
# Replace with real values
SUPABASE_URL="https://<project>.supabase.co"
SERVICE_KEY="<service_role_key>"

curl -X POST "$SUPABASE_URL/functions/v1/session-monitor" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"process_auto_suspensions"}'
```

Expected: `{"success":true,"processed":0}` (no anomalies yet)

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/session-monitor/index.ts
git commit -m "feat(T2.1): add session-monitor edge function with detection algorithms"
```

---

## Task 3: Frontend `sessionMonitor.ts` Utility + Auth Wiring

**Files:**
- Create: `src/utils/sessionMonitor.ts`
- Modify: `src/hooks/useAuth.tsx`

- [ ] **Step 1: Write `sessionMonitor.ts`**

```typescript
// src/utils/sessionMonitor.ts
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function reportLogin(session: Session): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    await fetch(`${supabaseUrl}/functions/v1/session-monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "log_login",
        user_agent: navigator.userAgent,
      }),
    });
  } catch {
    // Never break login flow
  }
}
```

- [ ] **Step 2: Wire `reportLogin` into `useAuth.tsx`**

Open `src/hooks/useAuth.tsx`. Find the `onAuthStateChange` handler (around line 59). It already handles `SIGNED_IN`:

```typescript
if (currentSession?.user && event === 'SIGNED_IN') {
  console.log('Sign-in detected, executing pending actions with session ID:', currentSession.access_token.substring(0, 10));
  AuthTriggerService.executePendingAction(currentSession.access_token);
}
```

Add the `reportLogin` call immediately after `AuthTriggerService.executePendingAction(...)`:

```typescript
// Add import at top of file:
import { reportLogin } from "@/utils/sessionMonitor";

// Inside the SIGNED_IN block — add after executePendingAction:
if (currentSession?.user && event === 'SIGNED_IN') {
  console.log('Sign-in detected, executing pending actions with session ID:', currentSession.access_token.substring(0, 10));
  AuthTriggerService.executePendingAction(currentSession.access_token);
  reportLogin(currentSession); // fire-and-forget — never blocks login
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/sessionMonitor.ts src/hooks/useAuth.tsx
git commit -m "feat(T2.1): add sessionMonitor utility and wire into auth SIGNED_IN handler"
```

---

## Task 4: `SessionRisksTab.tsx` Component

**Files:**
- Create: `src/components/admin/SessionRisksTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/admin/SessionRisksTab.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

interface SessionAnomaly {
  id: string;
  user_id: string;
  risk_type: "impossible_travel" | "concurrent_countries" | "brute_force";
  confidence: "low" | "medium" | "high";
  details: Record<string, unknown>;
  status: "pending" | "reviewed" | "auto_suspended" | "dismissed";
  auto_suspend_after: string | null;
  created_at: string;
  profiles: { email: string; role: string } | null;
}

function formatCountdown(autoSuspendAfter: string): string {
  const totalMinutes = differenceInMinutes(new Date(autoSuspendAfter), new Date());
  if (totalMinutes <= 0) return "Imminent";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function RiskTypeBadge({ type }: { type: SessionAnomaly["risk_type"] }) {
  const label = {
    impossible_travel: "Impossible Travel",
    concurrent_countries: "Concurrent Countries",
    brute_force: "Brute Force",
  }[type];

  return (
    <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs whitespace-nowrap">
      {label}
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: SessionAnomaly["confidence"] }) {
  const classes = {
    high: "bg-red-600 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-gray-400 text-white",
  }[confidence];

  return (
    <Badge className={`${classes} text-xs uppercase`}>{confidence}</Badge>
  );
}

function AnomalyDetails({ anomaly }: { anomaly: SessionAnomaly }) {
  const d = anomaly.details;
  if (anomaly.risk_type === "impossible_travel") {
    return (
      <span className="text-xs text-muted-foreground">
        {String(d.from_country)} → {String(d.to_country)}<br />
        {String(d.distance_km)} km in {String(d.time_diff_minutes)} min
      </span>
    );
  }
  if (anomaly.risk_type === "concurrent_countries") {
    const countries = (d.countries as string[]).join(" + ");
    return (
      <span className="text-xs text-muted-foreground">
        {countries}<br />
        within {String(d.window_hours)}h window
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {String(d.failed_attempts)} failed attempts in {String(d.window_minutes)} min
    </span>
  );
}

export function SessionRisksTab() {
  const queryClient = useQueryClient();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { data: anomalies = [], isLoading } = useQuery<SessionAnomaly[]>({
    queryKey: ["session_anomalies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_anomalies")
        .select(`
          id, user_id, risk_type, confidence, details, status,
          auto_suspend_after, created_at,
          profiles!inner(email, role)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as SessionAnomaly[];
    },
    refetchInterval: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ anomalyId, verdict }: { anomalyId: string; verdict: "suspend" | "dismiss" }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/session-monitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({ action: "update_anomaly", anomaly_id: anomalyId, verdict }),
      });
      if (!res.ok) throw new Error("Failed to update anomaly");
    },
    onSuccess: (_, { verdict }) => {
      toast.success(verdict === "suspend" ? "User suspended" : "Anomaly dismissed");
      queryClient.invalidateQueries({ queryKey: ["session_anomalies"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const pending = anomalies.filter((a) => a.status === "pending");
  const expiringSoon = pending.filter(
    (a) => a.auto_suspend_after && differenceInMinutes(new Date(a.auto_suspend_after), now) < 60
  );
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dismissed7d = anomalies.filter(
    (a) => a.status === "dismissed" && a.created_at >= sevenDaysAgo
  );
  const autoSuspended7d = anomalies.filter(
    (a) => a.status === "auto_suspended" && a.created_at >= sevenDaysAgo
  );

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading session risks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Auto-suspend &lt;1h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoon.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3 text-green-500" />
              Dismissed (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dismissed7d.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-purple-500" />
              Auto-suspended (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{autoSuspended7d.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.2fr] bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground gap-2">
          <div>User</div>
          <div>Risk Type</div>
          <div>Confidence</div>
          <div>Details</div>
          <div>Auto-suspend in</div>
          <div>Actions</div>
        </div>

        {anomalies.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">No anomalies detected</div>
        )}

        {anomalies.map((anomaly) => {
          const isPending = anomaly.status === "pending";
          const isHigh = anomaly.confidence === "high";
          const isCritical =
            isPending &&
            anomaly.auto_suspend_after &&
            differenceInMinutes(new Date(anomaly.auto_suspend_after), now) < 60;

          return (
            <div
              key={anomaly.id}
              className={`grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1.2fr] px-3 py-2.5 border-t text-sm items-center gap-2 ${isCritical ? "bg-red-50" : ""}`}
            >
              <div>
                <div className="font-medium text-xs">{anomaly.profiles?.email ?? anomaly.user_id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground capitalize">{anomaly.profiles?.role}</div>
              </div>
              <div><RiskTypeBadge type={anomaly.risk_type} /></div>
              <div><ConfidenceBadge confidence={anomaly.confidence} /></div>
              <div><AnomalyDetails anomaly={anomaly} /></div>
              <div>
                {isPending && anomaly.auto_suspend_after ? (
                  <span className={`text-xs font-semibold ${isCritical ? "text-red-600" : "text-muted-foreground"}`}>
                    {formatCountdown(anomaly.auto_suspend_after)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex gap-1.5">
                {isPending ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-xs px-2"
                      onClick={() => updateMutation.mutate({ anomalyId: anomaly.id, verdict: "suspend" })}
                      disabled={updateMutation.isPending}
                    >
                      {isHigh ? "Suspend" : "Suspend"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => updateMutation.mutate({ anomalyId: anomaly.id, verdict: "dismiss" })}
                      disabled={updateMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-xs capitalize">{anomaly.status.replace("_", " ")}</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        HIGH confidence anomalies auto-suspend after 6 hours if not reviewed. MEDIUM confidence requires manual action only.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/SessionRisksTab.tsx
git commit -m "feat(T2.1): add SessionRisksTab component with anomaly table and countdown"
```

---

## Task 5: Wire `SessionRisksTab` into `AdminSecurityPanel.tsx`

**Files:**
- Modify: `src/components/admin/AdminSecurityPanel.tsx`

The current `AdminSecurityPanel` is a plain `div`-based layout. We need to wrap it in a tab structure and add the Session Risks tab. The existing content becomes the first tab.

- [ ] **Step 1: Rewrite `AdminSecurityPanel.tsx` to use tabs**

```tsx
// src/components/admin/AdminSecurityPanel.tsx
import React from "react";
import { Shield, Activity, Clock, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { SessionRisksTab } from "./SessionRisksTab";

export const AdminSecurityPanel = () => {
  const { isSuperAdmin } = useIsAdmin();
  const { sessions, isLoading: sessionsLoading, cleanupExpiredSessions } = useAdminSession();
  const { logs, isLoading: logsLoading } = useAdminActivityLog();

  const activeSessions = sessions.filter((s) => s.is_active);
  const recentActivity = logs.slice(0, 5);

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ["session_anomalies_pending_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("session_anomalies")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Security Center</h2>
          <p className="text-muted-foreground">Monitor admin sessions and security activity</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={cleanupExpiredSessions} variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Cleanup Sessions
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="risks" className="relative">
            Session Risks
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0 h-4">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions.length}</div>
                <p className="text-xs text-muted-foreground">Currently active admin sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentActivity.length}</div>
                <p className="text-xs text-muted-foreground">Actions in the last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8h</div>
                <p className="text-xs text-muted-foreground">Maximum session timeout</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className={pendingCount > 0 ? "bg-amber-500" : "bg-green-500"}>
                    {pendingCount > 0 ? `${pendingCount} Risk${pendingCount > 1 ? "s" : ""}` : "Secure"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Admin Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-4">Loading sessions...</div>
              ) : activeSessions.length > 0 ? (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Session {session.id.slice(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(session.created_at))} ago
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last activity: {formatDistanceToNow(new Date(session.last_activity))} ago
                        </div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No active sessions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-4">Loading activity...</div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 border rounded">
                      <div className="flex-shrink-0">
                        {log.action.includes("created") && <Users className="h-4 w-4 text-green-500" />}
                        {log.action.includes("updated") && <Activity className="h-4 w-4 text-blue-500" />}
                        {log.action.includes("deleted") && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {!["created", "updated", "deleted"].some((a) => log.action.includes(a)) && (
                          <Shield className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{log.action}</div>
                        {log.resource_type && (
                          <div className="text-xs text-muted-foreground">
                            {log.resource_type} {log.resource_id?.slice(0, 8)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at))} ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <SessionRisksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build and verify no runtime errors**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminSecurityPanel.tsx
git commit -m "feat(T2.1): add Session Risks tab to AdminSecurityPanel with pending badge"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| `user_login_events` table with all fields, indexes, RLS | Task 1 |
| `session_anomalies` table with all fields, indexes, RLS | Task 1 |
| pg_cron every 15 min → `process_auto_suspensions` | Task 1 |
| Edge Function `log_login`: JWT verify, IP extraction, geo, INSERT, algorithms | Task 2 |
| Edge Function `process_auto_suspensions`: service-role gate, batch suspend, notify | Task 2 |
| Edge Function `update_anomaly`: super_admin gate, suspend/dismiss verdicts | Task 2 |
| Impossible Travel algorithm (Haversine, 900/1800 km/h thresholds) | Task 2 |
| Concurrent Countries algorithm (4h window, continent cross-check) | Task 2 |
| Brute Force algorithm (`failed_login_attempts >= 10` in 1h) | Task 2 |
| Deduplication (skip pending same risk_type within 24h) | Task 2 |
| HIGH anomaly → `auto_suspend_after = now() + 6h` | Task 2 |
| HIGH anomaly → notify all super_admins | Task 2 |
| Auto-suspend → notify super_admins | Task 2 |
| `sessionMonitor.ts` fire-and-forget utility | Task 3 |
| Auth `onAuthStateChange('SIGNED_IN')` wiring | Task 3 |
| `SessionRisksTab.tsx` stats (pending, expiring-soon, dismissed, auto-suspended) | Task 4 |
| Anomaly table with all columns, actions, countdown | Task 4 |
| `AdminSecurityPanel.tsx` with fourth "Session Risks" tab + red badge count | Task 5 |
| Graceful degradation if ip-api.com fails | Task 2 (geo returns null, skip geo algorithms) |
| Silent failure if `session-monitor` unreachable from frontend | Task 3 (try/catch swallows) |

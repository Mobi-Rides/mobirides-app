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
  // Africa
  DZ: "AF", AO: "AF", BJ: "AF", BW: "AF", BF: "AF", BI: "AF", CM: "AF",
  CV: "AF", CF: "AF", TD: "AF", KM: "AF", CG: "AF", CD: "AF", DJ: "AF",
  EG: "AF", GQ: "AF", ER: "AF", ET: "AF", GA: "AF", GM: "AF", GH: "AF",
  GN: "AF", GW: "AF", CI: "AF", KE: "AF", LS: "AF", LR: "AF", LY: "AF",
  MG: "AF", MW: "AF", ML: "AF", MR: "AF", MU: "AF", MA: "AF", MZ: "AF",
  NA: "AF", NE: "AF", NG: "AF", RW: "AF", ST: "AF", SN: "AF", SL: "AF",
  SO: "AF", ZA: "AF", SS: "AF", SD: "AF", SZ: "AF", TZ: "AF", TG: "AF",
  TN: "AF", UG: "AF", ZM: "AF", ZW: "AF",
  // North America
  AG: "NA", BS: "NA", BB: "NA", BZ: "NA", CA: "NA", CR: "NA", CU: "NA",
  DM: "NA", DO: "NA", SV: "NA", GD: "NA", GT: "NA", HT: "NA", HN: "NA",
  JM: "NA", MX: "NA", NI: "NA", PA: "NA", KN: "NA", LC: "NA", VC: "NA",
  TT: "NA", US: "NA",
  // South America
  AR: "SA", BO: "SA", BR: "SA", CL: "SA", CO: "SA", EC: "SA", GY: "SA",
  PY: "SA", PE: "SA", SR: "SA", UY: "SA", VE: "SA",
  // Europe
  AL: "EU", AD: "EU", AT: "EU", BY: "EU", BE: "EU", BA: "EU", BG: "EU",
  HR: "EU", CY: "EU", CZ: "EU", DK: "EU", EE: "EU", FI: "EU", FR: "EU",
  DE: "EU", GR: "EU", HU: "EU", IS: "EU", IE: "EU", IT: "EU", XK: "EU",
  LV: "EU", LI: "EU", LT: "EU", LU: "EU", MT: "EU", MD: "EU", MC: "EU",
  ME: "EU", NL: "EU", MK: "EU", NO: "EU", PL: "EU", PT: "EU", RO: "EU",
  RU: "EU", SM: "EU", RS: "EU", SK: "EU", SI: "EU", ES: "EU", SE: "EU",
  CH: "EU", UA: "EU", GB: "EU", VA: "EU",
  // Asia
  AM: "AS", AZ: "AS", BH: "AS", BD: "AS", BT: "AS", BN: "AS", KH: "AS",
  CN: "AS", GE: "AS", IN: "AS", ID: "AS", IR: "AS", IQ: "AS", IL: "AS",
  JP: "AS", JO: "AS", KZ: "AS", KW: "AS", KG: "AS", LA: "AS", LB: "AS",
  MY: "AS", MV: "AS", MN: "AS", MM: "AS", NP: "AS", KP: "AS", OM: "AS",
  PK: "AS", PS: "AS", PH: "AS", QA: "AS", SA: "AS", SG: "AS", KR: "AS",
  LK: "AS", SY: "AS", TW: "AS", TJ: "AS", TH: "AS", TL: "AS", TR: "AS",
  TM: "AS", AE: "AS", UZ: "AS", VN: "AS", YE: "AS",
  // Oceania
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

type SupabaseClient = ReturnType<typeof createClient>;

async function detectImpossibleTravel(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
  userId: string,
  current: LoginEvent
): Promise<AnomalyResult | null> {
  const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("user_login_events")
    .select("country_code")
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
      login_count: (rows?.length ?? 0) + (current.country_code ? 1 : 0),
      continents,
    },
  };
}

async function detectBruteForce(
  supabase: SupabaseClient,
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

async function notifySuperAdmins(supabase: SupabaseClient, message: string): Promise<void> {
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

  const { error: notifyErr } = await supabase.from("notifications").insert(notifications);
  if (notifyErr) {
    console.error("Failed to insert security notifications:", notifyErr.message);
  }
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
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const action = body.action as string;

  // ── action: log_login ────────────────────────────────────────────────────────
  if (action === "log_login") {
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    if (insertError || !loginEvent) {
      console.error("Failed to insert login event:", insertError?.message);
      return new Response(JSON.stringify({ success: false, error: "Failed to record login event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [impossibleTravel, concurrentCountries, bruteForce] = await Promise.all([
      detectImpossibleTravel(supabaseAdmin, user.id, loginEvent as LoginEvent),
      detectConcurrentCountries(supabaseAdmin, user.id, loginEvent as LoginEvent),
      detectBruteForce(supabaseAdmin, user.id),
    ]);

    const anomalies = [impossibleTravel, concurrentCountries, bruteForce].filter(
      Boolean
    ) as AnomalyResult[];

    for (const anomaly of anomalies) {
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
          `Security alert: HIGH-confidence ${anomaly.risk_type.replace(/_/g, " ")} detected. Auto-suspend in 6 hours if unreviewed.`
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── action: process_auto_suspensions ─────────────────────────────────────────
  if (action === "process_auto_suspensions") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (token !== SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const anomaly of due ?? []) {
      try {
        const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(
          anomaly.user_id,
          { ban_duration: "876000h" }
        );

        if (banErr) {
          console.error(`Failed to ban user ${anomaly.user_id}:`, banErr.message);
          continue;
        }

        const { error: suspendUpdateErr } = await supabaseAdmin
          .from("session_anomalies")
          .update({ status: "auto_suspended" })
          .eq("id", anomaly.id);
        if (suspendUpdateErr) {
          console.error(`Failed to update anomaly ${anomaly.id} status:`, suspendUpdateErr.message);
        }

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

    return new Response(
      JSON.stringify({ success: true, processed: due?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "super_admin" && profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anomalyId = body.anomaly_id as string;
    const verdict = body.verdict as "suspend" | "dismiss";

    if (!anomalyId || !["suspend", "dismiss"].includes(verdict)) {
      return new Response(JSON.stringify({ error: "Invalid anomaly_id or verdict" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: anomaly } = await supabaseAdmin
      .from("session_anomalies")
      .select("user_id")
      .eq("id", anomalyId)
      .single();

    if (!anomaly) {
      return new Response(JSON.stringify({ error: "Anomaly not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (verdict === "suspend") {
      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(
        anomaly.user_id,
        { ban_duration: "720h" }
      );

      if (banErr) {
        console.error("Failed to suspend user:", banErr.message);
        return new Response(JSON.stringify({ error: "Failed to suspend user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("session_anomalies")
      .update({
        status: verdict === "suspend" ? "reviewed" : "dismissed",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", anomalyId);

    if (updateErr) {
      console.error("Failed to update anomaly status:", updateErr.message);
      return new Response(JSON.stringify({ error: "Failed to update anomaly" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

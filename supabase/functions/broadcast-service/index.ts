import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const BroadcastRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    broadcast_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("send").default("send"),
    audience: z.enum(["all", "renters", "hosts", "verified", "active_30d"]),
    channel: z.enum(["email", "push", "both"]),
    subject: z.string().min(1),
    message: z.string().min(1),
    cta_text: z.string().optional(),
    cta_url: z.string().url().optional(),
    scheduled_at: z.string().datetime().optional(),
  }),
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Build Supabase admin client (service role — bypasses RLS for reads)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Validate JWT and get calling user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

  // Confirm caller is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return jsonResponse({ error: "Forbidden: super_admin required" }, 403);
  }

  // Parse + validate payload
  let body: unknown;
  try { body = await req.json(); } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const parsed = BroadcastRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid payload", details: parsed.error.format() }, 400);
  }
  const payload = parsed.data;

  // ---------------------------------------------------------------------------
  // CANCEL action
  // ---------------------------------------------------------------------------
  if (payload.action === "cancel") {
    const { error } = await supabase
      .from("system_broadcasts")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", payload.broadcast_id)
      .in("status", ["pending", "scheduled"]);

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true, action: "cancelled", broadcast_id: payload.broadcast_id });
  }

  // ---------------------------------------------------------------------------
  // SEND / SCHEDULE action
  // ---------------------------------------------------------------------------

  // --- Rate limit check: 1 broadcast per 60 min globally ---
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("system_broadcasts")
    .select("id, sent_at")
    .gte("sent_at", oneHourAgo)
    .in("status", ["sending", "completed"])
    .limit(1);

  if (recent && recent.length > 0) {
    const sentAt = new Date(recent[0].sent_at).getTime();
    const minutesLeft = Math.ceil((sentAt + 60 * 60 * 1000 - Date.now()) / 60000);
    return jsonResponse({
      error: `Rate limit: 1 broadcast per hour. Try again in ~${minutesLeft} minute(s).`,
      rateLimited: true,
    }, 429);
  }

  // --- Build audience query ---
  let query = supabase.from("profiles").select("id, email, role");
  if (payload.audience === "renters") query = query.eq("role", "renter");
  else if (payload.audience === "hosts") query = query.eq("role", "host");
  else if (payload.audience === "verified") query = query.eq("is_verified", true);
  else if (payload.audience === "active_30d") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("last_active_at", thirtyDaysAgo);
  }

  const { data: recipients, error: recipientError } = await query;
  if (recipientError) return jsonResponse({ error: recipientError.message }, 500);

  const recipientCount = recipients?.length ?? 0;

  // --- Insert broadcast record ---
  const isScheduled = payload.scheduled_at && new Date(payload.scheduled_at) > new Date();
  const broadcastStatus = isScheduled ? "scheduled" : "pending";

  const { data: broadcast, error: insertError } = await supabase
    .from("system_broadcasts")
    .insert({
      created_by: user.id,
      status: broadcastStatus,
      audience: payload.audience,
      channel: payload.channel,
      subject: payload.subject,
      message: payload.message,
      cta_text: payload.cta_text ?? null,
      cta_url: payload.cta_url ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      recipient_count: recipientCount,
    })
    .select()
    .single();

  if (insertError) return jsonResponse({ error: insertError.message }, 500);

  // If scheduled for the future, return early
  if (isScheduled) {
    return jsonResponse({
      success: true,
      broadcast_id: broadcast.id,
      status: "scheduled",
      scheduled_at: payload.scheduled_at,
      recipient_count: recipientCount,
    });
  }

  // --- Mark as sending ---
  await supabase
    .from("system_broadcasts")
    .update({ status: "sending", sent_at: new Date().toISOString() })
    .eq("id", broadcast.id);

  // --- Dispatch ---
  const BATCH_SIZE = 100;
  let deliveryCount = 0;
  let failureCount = 0;
  const logs: { broadcast_id: string; user_id: string; channel: string; status: string; error_message?: string }[] = [];

  const sendEmail = async (recipientId: string, email: string) => {
    try {
      const res = await supabase.functions.invoke("resend-service", {
        body: {
          to: email,
          templateId: "system-notification",
          dynamicData: {
            subject: payload.subject,
            message: payload.message,
            cta_text: payload.cta_text,
            cta_url: payload.cta_url,
          },
        },
      });
      const ok = !res.error && res.data?.success;
      logs.push({ broadcast_id: broadcast.id, user_id: recipientId, channel: "email", status: ok ? "sent" : "failed", error_message: ok ? undefined : res.error?.message });
      return ok;
    } catch (e) {
      logs.push({ broadcast_id: broadcast.id, user_id: recipientId, channel: "email", status: "failed", error_message: String(e) });
      return false;
    }
  };

  const sendPush = async (recipientId: string) => {
    try {
      const res = await supabase.functions.invoke("send-push-notification", {
        body: {
          userId: recipientId,
          payload: { title: payload.subject, body: payload.message, url: payload.cta_url || "/" },
        },
      });
      const ok = !res.error && res.data?.success;
      logs.push({ broadcast_id: broadcast.id, user_id: recipientId, channel: "push", status: ok ? "sent" : "failed", error_message: ok ? undefined : res.error?.message });
      return ok;
    } catch (e) {
      logs.push({ broadcast_id: broadcast.id, user_id: recipientId, channel: "push", status: "failed", error_message: String(e) });
      return false;
    }
  };

  // Process in batches
  for (let i = 0; i < recipientCount; i += BATCH_SIZE) {
    const batch = (recipients ?? []).slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (r: { id: string; email: string }) => {
      const results: boolean[] = [];

      if (payload.channel === "email" || payload.channel === "both") {
        if (r.email) results.push(await sendEmail(r.id, r.email));
      }
      if (payload.channel === "push" || payload.channel === "both") {
        results.push(await sendPush(r.id));
      }

      const success = results.every(Boolean);
      if (success) deliveryCount++; else failureCount++;
    }));

    // Flush audit logs in batches
    if (logs.length >= BATCH_SIZE) {
      await supabase.from("system_broadcast_logs").insert(logs.splice(0, logs.length));
    }
  }

  // Flush remaining logs
  if (logs.length > 0) {
    await supabase.from("system_broadcast_logs").insert(logs);
  }

  // --- Mark completed ---
  await supabase
    .from("system_broadcasts")
    .update({
      status: failureCount === recipientCount ? "failed" : "completed",
      completed_at: new Date().toISOString(),
      delivery_count: deliveryCount,
      failure_count: failureCount,
    })
    .eq("id", broadcast.id);

  return jsonResponse({
    success: true,
    broadcast_id: broadcast.id,
    status: "completed",
    recipient_count: recipientCount,
    delivery_count: deliveryCount,
    failure_count: failureCount,
  });
});

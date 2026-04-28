/// <reference lib="deno.ns" />
// S9-009 / MOB-132: Refactored bulk-delete-users with anonymize + soft-delete
// Per docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md Phase 2

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DeleteResult {
  userId: string;
  success: boolean;
  error?: string;
}

interface BulkDeleteRequest {
  userIds: string[];
  reason: string;
}

/**
 * Anonymize and soft-delete a single user.
 * - Hard-deletes PII tables
 * - Anonymizes text in analytics tables (keeps data for reporting)
 * - Soft-deletes profile (is_deleted = true)
 * - Hard-deletes auth.users last
 */
async function anonymizeAndDeleteUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  adminId: string,
  reason: string
): Promise<DeleteResult> {
  try {
    // Guard: don't delete admins/super_admins
    const { data: adminRecord } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (adminRecord) {
      return { userId, success: false, error: "Cannot delete admin or super_admin users" };
    }

    // Get full_name for audit log
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    // ── Step 1: Hard-delete PII tables ────────────────────────────────────────
    const piiTables = [
      { table: "conversation_messages",    col: "sender_id" },
      { table: "conversation_participants", col: "user_id" },
      { table: "conversations",            col: "created_by" },
      { table: "notifications",            col: "user_id" },
      { table: "saved_cars",               col: "user_id" },
      { table: "user_verifications",       col: "user_id" },
      { table: "license_verifications",    col: "user_id" },
      { table: "user_restrictions",        col: "user_id" },
      { table: "user_roles",               col: "user_id" },
      { table: "documents",                col: "user_id" },
      { table: "push_subscriptions",       col: "user_id" },
    ];

    for (const { table, col } of piiTables) {
      await supabaseAdmin.from(table).delete().eq(col, userId);
    }

    // ── Step 2: Anonymize analytics tables (keep for reporting) ───────────────
    // Reviews — scrub text, keep ratings
    await supabaseAdmin
      .from("reviews")
      .update({ comment: "[removed]" })
      .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);

    // Cars — scrub description/location, keep brand/model/type/price/year
    const { data: userCars } = await supabaseAdmin
      .from("cars")
      .select("id")
      .eq("owner_id", userId);

    if (userCars?.length) {
      const carIds = userCars.map((c: { id: string }) => c.id);
      await supabaseAdmin
        .from("cars")
        .update({ description: "[removed]", location: "[removed]" })
        .in("id", carIds);
      // Delete car images (PII — photos)
      await supabaseAdmin.from("car_images").delete().in("car_id", carIds);
    }

    // Preserve untouched: bookings, wallet_transactions, payment_transactions,
    // host_wallets, insurance_claims (analytics / financial audit trail)

    // ── Step 3: Soft-delete profile ───────────────────────────────────────────
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: "Deleted User",
        avatar_url: null,
        phone_number: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: adminId,
      })
      .eq("id", userId);

    // ── Step 4: Hard-delete auth user ─────────────────────────────────────────
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      // Fallback: ban for 100 years if delete fails due to constraints
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    }

    // ── Step 5: Audit log ─────────────────────────────────────────────────────
    await supabaseAdmin.rpc("log_audit_event", {
      p_event_type: "user_deleted",
      p_severity: "critical",
      p_actor_id: adminId,
      p_target_id: userId,
      p_resource_type: "user",
      p_resource_id: userId,
      p_reason: reason,
      p_action_details: {
        user_name: profile?.full_name ?? "Unknown",
        deletion_type: "bulk_anonymize_delete",
      },
    }).catch(() => {}); // non-critical

    return { userId, success: true };

  } catch (err) {
    return { userId, success: false, error: (err as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    // Admin check
    const { data: adminRecord } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!adminRecord) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    // Parse body
    let body: BulkDeleteRequest;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: corsHeaders });
    }

    const { userIds, reason } = body;
    if (!userIds?.length) return new Response(JSON.stringify({ error: "userIds required" }), { status: 400, headers: corsHeaders });
    if (!reason?.trim()) return new Response(JSON.stringify({ error: "reason required" }), { status: 400, headers: corsHeaders });

    // Process each user — log and continue on failure (don't abort batch)
    const results: DeleteResult[] = [];
    for (const userId of userIds) {
      const result = await anonymizeAndDeleteUser(supabaseAdmin, userId, user.id, reason);
      results.push(result);
      console.log(`User ${userId}: ${result.success ? "anonymized+deleted" : `failed — ${result.error}`}`);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ success: true, summary: { total: userIds.length, successful, failed }, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Bulk delete error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});

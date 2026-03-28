/// <reference lib="deno.ns" />
// S9-015 / MOB-806: Unverified-user reminder
// Sends reminder email to users who signed up 7+ days ago but haven't completed verification.
// Invoked daily by pg_cron.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

    // Query users: signed up 7+ days ago, verification not complete, not deleted
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, verification_status, created_at")
      .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not("verification_status", "eq", "completed")
      .eq("is_deleted", false)
      .limit(100);

    if (error) throw error;

    if (!users?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No unverified users found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get emails from auth.users via admin API
    let sent = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const user of users) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const name = user.full_name || "MobiRides User";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "MobiRides <noreply@mobirides.com>",
            to: [email],
            subject: "Complete your MobiRides verification",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h2 style="color:#f97316">Hi ${name},</h2>
                <p>You signed up for MobiRides but haven't completed your identity verification yet.</p>
                <p>Verification is required to rent or list vehicles on the platform.</p>
                <div style="text-align:center;margin:30px 0">
                  <a href="https://app.mobirides.com/verification"
                     style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">
                    Complete Verification
                  </a>
                </div>
                <p style="color:#666;font-size:14px">It only takes a few minutes. If you need help, contact <a href="mailto:support@mobirides.com">support@mobirides.com</a>.</p>
                <p style="color:#666;font-size:14px">— The MobiRides Team</p>
              </div>
            `
          })
        });

        if (res.ok) {
          sent++;
        } else {
          const err = await res.json();
          errors.push({ userId: user.id, error: err?.message ?? "Resend error" });
        }
      } catch (e) {
        errors.push({ userId: user.id, error: (e as Error).message });
      }
    }

    console.log(`[unverified-reminder] Sent ${sent}/${users.length} emails`);

    return new Response(
      JSON.stringify({ success: true, total: users.length, sent, errors: errors.length ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[unverified-reminder] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

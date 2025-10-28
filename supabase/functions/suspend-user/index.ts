import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, restrictionType, reason, duration, durationValue } = await req.json();

    if (!userId || !restrictionType || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, restrictionType, reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUser = data.user;

    // Check if user is admin using the is_admin function
    const { data: isAdminRaw, error: adminCheckError } = await supabase
      .rpc('is_admin', { user_uuid: requestingUser.id });

    if (adminCheckError) {
      console.error("Error calling is_admin RPC:", adminCheckError);
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize RPC result
    let isAdmin = false;
    try {
      if (Array.isArray(isAdminRaw)) {
        const first = isAdminRaw[0];
        if (typeof first === 'boolean') isAdmin = first;
        else if (first && typeof first === 'object') {
          isAdmin = !!(first.is_admin ?? first.exists ?? Object.values(first)[0]);
        } else {
          isAdmin = !!first;
        }
      } else if (typeof isAdminRaw === 'object' && isAdminRaw !== null) {
        isAdmin = !!(isAdminRaw.is_admin ?? isAdminRaw.exists ?? Object.values(isAdminRaw)[0]);
      } else {
        isAdmin = !!isAdminRaw;
      }
    } catch (e) {
      console.error("Failed to normalize is_admin RPC result:", e, isAdminRaw);
      isAdmin = false;
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate ban duration for Supabase Auth
    let banDuration: string | undefined;
    if (restrictionType === "suspend") {
      // For suspend, calculate based on duration
      if (duration === "permanent") {
        banDuration = undefined; // Permanent ban
      } else {
        const now = new Date();
        const expiresAt = new Date(now);

        switch (duration) {
          case "hours":
            expiresAt.setHours(now.getHours() + durationValue);
            break;
          case "days":
            expiresAt.setDate(now.getDate() + durationValue);
            break;
          case "weeks":
            expiresAt.setDate(now.getDate() + durationValue * 7);
            break;
          case "months":
            expiresAt.setMonth(now.getMonth() + durationValue);
            break;
          default:
            return new Response(
              JSON.stringify({ error: "Invalid duration type" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Calculate duration in ISO 8601 format (e.g., "1d", "2h")
        const diffMs = expiresAt.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 1) {
          banDuration = `${diffDays}d`;
        } else {
          banDuration = `${diffHours}h`;
        }
      }
    } else if (restrictionType === "ban") {
      // For ban, always permanent
      banDuration = undefined;
    }

    // Call Supabase Auth admin API to ban/suspend the user
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (banError) {
      console.error("Error banning user:", banError);
      return new Response(
        JSON.stringify({ error: `Failed to ${restrictionType} user: ${banError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate expires_at for our database record
    let expiresAt: string | null = null;
    if (banDuration) {
      const now = new Date();
      if (banDuration.endsWith('d')) {
        const days = parseInt(banDuration.replace('d', ''));
        now.setDate(now.getDate() + days);
      } else if (banDuration.endsWith('h')) {
        const hours = parseInt(banDuration.replace('h', ''));
        now.setHours(now.getHours() + hours);
      }
      expiresAt = now.toISOString();
    }

    // Map frontend restriction types to database enum values
    const restrictionTypeMap = {
      "suspend": "suspension",
      "ban": "login_block"
    };
    
    const dbRestrictionType = restrictionTypeMap[restrictionType] || "login_block";

    // Insert restriction record for tracking
    const { error: restrictionError } = await supabase
      .from("user_restrictions")
      .insert({
        user_id: userId,
        restriction_type: dbRestrictionType,
        reason: reason,
        ends_at: expiresAt,
        created_by: requestingUser.id,
      });

    if (restrictionError) {
      console.error("Error creating restriction record:", restrictionError);
      // Don't fail the whole operation if just the record creation fails
      // The user is already banned in Auth
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${restrictionType} applied successfully`,
        ban_duration: banDuration
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suspend-user function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

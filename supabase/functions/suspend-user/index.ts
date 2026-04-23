import { createClient } from "npm:@supabase/supabase-js@2";
import { getRequiredSecret, isMissingSecretError } from "../_shared/secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let SUPABASE_URL: string;
    let SUPABASE_SERVICE_ROLE_KEY: string;
    let SUPABASE_ANON_KEY: string;

    try {
      SUPABASE_URL = getRequiredSecret("SUPABASE_URL");
      SUPABASE_SERVICE_ROLE_KEY = getRequiredSecret("SUPABASE_SERVICE_ROLE_KEY");
      SUPABASE_ANON_KEY = getRequiredSecret("SUPABASE_ANON_KEY");
    } catch (error) {
      if (!isMissingSecretError(error)) {
        throw error;
      }

      console.error("Missing required Supabase secret for suspend-user");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration", code: "ENV_MISSING" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Create user-scoped client for authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "NO_AUTH_HEADER" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { userId, restrictionType, reason, duration, durationValue } = await req.json();

    if (!userId || !restrictionType || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, restrictionType, reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed in suspend-user");
      return new Response(
        JSON.stringify({ error: "Authentication failed", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin using parameterized RPC and service-role fallbacks
    let isAdmin = false;
    let adminCheckError: any = null;

    // Prefer parameterized RPC with end-user auth context
    const adminRpc = await supabaseUser.rpc('is_admin', { user_uuid: user.id });
    const isAdminRaw: unknown = adminRpc.data;
    adminCheckError = adminRpc.error;

    // Normalize RPC result defensively
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
        const rawObj = isAdminRaw as any;
        isAdmin = !!(rawObj.is_admin ?? rawObj.exists ?? Object.values(rawObj)[0]);
      } else {
        isAdmin = !!isAdminRaw;
      }
    } catch (e) {
      adminCheckError = adminCheckError || e;
      isAdmin = false;
    }

    // Fallback to service-role direct checks if RPC failed or returned false
    if (!isAdmin) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const { data: adminRow } = await supabaseAdmin
          .from('admins')
          .select('is_super_admin')
          .eq('id', user.id)
          .maybeSingle();

        isAdmin = !!(
          (profile && (profile.role === 'admin' || profile.role === 'super_admin')) ||
          adminRow
        );
      } catch (e) {
        console.error("Fallback admin check failed in suspend-user");
        adminCheckError = e;
      }
    }

    if (adminCheckError && !isAdmin) {
      console.error('Admin check failed in suspend-user');
      return new Response(
        JSON.stringify({ error: 'Admin check failed', code: 'ADMIN_CHECK_FAILED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.', code: 'NOT_ADMIN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
              JSON.stringify({ error: "Invalid duration type", code: "INVALID_DURATION_TYPE" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Calculate duration in hours-only format (e.g., "24h") to ensure compatibility
        const diffMs = expiresAt.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        banDuration = `${diffHours}h`;
      }
    } else if (restrictionType === "ban") {
      // For ban, always permanent
      banDuration = undefined;
    }

    // Call Supabase Auth admin API to ban/suspend the user
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (banError) {
      console.error("Failed to update auth restriction in suspend-user");
      return new Response(
        JSON.stringify({ error: `Failed to ${restrictionType} user`, code: "AUTH_ADMIN_UPDATE_FAILED" }),
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
    const restrictionTypeMap: Record<string, string> = {
      "suspend": "suspension",
      "ban": "login_block"
    };
    
    const dbRestrictionType = restrictionTypeMap[restrictionType as string] || "login_block";

    // Insert restriction record for tracking (created_by nullable if no profile)
    const { data: adminProfileRow } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    const { error: restrictionError } = await supabaseAdmin
      .from("user_restrictions")
      .insert({
        user_id: userId,
        restriction_type: dbRestrictionType,
        reason,
        ends_at: expiresAt,
        created_by: adminProfileRow?.id ?? null,
      });

    if (restrictionError) {
      console.error("Failed to create restriction record in suspend-user");
      // Don't fail the whole operation if just the record creation fails
      // The user is already banned in Auth
    }

    // Log the restriction action for audit purposes
    try {
      const { error: auditError } = await supabaseAdmin.rpc('log_audit_event', {
        p_event_type: 'user_restriction_created',
        p_severity: restrictionType === 'ban' ? 'high' : 'medium',
        p_actor_id: user.id,
        p_target_id: userId,
        p_session_id: null,
        p_ip_address: null,
        p_user_agent: null,
        p_location_data: null,
        p_action_details: {
          restrictionType: dbRestrictionType,
          reason,
          duration: banDuration,
          expiresAt
        },
        p_resource_type: 'user',
        p_resource_id: userId,
        p_reason: reason,
        p_anomaly_flags: null,
        p_compliance_tags: ['user-management', 'restriction', restrictionType === 'ban' ? 'ban' : 'suspension']
      });

      if (auditError) {
        console.error("Error logging audit event:", auditError);
        // Don't fail the operation if audit logging fails
      }
    } catch (auditLogError) {
      console.error("Exception during audit logging:", auditLogError);
      // Don't fail the operation if audit logging fails
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
      JSON.stringify({ error: "Unhandled error", code: "UNHANDLED_ERROR", details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

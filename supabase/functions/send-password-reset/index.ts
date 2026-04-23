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

      console.error("Missing required Supabase secret for send-password-reset");
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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed in send-password-reset");
      return new Response(
        JSON.stringify({ error: "Authentication failed", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin using parameterized RPC and service-role fallbacks
    let isAdmin = false;
    let isSuperAdmin = false;
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
    if (isAdmin) {
      try {
        const { data: adminRow } = await supabaseAdmin
          .from('admins')
          .select('is_super_admin')
          .eq('id', user.id)
          .maybeSingle();

        isSuperAdmin = !!(adminRow?.is_super_admin);
      } catch (e) {
        console.error("Super admin check failed in send-password-reset");
        isSuperAdmin = false;
      }
    } else {
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

        isSuperAdmin = !!(adminRow?.is_super_admin);
      } catch (e) {
        console.error("Fallback admin check failed in send-password-reset");
        adminCheckError = e;
      }
    }

    if (adminCheckError && !isAdmin) {
      console.error('Admin check failed in send-password-reset');
      return new Response(
        JSON.stringify({ error: 'Admin check failed', code: 'ADMIN_CHECK_FAILED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions. Super admin access required for password reset.', 
          code: 'NOT_SUPER_ADMIN' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email
    const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !authUserData.user) {
      console.error("Failed to retrieve target user in send-password-reset");
      return new Response(
        JSON.stringify({ error: "Failed to get user data", code: "USER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = authUserData.user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found", code: "NO_EMAIL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate password reset token first
    const appUrl = Deno.env.get('VITE_FRONTEND_URL') || Deno.env.get('APP_URL') || 'http://localhost:8080';

    // Generate password reset link using Supabase admin
    const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${appUrl}/reset-password?redirectedFromEmail=true`,
      }
    });

    if (resetError || !linkData) {
      console.error('Password reset token generation failed in send-password-reset');
      return new Response(
        JSON.stringify({
          error: "Failed to generate password reset token",
          code: "TOKEN_GENERATION_FAILED"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from the generated action_link
    const actionLinkUrl = new URL(linkData.properties.action_link);
    const token = actionLinkUrl.searchParams.get('token');
    
    if (!token) {
      console.error('Failed to extract token in send-password-reset');
      return new Response(
        JSON.stringify({
          error: "Failed to extract reset token",
          code: "TOKEN_EXTRACTION_FAILED"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct the reset URL with the token
    const resetUrl = `${appUrl}/reset-password?token=${token}&redirectedFromEmail=true`;

    // Call the resend-service function to send branded email
    const resendResponse = await fetch(`${SUPABASE_URL}/functions/v1/resend-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to: userEmail,
        templateId: 'password-reset',
        dynamicData: {
          reset_url: resetUrl,
          confirmation_url: resetUrl,
          support_email: Deno.env.get('SUPPORT_EMAIL') || 'support@mobirides.com',
          app_url: appUrl
        }
      })
    });

    if (!resendResponse.ok) {
      console.error('resend-service returned a non-success response');
      return new Response(
        JSON.stringify({
          error: "Failed to send password reset email",
          code: "RESEND_FAILED"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset email dispatched for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unhandled error in send-password-reset");
    return new Response(
      JSON.stringify({ error: "Unhandled error", code: "UNHANDLED_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

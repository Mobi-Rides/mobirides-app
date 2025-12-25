import { createClient } from "npm:@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables", { 
        SUPABASE_URL: !!SUPABASE_URL, 
        SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY 
      });
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: Supabase env missing", code: "ENV_MISSING" }),
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
    if (!authHeader) {
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
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin using parameterized RPC and service-role fallbacks
    let isAdmin = false;
    let isSuperAdmin = false;
    let adminCheckError: any = null;

    console.log("DEBUG: Starting admin verification for user:", user.id);

    // Prefer parameterized RPC with end-user auth context
    const adminRpc = await supabaseUser.rpc('is_admin', { user_uuid: user.id });
    let isAdminRaw: unknown = adminRpc.data;
    adminCheckError = adminRpc.error;

    console.log("DEBUG: Admin RPC result:", { data: isAdminRaw, error: adminCheckError?.message });

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
      console.log("DEBUG: Normalized admin result:", isAdmin);
    } catch (e) {
      // If normalization fails, continue to fallback checks
      console.log("DEBUG: Admin normalization failed:", e);
      adminCheckError = adminCheckError || e;
      isAdmin = false;
    }

    // Fallback to service-role direct checks if RPC failed or returned false
    if (isAdmin) {
      console.log("DEBUG: Admin RPC returned true, checking for super admin");
      try {
        const { data: adminRow } = await supabaseAdmin
          .from('admins')
          .select('is_super_admin')
          .eq('id', user.id)
          .maybeSingle();

        console.log("DEBUG: Super admin check result:", adminRow?.is_super_admin);

        isSuperAdmin = !!(adminRow?.is_super_admin);
        console.log("DEBUG: Final super admin status:", isSuperAdmin);
      } catch (e) {
        console.log("DEBUG: Super admin check failed:", e);
        isSuperAdmin = false;
      }
    } else {
      console.log("DEBUG: Admin RPC returned false, trying fallback checks");
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

        console.log("DEBUG: Fallback check results:", { profile: profile?.role, adminRow: !!adminRow });

        isAdmin = !!(
          (profile && (profile.role === 'admin' || profile.role === 'super_admin')) ||
          adminRow
        );

        isSuperAdmin = !!(adminRow?.is_super_admin);

        console.log("DEBUG: Final admin status after fallback:", { isAdmin, isSuperAdmin });
      } catch (e) {
        console.log("DEBUG: Fallback admin check failed:", e);
        adminCheckError = e;
      }
    }

    if (adminCheckError && !isAdmin) {
      console.error('Admin check failed:', adminCheckError);
      return new Response(
        JSON.stringify({ 
          error: 'Admin check failed', 
          code: 'ADMIN_CHECK_FAILED', 
          details: adminCheckError?.message ?? String(adminCheckError) 
        }),
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
      console.error("Error getting user data:", getUserError);
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
    
    console.log("Generating password reset token for:", userEmail);

    // Generate password reset link using Supabase admin
    const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${appUrl}/reset-password?redirectedFromEmail=true`,
      }
    });

    if (resetError || !linkData) {
      console.error('Supabase token generation error:', resetError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate password reset token",
          code: "TOKEN_GENERATION_FAILED",
          details: resetError?.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from the generated action_link
    const actionLinkUrl = new URL(linkData.properties.action_link);
    const token = actionLinkUrl.searchParams.get('token');
    
    if (!token) {
      console.error('Failed to extract token from action link');
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
    
    console.log("Sending branded password reset email via resend-service for:", userEmail);

    // Call the resend-service function to send branded email
    const resendResponse = await fetch(`${SUPABASE_URL}/functions/v1/resend-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
      const errorText = await resendResponse.text();
      console.error('Resend service error:', errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send password reset email",
          code: "RESEND_FAILED",
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendResult = await resendResponse.json();
    console.log('Branded email sent via resend-service:', resendResult);

    // Log the password reset action
    console.log(`Password reset email sent by super admin ${user.id} for user ${userId} (${userEmail})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
        email: userEmail
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unhandled error", 
        code: "UNHANDLED_ERROR", 
        details: (error as Error).message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DeleteResult {
  userId: string;
  success: boolean;
  error?: string;
  deletedData?: {
    messages: boolean;
    bookings: boolean;
    cars: boolean;
    notifications: boolean;
    profile: boolean;
    authUser: boolean;
  };
}

interface BulkDeleteRequest {
  userIds: string[];
  reason: string;
}

// Helper function to get user's car IDs
async function getUserCarIds(supabaseAdmin: any, userId: string): Promise<string[]> {
  const { data: cars, error } = await supabaseAdmin
    .from("cars")
    .select("id")
    .eq("owner_id", userId);

  if (error) {
    console.error("Error fetching user cars:", error);
    return [];
  }

  return cars?.map((car: any) => car.id) || [];
}

// Helper function to delete a single user
async function deleteUser(
  supabaseAdmin: any,
  userId: string,
  adminId: string,
  reason: string
): Promise<DeleteResult> {
  const deletedData = {
    messages: false,
    bookings: false,
    cars: false,
    notifications: false,
    profile: false,
    authUser: false,
  };

  try {
    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !userProfile) {
      return { userId, success: false, error: "User profile not found" };
    }

    // Prevent deletion of admin or super_admin users
    if (userProfile.role === "admin" || userProfile.role === "super_admin") {
      return { userId, success: false, error: "Cannot delete admin or super_admin users" };
    }

    // 1. Delete conversation messages
    await supabaseAdmin.from("conversation_messages").delete().eq("sender_id", userId);
    deletedData.messages = true;

    // 2. Delete conversation participants
    await supabaseAdmin.from("conversation_participants").delete().eq("user_id", userId);

    // 3. Delete conversations created by user
    await supabaseAdmin.from("conversations").delete().eq("created_by", userId);

    // 4. Delete messages
    await supabaseAdmin.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    // 5. Delete reviews
    await supabaseAdmin.from("reviews").delete().eq("reviewer_id", userId);
    await supabaseAdmin.from("reviews").delete().eq("reviewee_id", userId);

    // 6. Delete notifications
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    deletedData.notifications = true;

    // Get car IDs before deleting bookings
    const carIds = await getUserCarIds(supabaseAdmin, userId);

    // 7. Delete bookings
    await supabaseAdmin.from("bookings").delete().eq("renter_id", userId);
    if (carIds.length > 0) {
      await supabaseAdmin.from("bookings").delete().in("car_id", carIds);
    }
    deletedData.bookings = true;

    // 8. Delete car images first
    if (carIds.length > 0) {
      await supabaseAdmin.from("car_images").delete().in("car_id", carIds);
    }

    // 9. Delete cars
    await supabaseAdmin.from("cars").delete().eq("owner_id", userId);
    deletedData.cars = true;

    // 10. Delete user restrictions
    await supabaseAdmin.from("user_restrictions").delete().eq("user_id", userId);

    // 11. Delete user roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    // 12. Delete user verifications
    await supabaseAdmin.from("user_verifications").delete().eq("user_id", userId);

    // 13. Delete license verifications
    await supabaseAdmin.from("license_verifications").delete().eq("user_id", userId);

    // 14. Delete saved cars
    await supabaseAdmin.from("saved_cars").delete().eq("user_id", userId);

    // 15. Delete host wallet
    await supabaseAdmin.from("host_wallets").delete().eq("host_id", userId);

    // 16. Delete wallet transactions
    await supabaseAdmin.from("wallet_transactions").delete().eq("user_id", userId);

    // 17. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    deletedData.profile = true;

    // 18. Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error(`Error deleting auth user ${userId}:`, authDeleteError);
      return { 
        userId, 
        success: false, 
        error: `Failed to delete auth user: ${authDeleteError.message}`,
        deletedData 
      };
    }
    deletedData.authUser = true;

    // Log to audit
    try {
      await supabaseAdmin.rpc('log_audit_event', {
        p_event_type: 'user_deleted',
        p_severity: 'critical',
        p_actor_id: adminId,
        p_target_id: userId,
        p_resource_type: 'user',
        p_resource_id: userId,
        p_reason: reason,
        p_action_details: { 
          user_name: userProfile.full_name,
          user_role: userProfile.role,
          deletion_type: 'bulk_delete'
        }
      });
    } catch (auditError) {
      console.log("Audit logging skipped:", auditError);
    }

    return { userId, success: true, deletedData };

  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return { 
      userId, 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      deletedData 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration", code: "ENV_MISSING" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "NO_AUTH" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super_admin
    const { data: adminData } = await supabaseAdmin
      .from("admins")
      .select("is_super_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminData?.is_super_admin) {
      return new Response(
        JSON.stringify({ error: "Super admin access required", code: "NOT_SUPER_ADMIN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    let body: BulkDeleteRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body", code: "INVALID_BODY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userIds, reason } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userIds array is required", code: "MISSING_USER_IDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Deletion reason is required", code: "MISSING_REASON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Bulk delete request from ${user.id} for ${userIds.length} users. Reason: ${reason}`);

    // Process deletions
    const results: DeleteResult[] = [];
    for (const userId of userIds) {
      const result = await deleteUser(supabaseAdmin, userId, user.id, reason);
      results.push(result);
      console.log(`User ${userId}: ${result.success ? 'deleted' : 'failed'} - ${result.error || 'success'}`);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Bulk delete complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: userIds.length,
          successful,
          failed,
        },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Bulk delete error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

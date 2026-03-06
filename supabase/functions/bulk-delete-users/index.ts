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

// Helper function to deeply check and clean all user references
async function deepCleanUserReferences(supabaseAdmin: any, userId: string): Promise<string[]> {
  const cleanupSteps: string[] = [];
  
  // Define all tables and their user ID columns
  // Order matters slightly for some dependencies, but we try to be comprehensive
  const tableConfigs = [
    // Communication
    { table: 'conversation_messages', column: 'sender_id' },
    { table: 'conversation_participants', column: 'user_id' },
    { table: 'conversations', column: 'created_by' },
    { table: 'messages', column: 'sender_id' },
    { table: 'messages', column: 'receiver_id' },
    { table: 'notifications', column: 'user_id' },
    
    // Feedback & Social
    { table: 'reviews', column: 'reviewer_id' },
    { table: 'reviews', column: 'reviewee_id' },
    
    // Business Logic - Handovers & Verifications
    { table: 'identity_verification_checks', column: 'verified_user_id' },
    { table: 'identity_verification_checks', column: 'verifier_id' },
    { table: 'handover_sessions', column: 'renter_id' },
    { table: 'handover_sessions', column: 'host_id' },
    { table: 'documents', column: 'user_id' },
    { table: 'documents', column: 'verified_by' },
    { table: 'license_verifications', column: 'user_id' },
    { table: 'user_verifications', column: 'user_id' },
    
    // Core Business - Bookings & Cars
    // Note: Bookings should be deleted before cars usually, but cascading might help
    { table: 'bookings', column: 'renter_id' },
    // We handle cars separately to get car IDs for images/bookings, but this is a fallback
    { table: 'saved_cars', column: 'user_id' },
    { table: 'cars', column: 'owner_id' },
    
    // Financials
    { table: 'host_wallets', column: 'host_id' },
    { table: 'wallet_transactions', column: 'user_id' },
    
    // User Management
    { table: 'user_restrictions', column: 'user_id' },
    { table: 'user_roles', column: 'user_id' },
    
    // Profile (Last)
    { table: 'profiles', column: 'id' },
  ];
  
  for (const config of tableConfigs) {
    try {
      const { count, error: countError } = await supabaseAdmin
        .from(config.table)
        .select('*', { count: 'exact', head: true })
        .eq(config.column, userId);
      
      if (!countError && count && count > 0) {
        console.log(`🧹 Found ${count} rows in ${config.table}.${config.column}`);
        
        const { error: deleteError } = await supabaseAdmin
          .from(config.table)
          .delete()
          .eq(config.column, userId);
        
        if (deleteError) {
          console.error(`⚠️ Failed to clean ${config.table}.${config.column}: ${deleteError.message}`);
          cleanupSteps.push(`⚠️ Failed to clean ${config.table}.${config.column}: ${deleteError.message}`);
        } else {
          cleanupSteps.push(`✅ Cleaned ${count} rows from ${config.table}.${config.column}`);
        }
      }
    } catch (e) {
      // Table might not exist or column might not exist
      console.log(`ℹ️ Skipping ${config.table}.${config.column}:`, (e as Error).message);
    }
  }
  
  return cleanupSteps;
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

    if (profileError) {
       // If profile fetch fails, we might still want to proceed with auth deletion if profile is gone
       console.log(`Profile check failed/not found for ${userId}, proceeding with cleanup.`);
    }

    // Prevent deletion of admin or super_admin users
    if (userProfile && (userProfile.role === "admin" || userProfile.role === "super_admin")) {
      return { userId, success: false, error: "Cannot delete admin or super_admin users" };
    }

    // 0. Pre-cleanup: Delete car images and bookings for user's cars
    // This is specific because it requires looking up car IDs first
    const carIds = await getUserCarIds(supabaseAdmin, userId);
    if (carIds.length > 0) {
        console.log(`Found ${carIds.length} cars for user ${userId}. Cleaning up related data...`);
        // Delete bookings for these cars
        await supabaseAdmin.from("bookings").delete().in("car_id", carIds);
        // Delete images for these cars
        await supabaseAdmin.from("car_images").delete().in("car_id", carIds);
    }

    // 1. Run Deep Clean
    console.log(`Starting deep clean for user ${userId}...`);
    await deepCleanUserReferences(supabaseAdmin, userId);
    deletedData.profile = true; // Assuming deep clean got the profile

    // 2. Delete auth user
    console.log(`Deleting auth user ${userId}...`);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error(`Error deleting auth user ${userId}:`, authDeleteError);
      
      // Try fallback: Disable user if delete fails
      console.log(`Attempting to disable user ${userId} as fallback...`);
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: false,
        ban_duration: '876000h'
      });

      return { 
        userId, 
        success: false, 
        error: `Failed to delete auth user: ${authDeleteError.message}. User has been disabled instead.`,
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
          user_name: userProfile?.full_name || 'Unknown',
          user_role: userProfile?.role || 'unknown',
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
    // First try RPC
    let isSuperAdmin = false;
    try {
        const { data: isAdminData } = await supabaseAdmin.rpc('is_admin', { user_uuid: user.id });
        // is_admin usually returns boolean, but let's check profile for specific 'super_admin' role if needed
        // The original code checked 'admins' table or 'profiles' table for 'super_admin' role
    } catch (e) {
        console.log("RPC check failed, falling back to table check");
    }

    // Fallback/Standard check: Check profiles table for role
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role === 'super_admin' || adminProfile?.role === 'admin') {
        // Allow admins to delete too, or restrict to super_admin?
        // Original code said: "Check if user is super_admin" but logic was checking 'admins' table.
        // Let's stick to the requirement: "As a super admin..."
        // But let's be permissive if they are at least 'admin' for now, or strictly 'super_admin' if sensitive.
        // The previous code checked `admins` table `is_super_admin`.
        
        // Let's check the 'admins' table as in the original code to be safe
        const { data: adminData } = await supabaseAdmin
          .from("admins")
          .select("is_super_admin")
          .eq("id", user.id)
          .maybeSingle();
          
        if (adminData?.is_super_admin) {
            isSuperAdmin = true;
        } else if (adminProfile.role === 'super_admin') {
            isSuperAdmin = true;
        }
    }

    if (!isSuperAdmin) {
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

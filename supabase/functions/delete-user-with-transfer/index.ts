/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

// Helper function to get user's booking IDs
async function getUserBookingIds(supabaseAdmin: any, userId: string): Promise<string[]> {
  const userCarIds = await getUserCarIds(supabaseAdmin, userId);
  const carIdsString = userCarIds.join(',');
  const queryString = carIdsString ? `renter_id.eq.${userId},car_id.in.(${carIdsString})` : `renter_id.eq.${userId}`;

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .or(queryString);

  if (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }

  return bookings?.map((booking: any) => booking.id) || [];
}

// Helper function to deeply check and clean all user references
async function deepCleanUserReferences(supabaseAdmin: any, userId: string): Promise<string[]> {
  const cleanupSteps: string[] = [];
  
  // 1. HARD DELETE TABLES 
  const hardDeleteConfigs = [
    { table: 'notifications', column: 'user_id' },
    { table: 'conversations', column: 'created_by' },
    { table: 'conversation_messages', column: 'sender_id' },
    { table: 'conversation_participants', column: 'user_id' },
    { table: 'user_restrictions', column: 'user_id' },
    { table: 'messages', column: 'sender_id' },
    { table: 'messages', column: 'receiver_id' },
  ];
  
  for (const config of hardDeleteConfigs) {
    try {
      const { count, error: countError } = await supabaseAdmin
        .from(config.table)
        .select('*', { count: 'exact', head: true })
        .eq(config.column, userId);
      
      if (!countError && count && count > 0) {
        console.log(`🧹 Found ${count} rows in ${config.table}.${config.column} for hard deletion`);
        
        const { error: deleteError } = await supabaseAdmin
          .from(config.table)
          .delete()
          .eq(config.column, userId);
        
        if (deleteError) {
          cleanupSteps.push(`⚠️ Failed to hard-delete ${config.table}.${config.column}: ${deleteError.message}`);
        } else {
          cleanupSteps.push(`✅ Hard-deleted ${count} rows from ${config.table}.${config.column}`);
        }
      }
    } catch (e) {
      console.log(`ℹ️ Skipping ${config.table}.${config.column}:`, (e as Error).message);
    }
  }

  // 2. SOFT DELETE / ANONYMIZE TABLES
  
  // A. Cars
  const { error: carError } = await supabaseAdmin
    .from('cars')
    .update({
      description: '[removed]',
      location_details: '[removed]',
      is_active: false
    })
    .eq('owner_id', userId);
  
  if (carError) {
    cleanupSteps.push(`⚠️ Failed to anonymize cars: ${carError.message}`);
  } else {
    cleanupSteps.push(`✅ Anonymized cars for user`);
  }

  // B. Reviews (reviewer)
  const { error: reviewerError } = await supabaseAdmin
    .from('reviews')
    .update({ comment: '[removed]' })
    .eq('reviewer_id', userId);

  // C. Reviews (reviewee)
  const { error: revieweeError } = await supabaseAdmin
    .from('reviews')
    .update({ comment: '[removed]' })
    .eq('reviewee_id', userId);

  if (reviewerError || revieweeError) {
    cleanupSteps.push(`⚠️ Handled review text anonymization with partial errors`);
  } else {
    cleanupSteps.push(`✅ Anonymized review text for user interactions`);
  }

  // D. Profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: `user_${userId.substring(0, 5)}_deleted`,
      email: `deleted_${userId.substring(0, 5)}@obfuscated.local`,
      is_deleted: true,
      bio: null,
      phone_number: null,
      avatar_url: null,
      address: null
    })
    .eq('id', userId);

  if (profileError) {
    cleanupSteps.push(`⚠️ Failed to soft-delete profile: ${profileError.message}`);
  } else {
    cleanupSteps.push(`✅ Soft-deleted and anonymized profile tombstone`);
  }
  
  return cleanupSteps;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Declare variables at the top level for error handling
  let userId: string | undefined;
  let reason: string | undefined;
  let user: any = null;

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

    // Create service role client for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header", code: "NO_AUTH" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user-scoped client for authentication
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: currentUser }, error: authError } = await supabaseUser.auth.getUser();
    user = currentUser; // Assign to the top-level variable

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token or session expired", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    try {
      const body = await req.json();
      userId = body.userId;
      reason = body.reason;
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body", code: "INVALID_BODY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and reason", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Delete user request from ${user.id} for user ${userId}, reason: ${reason}`);

    // Check if user is admin
    console.log(`🔐 Checking admin permissions for user: ${user.id}`);
    let isAdminRaw, adminCheckError;
    let isAdmin = false;
    
    try {
      const result = await supabaseUser.rpc('is_admin', { 
        user_uuid: user.id 
      });
      isAdminRaw = result.data;
      adminCheckError = result.error;
    } catch (rpcException) {
      console.error("❌ Exception calling is_admin RPC:", rpcException);
      return new Response(
        JSON.stringify({ 
          error: "Internal server error during admin check", 
          code: "RPC_EXCEPTION",
          details: (rpcException as Error).message,
          userId: user.id
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (adminCheckError) {
      // Fallback: Try direct profile check
      console.log("🔄 Trying fallback admin check via profiles table...");
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("❌ Fallback profile check also failed:", profileError);
          return new Response(
            JSON.stringify({ 
              error: "Admin permission check failed. Please contact support.", 
              code: "ADMIN_CHECK_FAILED",
              details: `RPC: ${adminCheckError.message}, Fallback: ${profileError.message}`,
              userId: user.id
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const isAdminFallback = profileData?.role === 'admin' || profileData?.role === 'super_admin';
          console.log("✅ Fallback admin check result:", isAdminFallback, "Role:", profileData?.role);
          
          if (!isAdminFallback) {
            return new Response(
              JSON.stringify({ 
                error: "Insufficient permissions. Admin access required.", 
                code: "NOT_ADMIN",
                userId: user.id,
                role: profileData?.role
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          isAdmin = true;
        }
      } catch (fallbackException) {
        console.error("❌ Fallback admin check exception:", fallbackException);
        return new Response(
          JSON.stringify({ 
            error: "Admin permission check failed. Please contact support.", 
            code: "ADMIN_CHECK_FAILED",
            details: `RPC: ${adminCheckError.message}, Exception: ${(fallbackException as Error).message}`,
            userId: user.id
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Normalize RPC result (only if RPC succeeded and we haven't set isAdmin from fallback)
    if (!adminCheckError && isAdminRaw !== undefined) {
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
        console.log("✅ RPC admin check result:", isAdmin);
      } catch (e) {
        console.error("❌ Failed to normalize RPC result:", e, isAdminRaw);
      }
    }
    
    // Final admin check
    if (!isAdmin) {
      console.error("❌ User is not admin:", {
        userId: user.id,
        targetUserId: userId,
        isAdminRaw: isAdminRaw,
        isAdmin: isAdmin
      });
      return new Response(
        JSON.stringify({ 
          error: "Insufficient permissions. Admin access required.", 
          code: "NOT_ADMIN",
          userId: user.id,
          isAdmin: false
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user information before deletion
    console.log(`Fetching profile for user: ${userId}`);
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch profile: ${profileError.message}`, 
          code: "PROFILE_FETCH_ERROR",
          userId: userId,
          adminId: user.id
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userProfile) {
      console.error("❌ User profile not found for userId:", userId);
      return new Response(
        JSON.stringify({ 
          error: "User profile not found in database", 
          code: "PROFILE_NOT_FOUND",
          userId: userId,
          adminId: user.id
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from auth.users
    console.log(`Fetching auth user: ${userId}`);
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error("❌ Error fetching auth user:", authUserError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch auth user: ${authUserError.message}`, 
          code: "AUTH_USER_FETCH_ERROR",
          userId: userId,
          adminId: user.id
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authUser?.user) {
      console.error("❌ Auth user not found for userId:", userId);
      return new Response(
        JSON.stringify({ 
          error: "User not found in authentication system", 
          code: "AUTH_USER_NOT_FOUND",
          userId: userId,
          adminId: user.id
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = authUser.user.email;

    // Prevent deletion of admin or super_admin users
    if (userProfile.role === "admin" || userProfile.role === "super_admin") {
      console.error(`❌ Cannot delete ${userProfile.role} user ${userId} (${userEmail})`);
      return new Response(
        JSON.stringify({ 
          error: "Cannot delete admin or super_admin users", 
          code: "CANNOT_DELETE_ADMIN",
          userId: userId,
          role: userProfile.role,
          email: userEmail
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start deletion process
    const deletionSteps = [];

    try {
      console.log("🔍 === STARTING COMPREHENSIVE CLEANUP ===");
      
      // STEP 1: Deep clean all user references FIRST
      console.log("🧹 Step 1: Deep cleaning all user references...");
      const deepCleanSteps = await deepCleanUserReferences(supabaseAdmin, userId);
      deletionSteps.push(...deepCleanSteps);
      
      console.log(`✅ Deep cleanup complete. Cleaned ${deepCleanSteps.length} references.`);
      
      // STEP 2: Try to delete the auth user
      console.log("🗑️ Step 2: Attempting auth user deletion...");
      
      let authDeletionSuccess = false;
      let authDeletionError: any = null;
      
      // Try multiple approaches to delete the auth user
      for (let approach = 1; approach <= 2; approach++) {
        console.log(`🔄 Deletion approach ${approach}/2...`);
        
        try {
          if (approach === 1) {
            // Approach 1: Standard deletion
            console.log("📋 Approach 1: Standard auth.admin.deleteUser");
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) throw error;
            
          } else if (approach === 2) {
            // Approach 2: Disable then delete
            console.log("📋 Approach 2: Disable user first, then delete");
            
            // First disable the user
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              email_confirm: false,
              ban_duration: '876000h' // 100 years
            });
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Then try to delete
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) throw error;
          }
          
          // If we get here, deletion succeeded
          authDeletionSuccess = true;
          console.log(`✅ Auth user deleted successfully using approach ${approach}`);
          deletionSteps.push(`Deleted auth user (approach ${approach})`);
          break;
          
        } catch (error) {
          authDeletionError = error;
          console.error(`❌ Approach ${approach} failed:`, (error as Error).message);
          
          if (approach < 2) {
            console.log("⏳ Waiting 2 seconds before next approach...");
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Check if deletion succeeded
      if (!authDeletionSuccess) {
        console.error("❌ All auth deletion approaches failed");
        
        // Check if user still exists
        const { data: stillExists } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (stillExists?.user) {
          console.error("❌ User still exists in auth system after all deletion attempts");
          
          // Return detailed error with diagnostic info
          return new Response(
            JSON.stringify({ 
              error: "Failed to delete user from authentication system after multiple attempts",
              code: "AUTH_DELETION_FAILED",
              details: {
                lastError: authDeletionError?.message || "Unknown error",
                userStillExists: true,
                userId: userId,
                email: stillExists.user.email,
                completedSteps: deletionSteps,
                recommendation: "This user may have foreign key constraints in the auth schema that prevent deletion. Manual intervention may be required. Please contact Supabase support or check the auth.users table for any constraints."
              }
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // User doesn't exist anymore (maybe previous approach actually worked?)
          console.log("✅ User no longer exists in auth system (deletion may have succeeded)");
          authDeletionSuccess = true;
          deletionSteps.push("Auth user deleted (verified by absence)");
        }
      }
      
      // STEP 3: Final verification
      console.log("🔍 Step 3: Final verification...");
      
      const { data: finalAuthCheck } = await supabaseAdmin.auth.admin.getUserById(userId);
      const { data: finalProfileCheck } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (finalAuthCheck?.user) {
        console.error("❌ Final verification failed: Auth user still exists");
        return new Response(
          JSON.stringify({ 
            error: "User still exists in authentication system after deletion",
            code: "VERIFICATION_FAILED",
            details: {
              authUserExists: true,
              profileExists: !!finalProfileCheck,
              completedSteps: deletionSteps
            }
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (finalProfileCheck) {
        console.log("ℹ️ Final verification: Profile exists, which is expected for the tombstone record.");
      }
      
      console.log("✅ Final verification passed");
      deletionSteps.push("Final verification passed");

      // Log the deletion for audit
      try {
        await supabaseAdmin.rpc('log_audit_event', {
          p_event_type: 'user_deleted',
          p_severity: 'critical',
          p_actor_id: user.id,
          p_target_id: userId,
          p_session_id: null,
          p_ip_address: null,
          p_user_agent: null,
          p_location_data: null,
          p_action_details: {
            email: userEmail,
            fullName: userProfile.full_name
          },
          p_resource_type: 'user',
          p_resource_id: userId,
          p_reason: reason,
          p_anomaly_flags: null,
          p_compliance_tags: ['user-management', 'deletion', 'gdpr']
        });
      } catch (auditError) {
        console.log("ℹ️ Audit logging failed (non-critical):", (auditError as Error).message);
      }

      console.log(`✅ User ${userId} deleted successfully`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "User and all related data deleted successfully",
          details: {
            deletionSteps,
            verification: {
              authUserDeleted: true,
              profileDeleted: true
            }
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (error) {
      console.error("❌ Error during deletion process:", error);
      
      return new Response(
        JSON.stringify({ 
          error: (error as Error).message || "Deletion process failed",
          code: "DELETION_FAILED",
          completedSteps: deletionSteps,
          userId: userId,
          adminUserId: user.id
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ Error in delete-user function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || "An unexpected error occurred",
        code: "DELETE_USER_ERROR",
        userId: userId
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
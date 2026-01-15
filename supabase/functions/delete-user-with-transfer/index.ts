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

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token or session expired", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let userId: string;
    let reason: string;
    
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

    // 🔍 DETAILED USER INVESTIGATION LOGGING
    console.log(`🔍 Investigating user ${userId} for potential deletion issues...`);
    
    try {
      // Get target user details
      const { data: targetUserProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, created_at, last_sign_in_at, is_verified")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        console.error(`❌ Failed to fetch target user profile:`, profileError);
      } else {
        console.log(`👤 Target user profile:`, {
          id: targetUserProfile?.id,
          email: targetUserProfile?.email,
          role: targetUserProfile?.role,
          created_at: targetUserProfile?.created_at,
          last_sign_in_at: targetUserProfile?.last_sign_in_at,
          is_verified: targetUserProfile?.is_verified
        });
      }

      // Check auth user status
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authError) {
          console.error(`❌ Failed to fetch auth user:`, authError);
        } else {
          console.log(`🔐 Auth user status:`, {
            id: authUser?.user?.id,
            email: authUser?.user?.email,
            email_confirmed_at: authUser?.user?.email_confirmed_at,
            last_sign_in_at: authUser?.user?.last_sign_in_at,
            created_at: authUser?.user?.created_at,
            app_metadata: authUser?.user?.app_metadata,
            user_metadata: authUser?.user?.user_metadata
          });
        }
      } catch (authCheckErr) {
        console.error(`❌ Exception checking auth user:`, authCheckErr);
      }

      // Check for associated data that might cause issues
      const { data: userCars, error: carsError } = await supabaseAdmin
        .from("cars")
        .select("id, make, model, year, status")
        .eq("owner_id", userId);
      
      if (carsError) {
        console.error(`❌ Failed to fetch user cars:`, carsError);
      } else {
        console.log(`🚗 User cars (${userCars?.length || 0}):`, userCars?.map(car => ({
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          status: car.status
        })));
      }

      const { data: userBookings, error: bookingsError } = await supabaseAdmin
        .from("bookings")
        .select("id, status, car_id, start_date, end_date")
        .or(`renter_id.eq.${userId},car.owner_id.eq.${userId}`);
      
      if (bookingsError) {
        console.error(`❌ Failed to fetch user bookings:`, bookingsError);
      } else {
        console.log(`📅 User bookings (${userBookings?.length || 0}):`, userBookings?.map(booking => ({
          id: booking.id,
          status: booking.status,
          car_id: booking.car_id,
          start_date: booking.start_date,
          end_date: booking.end_date
        })));
      }

      // Check for admin/special roles
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("role, permissions")
        .eq("user_id", userId);
      
      if (rolesError) {
        console.error(`❌ Failed to fetch user roles:`, rolesError);
      } else {
        console.log(`👑 User roles (${userRoles?.length || 0}):`, userRoles);
      }

      console.log(`✅ User ${userId} investigation complete`);
    } catch (investigationError) {
      console.error(`❌ User investigation failed:`, investigationError);
    }

    // Check if user is admin
    console.log(`🔐 Checking admin permissions for user: ${user.id}`);
    const { data: isAdminRaw, error: adminCheckError } = await supabaseUser.rpc('is_admin', { 
      user_uuid: user.id 
    });

    if (adminCheckError) {
      console.error("❌ Error calling is_admin RPC:", adminCheckError);
      console.error("❌ Admin check failed:", {
        message: adminCheckError.message,
        code: adminCheckError.code,
        details: adminCheckError.details,
        hint: adminCheckError.hint,
        userId: user.id,
        targetUserId: userId
      });
      return new Response(
        JSON.stringify({ 
          error: "Insufficient permissions. Admin access required.", 
          code: "NOT_ADMIN",
          details: adminCheckError.message,
          userId: user.id
        }),
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
        const rawObj = isAdminRaw as any;
        isAdmin = !!(rawObj.is_admin ?? rawObj.exists ?? Object.values(rawObj)[0]);
      } else {
        isAdmin = !!isAdminRaw;
      }
      console.log("Admin check result:", isAdmin);
    } catch (e) {
      console.error("Failed to normalize is_admin RPC result:", e, isAdminRaw);
      isAdmin = false;
    }

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

    console.log("Profile fetch result:", { userProfile, profileError });

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError);
      console.error("❌ Profile fetch error details:", {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        userId: userId,
        adminId: user.id
      });
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
    
    console.log("Auth user fetch result:", { authUser: authUser?.user ? { id: authUser.user.id, email: authUser.user.email } : null, authUserError });

    if (authUserError) {
      console.error("❌ Error fetching auth user:", authUserError);
      console.error("❌ Auth user fetch error details:", {
        message: authUserError.message,
        code: authUserError.code,
        details: authUserError.details,
        hint: authUserError.hint,
        userId: userId,
        adminId: user.id
      });
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

    // 🔍 DETAILED ROLE CHECK LOGGING
    console.log(`🔍 Role check for user ${userId}:`, {
      role: userProfile.role,
      email: userEmail,
      isAdmin: userProfile.role === "admin",
      isSuperAdmin: userProfile.role === "super_admin",
      canDelete: userProfile.role !== "admin" && userProfile.role !== "super_admin"
    });

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

    // Check for vehicles
    const { count: vehiclesCount } = await supabaseAdmin
      .from("cars")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    console.log(`User ${userId} has ${vehiclesCount || 0} vehicles`);

    // Start deletion process
    const deletionSteps = [];

    try {
      // 1. Delete conversation messages
      const { error: conversationMessagesError } = await supabaseAdmin
        .from("conversation_messages")
        .delete()
        .eq("sender_id", userId);

      if (conversationMessagesError) {
        console.error("Error deleting conversation messages:", conversationMessagesError);
        deletionSteps.push(`Failed to delete conversation messages: ${conversationMessagesError.message}`);
      } else {
        deletionSteps.push("Deleted conversation messages");
      }

      // 2. Delete conversation participants
      const { error: conversationParticipantsError } = await supabaseAdmin
        .from("conversation_participants")
        .delete()
        .eq("user_id", userId);

      if (conversationParticipantsError) {
        console.error("Error deleting conversation participants:", conversationParticipantsError);
        deletionSteps.push(`Failed to delete conversation participants: ${conversationParticipantsError.message}`);
      } else {
        deletionSteps.push("Deleted conversation participants");
      }

      // 3. Delete conversations created by user
      const { error: conversationsError } = await supabaseAdmin
        .from("conversations")
        .delete()
        .eq("created_by", userId);

      if (conversationsError) {
        console.error("Error deleting conversations:", conversationsError);
        deletionSteps.push(`Failed to delete conversations: ${conversationsError.message}`);
      } else {
        deletionSteps.push("Deleted conversations");
      }

      // 4. Delete messages
      const { error: messagesError } = await supabaseAdmin
        .from("messages")
        .delete()
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
        deletionSteps.push(`Failed to delete messages: ${messagesError.message}`);
      } else {
        deletionSteps.push("Deleted messages");
      }

      // 5. Delete reviews where user is reviewer
      const { error: reviewsReviewerError } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("reviewer_id", userId);

      if (reviewsReviewerError) {
        console.error("Error deleting reviewer reviews:", reviewsReviewerError);
        deletionSteps.push(`Failed to delete reviewer reviews: ${reviewsReviewerError.message}`);
      } else {
        deletionSteps.push("Deleted reviewer reviews");
      }

      // 6. Delete reviews where user is reviewee
      const { error: reviewsRevieweeError } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("reviewee_id", userId);

      if (reviewsRevieweeError) {
        console.error("Error deleting reviewee reviews:", reviewsRevieweeError);
        deletionSteps.push(`Failed to delete reviewee reviews: ${reviewsRevieweeError.message}`);
      } else {
        deletionSteps.push("Deleted reviewee reviews");
      }

      // 7. Delete notifications_backup if it exists (BEFORE bookings deletion)
      try {
        // Delete notifications_backup where user_id = userId
        const { error: backupUserError } = await supabaseAdmin
          .from("notifications_backup")
          .delete()
          .eq("user_id", userId);

        if (backupUserError) {
          console.error("Error deleting notifications_backup for user:", backupUserError);
          deletionSteps.push(`Failed to delete notifications_backup for user: ${backupUserError.message}`);
        }

        // Delete notifications_backup where related_car_id in user's cars
        const userCarIds = await getUserCarIds(supabaseAdmin, userId);
        if (userCarIds.length > 0) {
          const { error: backupCarsError } = await supabaseAdmin
            .from("notifications_backup")
            .delete()
            .in("related_car_id", userCarIds);

          if (backupCarsError) {
            console.error("Error deleting notifications_backup for cars:", backupCarsError);
            deletionSteps.push(`Failed to delete notifications_backup for cars: ${backupCarsError.message}`);
          }
        }

        // Delete notifications_backup where related_booking_id in user's bookings
        const userBookingIds = await getUserBookingIds(supabaseAdmin, userId);
        if (userBookingIds.length > 0) {
          const { error: backupBookingsError } = await supabaseAdmin
            .from("notifications_backup")
            .delete()
            .in("related_booking_id", userBookingIds);

          if (backupBookingsError) {
            console.error("Error deleting notifications_backup for bookings:", backupBookingsError);
            deletionSteps.push(`Failed to delete notifications_backup for bookings: ${backupBookingsError.message}`);
          }
        }

        deletionSteps.push("Deleted notifications_backup");
      } catch (backupError) {
        // notifications_backup table might not exist, ignore
        console.log("notifications_backup table not found or error:", backupError);
        deletionSteps.push("Skipped notifications_backup (table may not exist)");
      }

      // 7.5 CRITICAL: Verify auth user deletion and handle edge cases
      // This prevents the handle_new_user trigger from recreating the profile
      const verifyAuthUserDeleted = async (userId: string): Promise<boolean> => {
        try {
          const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
          return !authUser || !!error;
        } catch {
          return true; // Assume deleted if we can't check
        }
      };

      // 8. Delete notifications related to user's bookings and cars (BEFORE bookings deletion)
      // Delete notifications where user_id = userId
      const { error: notificationsUserError } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (notificationsUserError) {
        console.error("Error deleting notifications for user:", notificationsUserError);
        deletionSteps.push(`Failed to delete notifications for user: ${notificationsUserError.message}`);
      }

      // Delete notifications where related_car_id in user's cars
      const userCarIds = await getUserCarIds(supabaseAdmin, userId);
      if (userCarIds.length > 0) {
        const { error: notificationsCarsError } = await supabaseAdmin
          .from("notifications")
          .delete()
          .in("related_car_id", userCarIds);

        if (notificationsCarsError) {
          console.error("Error deleting notifications for cars:", notificationsCarsError);
          deletionSteps.push(`Failed to delete notifications for cars: ${notificationsCarsError.message}`);
        }
      }

      // Delete notifications where related_booking_id in user's bookings
      const userBookingIds = await getUserBookingIds(supabaseAdmin, userId);
      if (userBookingIds.length > 0) {
        const { error: notificationsBookingsError } = await supabaseAdmin
          .from("notifications")
          .delete()
          .in("related_booking_id", userBookingIds);

        if (notificationsBookingsError) {
          console.error("Error deleting notifications for bookings:", notificationsBookingsError);
          deletionSteps.push(`Failed to delete notifications for bookings: ${notificationsBookingsError.message}`);
        }
      }

      deletionSteps.push("Deleted user notifications");

      // 9. Delete bookings where user is renter
      const { error: bookingsRenterError } = await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("renter_id", userId);

      if (bookingsRenterError) {
        console.error("Error deleting renter bookings:", bookingsRenterError);
        deletionSteps.push(`Failed to delete renter bookings: ${bookingsRenterError.message}`);
      } else {
        deletionSteps.push("Deleted renter bookings");
      }

      // 10. Delete bookings where user is host (via car ownership)
      const { error: bookingsHostError } = await supabaseAdmin
        .from("bookings")
        .delete()
        .in("car_id", await getUserCarIds(supabaseAdmin, userId));

      if (bookingsHostError) {
        console.error("Error deleting host bookings:", bookingsHostError);
        deletionSteps.push(`Failed to delete host bookings: ${bookingsHostError.message}`);
      } else {
        deletionSteps.push("Deleted host bookings");
      }

      // 11. Delete user vehicles
      const { error: carsError } = await supabaseAdmin
        .from("cars")
        .delete()
        .eq("owner_id", userId);

      if (carsError) {
        console.error("Error deleting cars:", carsError);
        deletionSteps.push(`Failed to delete vehicles: ${carsError.message}`);
      } else {
        deletionSteps.push(`Deleted ${vehiclesCount || 0} vehicles`);
      }

      // 12. Delete user restrictions
      const { error: restrictionsError } = await supabaseAdmin
        .from("user_restrictions")
        .delete()
        .eq("user_id", userId);

      if (restrictionsError) {
        console.error("Error deleting restrictions:", restrictionsError);
        deletionSteps.push(`Failed to delete restrictions: ${restrictionsError.message}`);
      } else {
        deletionSteps.push("Deleted user restrictions");
      }

      // Log the deletion for audit BEFORE deleting the user (to avoid foreign key constraint issues)
      try {
        console.log("Attempting to log audit event for user deletion...");
        console.log("Audit event params:", {
          p_event_type: 'user_deleted',
          p_severity: 'critical',
          p_actor_id: user.id,
          p_target_id: userId,
          p_resource_type: 'user',
          p_resource_id: userId,
          p_reason: reason
        });

        const auditResult = await supabaseAdmin.rpc('log_audit_event', {
          p_event_type: 'user_deleted',
          p_severity: 'critical',
          p_actor_id: user.id,
          p_target_id: userId,
          p_session_id: null,
          p_ip_address: null,
          p_user_agent: null,
          p_location_data: null,
          p_action_details: {
            vehiclesDeleted: vehiclesCount || 0,
            email: userEmail,
            fullName: userProfile.full_name
          },
          p_resource_type: 'user',
          p_resource_id: userId,
          p_reason: reason,
          p_anomaly_flags: null,
          p_compliance_tags: ['user-management', 'deletion', 'gdpr']
        });

        console.log("Audit RPC result:", { 
          data: auditResult.data, 
          error: auditResult.error,
          status: auditResult.status 
        });

        if (auditResult.error) {
          console.error("❌ Error logging audit event:", JSON.stringify(auditResult.error));
          // Don't fail the operation if audit logging fails
        } else {
          console.log("✅ Audit event logged successfully:", auditResult.data);
        }
      } catch (auditLogError) {
        console.error("❌ Exception during audit logging:", auditLogError);
        console.error("Exception details:", JSON.stringify(auditLogError));
        // Don't fail the operation if audit logging fails
      }

      // 13. Delete user from auth FIRST (this is critical - must happen before profile deletion)
      try {
        console.log("🗑️ Attempting to delete auth user...");
        console.log(`🗑️ Auth deletion details: userId=${userId}, adminId=${user.id}, reason=${reason}`);
        
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error("❌ Error deleting auth user:", authDeleteError);
          
          // Enhanced error analysis for specific auth deletion failures
          const errorCode = (authDeleteError as any).code;
          const errorStatus = (authDeleteError as any).status;
          const errorMessage = authDeleteError.message;
          
          console.error("❌ Auth deletion error analysis:", {
            message: errorMessage,
            name: authDeleteError.name,
            code: errorCode,
            status: errorStatus,
            userId: userId,
            adminId: user.id,
            isAdminUser: userId === user.id,
            isRateLimited: errorStatus === 429,
            isForbidden: errorStatus === 403,
            isNotFound: errorStatus === 404,
            isServerError: errorStatus >= 500
          });
          
          // Provide more specific error messages based on error type
          let detailedErrorMessage = `Failed to delete auth user: ${errorMessage}`;
          
          if (errorStatus === 403) {
            detailedErrorMessage = `Permission denied: Admin ${user.id} cannot delete user ${userId}. This may be due to insufficient admin privileges or trying to delete a protected user.`;
          } else if (errorStatus === 404) {
            detailedErrorMessage = `User ${userId} not found in authentication system. The user may have already been deleted or does not exist.`;
          } else if (errorStatus === 429) {
            detailedErrorMessage = `Rate limit exceeded while attempting to delete user ${userId}. Please try again later.`;
          } else if (errorStatus >= 500) {
            detailedErrorMessage = `Server error while deleting user ${userId}: ${errorMessage}. This may be a temporary issue with the authentication service.`;
          } else if (errorCode === 'user_not_found') {
            detailedErrorMessage = `User ${userId} does not exist in the authentication system.`;
          } else if (errorCode === 'insufficient_permissions') {
            detailedErrorMessage = `Admin ${user.id} has insufficient permissions to delete user ${userId}.`;
          }
          
          // This is a critical failure - we should NOT continue
          throw new Error(detailedErrorMessage);
        }
        
        console.log("✅ Auth user deleted successfully");
        
        // CRITICAL: Verify the auth user was actually deleted
        const isAuthUserDeleted = await verifyAuthUserDeleted(userId);
        if (!isAuthUserDeleted) {
          console.error("❌ Auth user still exists after deletion attempt");
          throw new Error("Auth user deletion verification failed - user may still exist");
        }
        
        deletionSteps.push("Deleted auth user");
      } catch (authError) {
        console.error("❌ Exception deleting auth user:", authError);
        console.error("❌ Auth deletion exception details:", {
          message: (authError as Error).message,
          name: (authError as Error).name,
          stack: (authError as Error).stack,
          userId: userId,
          adminId: user.id,
          reason: reason
        });
        // This is a critical failure - we should NOT continue
        throw new Error(`Failed to delete auth user: ${(authError as Error).message}`);
      }

      // 14. Delete user profile AFTER auth deletion (to prevent trigger recreation)
      const { error: profileDeleteError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileDeleteError) {
        console.error("Error deleting profile:", profileDeleteError);
        // Profile might already be deleted if cascade worked, but log it
        if (profileDeleteError.code !== 'PGRST116') { // Not found error
          console.warn("⚠️ Profile deletion failed, but auth user was already deleted");
        }
      } else {
        deletionSteps.push("Deleted user profile");
      }

      // FINAL VERIFICATION: Ensure user is completely deleted
      console.log("🔍 Performing final verification...");
      const finalAuthCheck = await verifyAuthUserDeleted(userId);
      const { data: finalProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (!finalAuthCheck || finalProfile) {
        console.error("❌ Final verification failed:", {
          authUserDeleted: finalAuthCheck,
          profileExists: !!finalProfile
        });
        throw new Error("Final verification failed - user may not be completely deleted");
      }
      
      console.log("✅ Final verification passed - user completely deleted");

      console.log(`User deleted successfully:`, {
        userId,
        email: userEmail,
        fullName: userProfile.full_name,
        deletedBy: user.id,
        reason,
        vehiclesDeleted: vehiclesCount || 0,
        timestamp: new Date().toISOString(),
        steps: deletionSteps
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "User and all related data deleted successfully",
          details: {
            vehiclesDeleted: vehiclesCount || 0,
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
      console.error("❌ Error details:", {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack,
        completedSteps: deletionSteps,
        userId: userId,
        reason: reason,
        adminUserId: user.id
      });
      
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
    console.error("❌ Top-level error details:", {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack,
      requestBody: { userId: userId, reason: reason },
      adminUserId: user?.id
    });
    
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
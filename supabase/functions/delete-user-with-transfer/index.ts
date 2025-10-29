import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { userId, reason } = await req.json();

    if (!userId || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or session expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using the is_admin function
    const { data: isAdminRaw, error: adminCheckError } = await supabase
      .rpc('is_admin');

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

    // Get user information before deletion (for logging)
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deletion of admin or super_admin users
    if (userProfile.role === "admin" || userProfile.role === "super_admin") {
      return new Response(
        JSON.stringify({ error: "Cannot delete admin or super_admin users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for vehicles
    const { count: vehiclesCount } = await supabase
      .from("cars")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    console.log(`User ${userId} has ${vehiclesCount || 0} vehicles`);

    // Start deletion process - DELETE CASCADE will handle related records
    
    // 1. Delete user vehicles (if any remain)
    const { error: carsError } = await supabase
      .from("cars")
      .delete()
      .eq("owner_id", userId);

    if (carsError) {
      console.error("Error deleting cars:", carsError);
      throw new Error(`Failed to delete vehicles: ${carsError.message}`);
    }

    // 2. Delete user restrictions
    const { error: restrictionsError } = await supabase
      .from("user_restrictions")
      .delete()
      .eq("user_id", userId);

    if (restrictionsError) {
      console.error("Error deleting restrictions:", restrictionsError);
      throw new Error(`Failed to delete restrictions: ${restrictionsError.message}`);
    }

    // 3. Delete bookings where user is renter
    const { error: bookingsRenterError } = await supabase
      .from("bookings")
      .delete()
      .eq("renter_id", userId);

    if (bookingsRenterError) {
      console.error("Error deleting renter bookings:", bookingsRenterError);
      throw new Error(`Failed to delete renter bookings: ${bookingsRenterError.message}`);
    }

    // 4. Delete bookings where user is host
    const { error: bookingsHostError } = await supabase
      .from("bookings")
      .delete()
      .eq("host_id", userId);

    if (bookingsHostError) {
      console.error("Error deleting host bookings:", bookingsHostError);
      throw new Error(`Failed to delete host bookings: ${bookingsHostError.message}`);
    }

    // 5. Delete reviews where user is reviewer
    const { error: reviewsReviewerError } = await supabase
      .from("reviews")
      .delete()
      .eq("reviewer_id", userId);

    if (reviewsReviewerError) {
      console.error("Error deleting reviewer reviews:", reviewsReviewerError);
      throw new Error(`Failed to delete reviewer reviews: ${reviewsReviewerError.message}`);
    }

    // 6. Delete reviews where user is reviewee
    const { error: reviewsRevieweeError } = await supabase
      .from("reviews")
      .delete()
      .eq("reviewee_id", userId);

    if (reviewsRevieweeError) {
      console.error("Error deleting reviewee reviews:", reviewsRevieweeError);
      throw new Error(`Failed to delete reviewee reviews: ${reviewsRevieweeError.message}`);
    }

    // 7. Delete user profile
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      throw new Error(`Failed to delete profile: ${profileDeleteError.message}`);
    }

    // 8. Delete user from auth (this should be last)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      throw new Error(`Failed to delete authentication: ${authDeleteError.message}`);
    }

    // Log the deletion for audit
    console.log(`User deleted successfully:`, {
      userId,
      email: userProfile.email,
      fullName: userProfile.full_name,
      deletedBy: data.user.id,
      reason,
      vehiclesDeleted: vehiclesCount || 0,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User and all related data deleted successfully",
        details: {
          vehiclesDeleted: vehiclesCount || 0,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || "An unexpected error occurred",
        code: "DELETE_USER_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
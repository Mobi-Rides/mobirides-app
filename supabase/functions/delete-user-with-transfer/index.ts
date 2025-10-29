import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface Profile {
  role: string;
}

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

    const { userId, transferToUserId, reason } = await req.json();

    if (!userId || !transferToUserId || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, transferToUserId, reason" }),
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

    const user = data.user;

    // Check if user is admin using the is_admin function (be defensive about return shape)
    const { data: isAdminRaw, error: adminCheckError } = await supabase
      .rpc('is_admin');

    if (adminCheckError) {
      console.error("Error calling is_admin RPC:", adminCheckError);
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize RPC result: it may be a boolean, an object, or an array depending on Postgres/Supabase version
    let isAdmin = false;
    try {
      if (Array.isArray(isAdminRaw)) {
        // e.g., [true] or [{ is_admin: true }]
        const first = isAdminRaw[0];
        if (typeof first === 'boolean') isAdmin = first;
        else if (first && typeof first === 'object') {
          // check common boolean fields
          isAdmin = !!(first.is_admin ?? first.exists ?? Object.values(first)[0]);
        } else {
          isAdmin = !!first;
        }
      } else if (typeof isAdminRaw === 'object' && isAdminRaw !== null) {
        // e.g., { is_admin: true } or { exists: true }
        isAdmin = !!(isAdminRaw.is_admin ?? isAdminRaw.exists ?? Object.values(isAdminRaw)[0]);
      } else {
        // boolean or truthy scalar
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

    // Transfer assets
    // Transfer cars
    const { error: carsError } = await supabase
      .from("cars")
      .update({ owner_id: transferToUserId })
      .eq("owner_id", userId);

    if (carsError) throw carsError;

    // Transfer bookings (as renter)
    const { error: bookingsRenterError } = await supabase
      .from("bookings")
      .update({ renter_id: transferToUserId })
      .eq("renter_id", userId);

    if (bookingsRenterError) throw bookingsRenterError;

    // Transfer bookings (as host)
    const { error: bookingsHostError } = await supabase
      .from("bookings")
      .update({ host_id: transferToUserId })
      .eq("host_id", userId);

    if (bookingsHostError) throw bookingsHostError;

    // Transfer reviews (as reviewer)
    const { error: reviewsReviewerError } = await supabase
      .from("reviews")
      .update({ reviewer_id: transferToUserId })
      .eq("reviewer_id", userId);

    if (reviewsReviewerError) throw reviewsReviewerError;

    // Transfer reviews (as reviewee)
    const { error: reviewsRevieweeError } = await supabase
      .from("reviews")
      .update({ reviewee_id: transferToUserId })
      .eq("reviewee_id", userId);

    if (reviewsRevieweeError) throw reviewsRevieweeError;

    // Delete user restrictions
    const { error: restrictionsError } = await supabase
      .from("user_restrictions")
      .delete()
      .eq("user_id", userId);

    if (restrictionsError) throw restrictionsError;

    // Delete profile
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) throw profileDeleteError;

    // Delete user from auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) throw authDeleteError;

    // Log the deletion (optional, for audit)
    console.log(`User ${userId} deleted and assets transferred to ${transferToUserId}. Reason: ${reason}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-user-with-transfer:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

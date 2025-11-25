import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MigrationStats {
  totalUsers: number;
  updatedUsers: number;
  skippedUsers: number;
  errors: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const stats: MigrationStats = {
      totalUsers: 0,
      updatedUsers: 0,
      skippedUsers: 0,
      errors: [],
    };

    console.log("Starting user profile migration...");

    // Get all auth users with their metadata
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    stats.totalUsers = authUsers.users.length;
    console.log(`Found ${stats.totalUsers} users to process`);

    // Process each user
    for (const authUser of authUsers.users) {
      try {
        // Check if profile exists and get current data
        const { data: currentProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', authUser.id)
          .single<{ full_name: string; phone_number: string }>();

        if (profileError && profileError.code !== 'PGRST116') {
          stats.errors.push(`Error fetching profile for ${authUser.email}: ${profileError.message}`);
          continue;
        }

        // Extract metadata
        const metadata = authUser.user_metadata as { full_name?: string; phone_number?: string } | undefined;
        const fullName = metadata?.full_name;
        const phoneNumber = metadata?.phone_number;

        // Skip if no metadata to extract
        if (!fullName && !phoneNumber) {
          stats.skippedUsers++;
          console.log(`Skipping ${authUser.email} - no metadata to extract`);
          continue;
        }

        // Check if profile needs updating
        const needsUpdate = 
          (fullName && currentProfile?.full_name !== fullName) ||
          (phoneNumber && currentProfile?.phone_number !== phoneNumber) ||
          !currentProfile;

        if (!needsUpdate) {
          stats.skippedUsers++;
          console.log(`Skipping ${authUser.email} - profile already correct`);
          continue;
        }

        // Update or create profile
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (fullName) updateData.full_name = fullName;
        if (phoneNumber) updateData.phone_number = phoneNumber;

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUser.id,
            ...updateData,
          });

        if (updateError) {
          stats.errors.push(`Error updating profile for ${authUser.email}: ${updateError.message}`);
          continue;
        }

        stats.updatedUsers++;
        console.log(`Updated profile for ${authUser.email}`);

      } catch (userError) {
        const message = userError instanceof Error ? userError.message : String(userError);
        stats.errors.push(`Error processing user ${authUser.email}: ${message}`);
        continue;
      }
    }

    console.log("Migration completed:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User profile migration completed",
        stats,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: unknown) {
    console.error("Migration error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
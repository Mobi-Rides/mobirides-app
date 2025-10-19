import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, isSuperAdmin, userName } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[add-admin] Adding admin for user: ${userId}`);

    // Fetch the user's actual email from auth.users using service role
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);

    if (authError || !authUser?.user?.email) {
      console.error('[add-admin] Failed to fetch user email:', authError);
      return new Response(
        JSON.stringify({ error: 'Could not retrieve user email from auth' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = authUser.user.email;
    console.log(`[add-admin] Retrieved email: ${userEmail}`);

    // Insert into admins table with real email
    const { error: insertError } = await supabaseClient
      .from('admins')
      .insert({
        id: userId,
        email: userEmail,
        full_name: userName || 'Unknown User',
        is_super_admin: isSuperAdmin || false
      });

    if (insertError) {
      console.error('[add-admin] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[add-admin] Successfully added admin: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, email: userEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[add-admin] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

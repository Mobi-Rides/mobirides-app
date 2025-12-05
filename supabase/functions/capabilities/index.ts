import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Capabilities function invoked")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    )
  }

  try {
    // Return admin capabilities
    const capabilities = {
      user_management: {
        view_users: true,
        assign_roles: true,
        bulk_assign_roles: true,
        suspend_users: true,
        delete_users: true
      },
      content_management: {
        manage_listings: true,
        moderate_reviews: true,
        manage_bookings: true
      },
      system_administration: {
        view_analytics: true,
        manage_settings: true,
        view_logs: true
      },
      super_admin_only: {
        manage_admins: true,
        system_configuration: true,
        data_export: true
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: capabilities
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error fetching capabilities:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch capabilities',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

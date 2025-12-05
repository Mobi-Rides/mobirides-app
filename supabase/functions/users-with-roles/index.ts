import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Users with roles function invoked")

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all user roles grouped by user
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role')

    if (roleError) throw roleError

    // Group roles by user_id
    const rolesByUser = roleData.reduce((acc, item) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = []
      }
      acc[item.user_id].push(item.role)
      return acc
    }, {})

    // Get unique user IDs
    const userIds = Object.keys(rolesByUser)

    // Get user profiles
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profileError) throw profileError

    // Combine profile data with roles
    const usersWithRoles = profileData.map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      current_roles: rolesByUser[profile.id] || []
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: usersWithRoles
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error fetching users with roles:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch users with roles',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

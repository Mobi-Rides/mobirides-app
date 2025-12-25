import { createClient } from "npm:@supabase/supabase-js@2"

console.log("Users with roles function invoked")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RoleItem {
  user_id: string
  role: string
}

interface ProfileItem {
  id: string
  full_name: string | null
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
    const rolesByUser: Record<string, string[]> = (roleData as RoleItem[]).reduce((acc: Record<string, string[]>, item: RoleItem) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = []
      }
      acc[item.user_id].push(item.role)
      return acc
    }, {})

    // Get unique user IDs
    const userIds = Object.keys(rolesByUser)

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Get user profiles
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    if (profileError) throw profileError

    // Fetch emails from auth.users using admin API
    const { data: authData, error: authError } = await supabaseClient.auth.admin.listUsers({
      perPage: 1000, // Adjust if you have more users
    })

    if (authError) {
      console.warn('Could not fetch auth users for emails:', authError)
    }

    // Create email lookup map
    const emailMap: Record<string, string> = {}
    if (authData?.users) {
      for (const user of authData.users) {
        if (user.id && user.email) {
          emailMap[user.id] = user.email
        }
      }
    }

    // Combine profile data with roles and emails
    const usersWithRoles = (profileData as ProfileItem[]).map((profile: ProfileItem) => ({
      id: profile.id,
      email: emailMap[profile.id] || null,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch users with roles',
        details: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request details
    const { endpoint, maxRequests = 100, windowMinutes = 15 } = await req.json()
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get IP address from request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     '127.0.0.1'

    // Get user ID if authenticated
    const { data: { user } } = await supabaseClient.auth.getUser()
    const userId = user?.id || null

    // Check rate limit using the database function
    const { data, error } = await supabaseClient.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
      p_endpoint: endpoint,
      p_user_id: userId,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    })

    if (error) {
      console.error('Rate limit check error:', error)
      return new Response(
        JSON.stringify({ error: 'Rate limit check failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return rate limit status
    const isAllowed = data as boolean
    
    return new Response(
      JSON.stringify({ 
        allowed: isAllowed,
        endpoint,
        ipAddress,
        userId
      }),
      { 
        status: isAllowed ? 200 : 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': isAllowed ? '1' : '0'
        } 
      }
    )

  } catch (error) {
    console.error('Rate limit function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
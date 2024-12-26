import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    
    if (!token) {
      console.log('No token provided in request')
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify token format (Mapbox public tokens start with 'pk.')
    if (typeof token !== 'string' || !token.startsWith('pk.')) {
      console.log('Invalid token format provided')
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store token in environment variable
    // Note: In Supabase Edge Functions, we can't actually set environment variables
    // at runtime. This is just for validation.
    console.log('Token validation successful')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error saving token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
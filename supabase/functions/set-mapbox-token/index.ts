import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('set-mapbox-token function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { token } = await req.json();
    console.log('Received token request:', { hasToken: !!token, tokenPrefix: token?.substring(0, 5) });
    
    if (!token) {
      console.error('No token provided in request');
      return new Response(
        JSON.stringify({ 
          error: 'Token is required',
          message: 'Please provide a Mapbox token'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify token format (Mapbox public tokens start with 'pk.')
    if (typeof token !== 'string' || !token.startsWith('pk.')) {
      console.error('Invalid token format provided');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token format',
          message: 'Mapbox public tokens should start with pk.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Note: In Supabase Edge Functions, we can't actually set environment variables
    // at runtime. The token needs to be set in the Supabase dashboard.
    console.log('Token validation successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token format validated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in set-mapbox-token function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Internal server error while processing token'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
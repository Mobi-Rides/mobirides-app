import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('get-mapbox-token function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Attempting to retrieve Mapbox token from environment');
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!token) {
      console.error('No Mapbox token found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured',
          message: 'The Mapbox token is not set in the environment variables'
        }),
        { 
          status: 404,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Successfully retrieved Mapbox token');
    return new Response(
      JSON.stringify({ 
        token,
        message: 'Token retrieved successfully'
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in get-mapbox-token function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Internal server error while retrieving Mapbox token'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
})
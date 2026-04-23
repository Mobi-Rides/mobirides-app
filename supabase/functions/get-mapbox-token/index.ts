const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured'
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

    return new Response(
      JSON.stringify({ 
        token
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
    console.error('Unhandled error in get-mapbox-token');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error while retrieving Mapbox token'
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

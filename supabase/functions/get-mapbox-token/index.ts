import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get('MAPBOX_TOKEN');
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Mapbox token not configured' }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }

  return new Response(
    JSON.stringify({ token }),
    { 
      status: 200,
      headers: corsHeaders
    }
  );
});
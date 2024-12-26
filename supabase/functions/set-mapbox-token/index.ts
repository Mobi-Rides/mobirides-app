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

  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Verify token format
    if (typeof token !== 'string' || !token.startsWith('pk.')) {
      throw new Error('Invalid token format');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
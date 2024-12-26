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
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // In a real implementation, you would save the token to a secure storage
    // For now, we'll just verify it's a valid format
    console.log('Token validation successful');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error saving token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
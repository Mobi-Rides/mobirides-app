import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get VAPID public key from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!vapidPublicKey) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully retrieved VAPID public key');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        vapidKey: vapidPublicKey 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error retrieving VAPID key:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve VAPID configuration',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
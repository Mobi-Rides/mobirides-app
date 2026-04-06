import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-payu-signature',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify webhook signature (e.g., from Pay-U)
    // const signature = req.headers.get('x-payu-signature');
    // const secret = Deno.env.get('PAYU_WEBHOOK_SECRET');
    // if (!verifySignature(signature, secret)) throw new Error('Unauthorized');

    const payload = await req.json()
    const { 
      event_type, // 'policy_confirmed', 'claim_status_updated'
      policy_id, 
      booking_id,
      status, 
      provider_reference 
    } = payload

    console.log(`Pay-U Webhook: ${event_type} for policy ${policy_id}, status: ${status}`)

    if (event_type === 'policy_confirmed') {
      await supabase
        .from('insurance_policies')
        .update({
          status: 'active',
          payu_remittance_reference: provider_reference,
          payu_remittance_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', policy_id)
    } else if (event_type === 'claim_status_updated') {
      // Logic for handling claim updates from Pay-U
      await supabase
        .from('insurance_claims')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('policy_id', policy_id) // or by claim_id if provided
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Pay-U Webhook Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for unpaid bookings past deadline
    const { data: expiredBookings, error } = await supabase
      .from('bookings')
      .select('id, payment_deadline')
      .eq('payment_status', 'awaiting_payment')
      .lt('payment_deadline', new Date().toISOString())

    if (error) throw error

    let count = 0
    if (expiredBookings && expiredBookings.length > 0) {
      for (const booking of expiredBookings) {
        // Update status to expired
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'expired',
            payment_status: 'expired'
          })
          .eq('id', booking.id)

        if (!updateError) {
          count++
          // Notify User
          // await supabase.from('notifications').insert(...)
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Expired ${count} bookings`, count }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

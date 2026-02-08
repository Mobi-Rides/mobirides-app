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

    // Find bookings completed > 24 hours ago that still have pending earnings
    // We use a combination of end_date and end_time (defaulting to 23:59:59 if null)

    // Calculate cutoff timestamp (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const cutoffISO = cutoffTime.toISOString()

    // Get completed bookings where the end time has passed the 24h window
    // Since Supabase doesn't support complex timestamp construction in a simple .lt() query easily without computed columns,
    // we fetch candidates based on end_date <= yesterday, then filter precisely in code.
    // Optimization: bookings ending before yesterday are definitely eligible. Bookings ending yesterday need time check.

    const { data: eligibleBookings, error } = await supabase
      .from('bookings')
      .select('id, end_date, end_time')
      .eq('status', 'completed')
      .lte('end_date', cutoffISO.split('T')[0]) // Candidates ending on or before cutoff date

    if (error) throw error

    let releasedCount = 0

    for (const booking of eligibleBookings || []) {
      // Construct full end timestamp
      // If end_time is null, assume end of day? Or start? Usually bookings have times. Default to 00:00 if missing.
      const endDateStr = booking.end_date
      const endTimeStr = booking.end_time || '00:00:00'
      const bookingEnd = new Date(`${endDateStr}T${endTimeStr}`)

      // Check if 24h has passed
      if (Date.now() > bookingEnd.getTime() + (24 * 60 * 60 * 1000)) {
        // Check if already released
        const { data: existingTx } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('transaction_type', 'earnings_released')
          .single()

        if (!existingTx) {
          // Attempt release
          const { error: releaseError } = await supabase.rpc('release_pending_earnings', {
            p_booking_id: booking.id
          })

          if (!releaseError) releasedCount++
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Released earnings for ${releasedCount} bookings`, count: releasedCount }),
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

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

    const { booking_id, payment_method, success_url, cancel_url } = await req.json()

    // 1. Validate Booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, cars(price_per_day), renter:renter_id(*)')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // 2. Validate Amount (Prevent tampering)
    // In a real scenario, re-calculate price from car price + days + insurance
    // For now, trust DB total_price as it was calculated on creation
    // @ts-expect-error - trust database value
    const amount = booking.total_price

    if (amount <= 0) {
      throw new Error('Invalid payment amount')
    }

    // 3. Create Payment Transaction
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id,
        // @ts-expect-error - trust database value
        user_id: booking.renter_id,
        amount,
        currency: 'BWP',
        payment_method,
        payment_provider: payment_method === 'card' ? 'paygate' : 'orange_money',
        status: 'initiated',
        provider_reference: `REF_${Date.now()}` // Temporary ref
      })
      .select()
      .single()

    if (txnError) throw txnError

    // 4. Update Booking with Transaction ID
    await supabase
      .from('bookings')
      .update({
        payment_transaction_id: transaction.id,
        payment_status: 'awaiting_payment'
      })
      .eq('id', booking_id)

    // 5. Mock Provider Integration
    // In production, this would call PayGate/Ooze API
    // For now, return success immediately for testing or a mock URL

    return new Response(
      JSON.stringify({
        paymentUrl: `${success_url}?transaction_id=${transaction.id}`, // Auto-success for dev
        transactionId: transaction.id,
        providerReference: transaction.provider_reference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

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

    // Mock Payload from Provider
    const { transaction_id, status, provider_ref } = await req.json()
    console.log(`Webhook received for transaction: ${transaction_id}, status: ${status}`)

    // 1. Get Transaction
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .select('*, bookings!payment_transactions_booking_id_fkey(*)')
      .eq('id', transaction_id)
      .single()

    if (txnError || !transaction) {
      console.error('Lookup failed for ID:', transaction_id);
      throw new Error(`Transaction not found: ${transaction_id} (Error: ${txnError?.message})`)
    }

    if (transaction.status === 'completed') {
      return new Response(JSON.stringify({ message: 'Already processed' }), { headers: corsHeaders })
    }

    // 2. Update Transaction Status
    const newStatus = status === 'success' ? 'completed' : 'failed'

    // Fetch dynamic commission rate from platform_settings
    let commissionRate = 0.15; // default fallback
    try {
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'commission_rate_default')
        .single();
      
      if (settingsData && settingsData.setting_value) {
        commissionRate = Number(settingsData.setting_value) || 0.15;
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic commission, using 0.15 code default', err);
    }

    // Calculate Splits according to Pay-U SLA (90/10 for insurance)
    // @ts-expect-error - trust database value
    const booking = transaction.bookings
    const insurance_premium = booking.insurance_premium || 0
    const rental_portion = Math.max(0, transaction.amount - insurance_premium)

    const rental_platform_commission = rental_portion * commissionRate
    const insurance_platform_commission = insurance_premium * 0.10 // 10% kept by MobiRides
    const insurance_payu_remittance = insurance_premium * 0.90 // 90% goes to Pay-U

    const total_platform_commission = rental_platform_commission + insurance_platform_commission
    const host_earnings = rental_portion - rental_platform_commission

    await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        provider_transaction_id: provider_ref,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        platform_commission: newStatus === 'completed' ? total_platform_commission : 0,
        host_earnings: newStatus === 'completed' ? host_earnings : 0,
        commission_rate: commissionRate
      })
      .eq('id', transaction_id)

    // 3. Handle Success Logic
    if (newStatus === 'completed') {
      // Update Booking
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('id', transaction.booking_id)

      // Update Insurance Policy (SLA Split)
      if (insurance_premium > 0) {
        await supabase
          .from('insurance_policies')
          .update({
            payu_amount: insurance_payu_remittance,
            mobirides_commission: insurance_platform_commission,
            status: 'active'
          })
          .eq('booking_id', transaction.booking_id);
      }

      // Credit Host Pending Earnings (DB Function)
      const { error: creditError } = await supabase.rpc('credit_pending_earnings', {
        p_booking_id: transaction.booking_id,
        p_host_earnings: host_earnings,
        p_platform_commission: total_platform_commission
      })

      if (creditError) throw creditError

      // Send Notification (Stub)
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        title: 'Booking Confirmed',
        message: 'Your payment was successful and booking is confirmed!',
        type: 'booking_confirmed'
      })
    } else {
      // Handle Failure
      await supabase
        .from('bookings')
        .update({ payment_status: 'failed' }) // Keep booking as pending/awaiting? Or fail it?
        .eq('id', transaction.booking_id)
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
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

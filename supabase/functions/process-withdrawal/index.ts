import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { z } from "npm:zod@3"

const bodySchema = z.object({
  withdrawal_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
})

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

    // Only allow admins to trigger this (check auth header)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Check if it's the Service Role (Super Admin)
    let user = null
    if (token === serviceRoleKey) {
      // It's the service role! Bypass checks.
      user = { id: 'service_role_admin', role: 'service_role' }
    } else {
      // Regular user check
      const { data: userData, error: authError } = await supabase.auth.getUser(token)
      if (authError || !userData.user) throw new Error('Invalid Token')
      user = userData.user

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (!roleData) throw new Error('Unauthorized: Admin only')
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { withdrawal_id, action, notes } = parsed.data

    // 1. Get Withdrawal Request
    const { data: request, error: reqError } = await supabase
      .from('withdrawal_requests')
      .select('*, host_wallets(*)')
      .eq('id', withdrawal_id)
      .single()

    if (reqError || !request) throw new Error('Withdrawal request not found')
    if (request.status !== 'pending') throw new Error('Request already processed')

    if (action === 'reject') {
      // Refund the wallet
      await supabase
        .from('host_wallets')
        .update({
          // @ts-expect-error: trust db - balance field may not exist in type but exists in DB
          balance: request.host_wallets.balance + request.amount, // Optimistic locking handled in DB ideally, simplified here
          updated_at: new Date().toISOString()
        })
        .eq('id', request.wallet_id)

      // Log Reversal
      await supabase.from('wallet_transactions').insert({
        wallet_id: request.wallet_id,
        amount: request.amount,
        transaction_type: 'withdrawal_reversal',
        description: `Withdrawal rejected: ${notes || 'No reason provided'}`,
        // @ts-expect-error: trust db - balance_after field may not exist in type but exists in DB
        balance_after: request.host_wallets.balance + request.amount,
        metadata: { withdrawal_request_id: withdrawal_id }
      })

      // Update Request
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          failure_reason: notes,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id)

      return new Response(JSON.stringify({ success: true, status: 'rejected' }), { headers: corsHeaders })
    }

    if (action === 'approve') {
      // In real life, trigger bank API here
      const provider_reference = `PAYOUT_${Date.now()}`

      // Update Request
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          provider_reference,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id)

      if (updateError) throw new Error(`Update failed: ${updateError.message}`)

      // Notify Host
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: request.host_id,
        title: 'Withdrawal Processed',
        description: `Your withdrawal of BWP ${request.amount} has been processed.`,
        type: 'payout_completed'
      })

      if (notifError) console.error('Notification failed:', notifError)

      return new Response(JSON.stringify({ success: true, status: 'completed' }), { headers: corsHeaders })
    }

    throw new Error('Invalid action')

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

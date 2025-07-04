import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request details
    const { captchaToken, action } = await req.json()
    
    if (!captchaToken || !action) {
      return new Response(
        JSON.stringify({ error: 'CAPTCHA token and action are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user ID if authenticated
    const { data: { user } } = await supabaseClient.auth.getUser()
    const userId = user?.id || null

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User must be authenticated for CAPTCHA verification' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify CAPTCHA token with Google reCAPTCHA (if configured)
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY')
    let captchaValid = false

    if (recaptchaSecret) {
      try {
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${recaptchaSecret}&response=${captchaToken}`,
        })

        const recaptchaData = await recaptchaResponse.json()
        captchaValid = recaptchaData.success && recaptchaData.score >= 0.5
      } catch (error) {
        console.error('reCAPTCHA verification error:', error)
        captchaValid = false
      }
    } else {
      // Fallback: store CAPTCHA token in database for verification
      const { error: insertError } = await supabaseClient
        .from('captcha_verifications')
        .insert({
          user_id: userId,
          ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          captcha_token: captchaToken
        })

      if (insertError) {
        console.error('CAPTCHA token storage error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store CAPTCHA token' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      captchaValid = true
    }

    if (!captchaValid) {
      return new Response(
        JSON.stringify({ error: 'CAPTCHA verification failed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the CAPTCHA verification
    const { error: auditError } = await supabaseClient.rpc('log_audit_event', {
      p_action: 'captcha_verified',
      p_table_name: 'captcha_verifications',
      p_new_values: { action, captchaToken: captchaToken.substring(0, 10) + '...' }
    })

    if (auditError) {
      console.error('Audit log error:', auditError)
    }

    return new Response(
      JSON.stringify({ 
        verified: true,
        action,
        userId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('CAPTCHA verification function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
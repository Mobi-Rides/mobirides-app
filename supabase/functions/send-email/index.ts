import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

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
    const { to, templateId, dynamicData, subject } = await req.json()

    // Initialize SendGrid
    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('MOBIRIDES_FROM_EMAIL') || 'noreply@mobirides.com'
    const companyName = Deno.env.get('MOBIRIDES_COMPANY_NAME') || 'MobiRides'

    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        dynamic_template_data: {
          ...dynamicData,
          companyName,
          year: new Date().getFullYear()
        }
      }],
      from: {
        email: fromEmail,
        name: companyName
      },
      template_id: templateId
    }

    if (subject) {
      emailData.personalizations[0].subject = subject
    }

    // SendGrid API call
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${error}`)
    }

    const messageId = response.headers.get('x-message-id')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId,
        status: 'sent'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

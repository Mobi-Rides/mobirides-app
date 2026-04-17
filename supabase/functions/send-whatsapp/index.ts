import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WhatsAppRequestSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format. Must include country code, e.g. +267..."),
  templateSid: z.string(),
  variables: z.record(z.string()).optional(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const validation = WhatsAppRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request payload", 
          details: validation.error.format() 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, templateSid, variables } = validation.data;

    // Initialize Twilio client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const whatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Twilio credentials not configured')
    }

    // Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const auth = btoa(`${accountSid}:${authToken}`)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: whatsappNumber,
        To: `whatsapp:${to}`,
        ContentSid: templateSid,
        ContentVariables: JSON.stringify(variables)
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Twilio API error: ${error}`)
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.sid,
        status: result.status 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

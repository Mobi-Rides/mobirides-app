import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, unknown>;
  type?: string;
  user_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, templateId, dynamicData, type, user_name }: EmailRequest = await req.json();

    console.log(`Sending ${type || 'notification'} email to ${to}`, templateId ? `using template: ${templateId}` : 'using raw HTML');

    // Prepare email payload
    const emailPayload: any = {
      from: "MobiRides <noreply@mobirides.com>",
      to: [to],
    };

    // Use template if provided, otherwise use raw HTML
    if (templateId && dynamicData) {
      emailPayload.template = templateId;
      emailPayload.template_data = dynamicData;
      if (subject) {
        emailPayload.subject = subject;
      }
    } else if (html) {
      emailPayload.html = html;
      emailPayload.subject = subject || "MobiRides Notification";
    } else {
      throw new Error("Either templateId with dynamicData or html content must be provided");
    }

    const emailResponse = await resend.emails.send(emailPayload);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      id: emailResponse.data?.id,
      message: "Email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in resend-service function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
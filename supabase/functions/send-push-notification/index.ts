import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    notification_type?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscription, payload }: PushNotificationRequest = await req.json();

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      throw new Error("VAPID keys not configured");
    }

    console.log(`Sending push notification: ${payload.title} to ${subscription.endpoint}`);

    const result = await sendWebPushNotification(
      subscription,
      payload,
      vapidPublicKey,
      vapidPrivateKey
    );

    console.log("Push notification sent successfully");

    return new Response(JSON.stringify({ 
      success: true,
      messageId: result.messageId,
      message: "Push notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
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

async function sendWebPushNotification(
  subscription: PushNotificationRequest['subscription'],
  payload: PushNotificationRequest['payload'],
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  // Create JWT for VAPID authentication
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    aud: new URL(subscription.endpoint).origin,
    exp: now + (12 * 60 * 60), // 12 hours
    sub: 'mailto:noreply@mobirides.com'
  };

  // Import VAPID private key for signing
  const privateKeyBuffer = urlBase64ToUint8Array(vapidPrivateKey);
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  );

  // Create JWT
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Prepare notification payload
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    url: payload.url || '/',
    notification_type: payload.notification_type || 'general'
  });
  
  // Send push notification with proper Web Push headers
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': notificationPayload.length.toString(),
      'TTL': '86400', // 24 hours
      'Urgency': 'normal',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: notificationPayload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Push service error: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`Push service error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return { 
    messageId: response.headers.get('Location') || 'sent',
    status: response.status 
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

serve(handler);
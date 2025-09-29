import { toast } from 'sonner';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    toast.error('This browser does not support notifications.');
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    toast.success('Notifications enabled!');
  } else {
    toast.warning('Notifications denied or dismissed.');
  }
}

export async function subscribeToPush() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from backend
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: response, error } = await supabase.functions.invoke('get-vapid-key');
      
      if (error || !response?.vapidKey) {
        console.error('Failed to get VAPID key:', error);
        toast.error('Failed to configure push notifications');
        return;
      }
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(response.vapidKey),
      });
      
      // Save subscription to database
      await saveSubscriptionToDatabase(subscription);
      
      console.log('Push subscription created:', JSON.stringify(subscription));
      toast.success('Push notifications enabled!');
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable push notifications');
    }
  }
}

async function saveSubscriptionToDatabase(subscription: PushSubscription) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use direct insert with type assertion to handle the missing table types
    const subscriptionData = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscriptionData.keys?.p256dh || '',
        auth: subscriptionData.keys?.auth || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
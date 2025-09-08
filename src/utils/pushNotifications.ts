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
      const { data: vapidKey, error } = await fetch('/api/vapid-public-key').then(res => res.json());
      if (error || !vapidKey) {
        // Fallback to environment variable for development
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLaMgoIFakVLMFGqbNWfyHXisoWvSSfHZsF_ES5ej36xmd5-5qBX8w';
        
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        
        // Save subscription to database
        await saveSubscriptionToDatabase(subscription);
        
        console.log('Push subscription created (fallback):', JSON.stringify(subscription));
        toast.success('Push notifications enabled!');
        return subscription;
      }
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
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

    // Use RPC function to handle the insert since table types aren't updated yet
    const { error } = await supabase.rpc('save_push_subscription', {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.toJSON().keys?.p256dh || '',
      auth_key: subscription.toJSON().keys?.auth || ''
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
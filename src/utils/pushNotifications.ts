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
      
      // Get VAPID public key from environment or use default for development
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLaMgoIFakVLMFGqbNWfyHXisoWvSSfHZsF_ES5ej36xmd5-5qBX8w';
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      
      // Save subscription for this user
      console.log('Push subscription created:', JSON.stringify(subscription));
      toast.success('Push notifications enabled!');
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable push notifications');
    }
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
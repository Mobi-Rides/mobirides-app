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
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Replace with your VAPID public key (Uint8Array)
      applicationServerKey: urlBase64ToUint8Array('<YOUR_PUBLIC_VAPID_KEY_BASE64>'),
    });
    // Send subscription to your backend to store for this user
    console.log('Push subscription:', JSON.stringify(subscription));
    // Example: await fetch('/api/save-subscription', { method: 'POST', body: JSON.stringify(subscription) });
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
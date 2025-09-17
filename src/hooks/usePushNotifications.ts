import { useEffect, useState } from 'react';
import { requestNotificationPermission, subscribeToPush } from '@/utils/pushNotifications';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription();
      }).then(subscription => {
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const enableNotifications = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      await requestNotificationPermission();
      const subscription = await subscribeToPush();
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  };

  const disableNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          toast.success('Push notifications disabled');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    enableNotifications,
    disableNotifications,
  };
}
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    requireInteraction: false,
    actions: data.actions || [],
    data: {
      url: data.url || '/',
      notification_type: data.notification_type || 'general'
    },
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';
  
  // Route to appropriate page based on notification type
  if (notificationData.notification_type === 'message') {
    targetUrl = '/messages';
  } else if (notificationData.notification_type === 'booking') {
    targetUrl = '/bookings';
  } else if (notificationData.notification_type === 'wallet') {
    targetUrl = '/wallet';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
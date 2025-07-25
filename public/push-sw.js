self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    data: data.url || '/',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.openWindow(url));
}); 
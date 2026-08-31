// Service Worker for Colegio Gabriel René Moreno II (PWA + FCM Web Push)

const CACHE_NAME = 'colegio-grm-static-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push Event: Handle background push messages
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { notification: { title: 'Colegio Gabriel René Moreno II', body: event.data.text() } };
    }
  }

  const title = (data.notification && data.notification.title) || 'Colegio Gabriel René Moreno II';
  const body = (data.notification && data.notification.body) || 'Tiene una nueva notificación académica.';
  const payloadData = data.data || {};
  const notificationId = payloadData.notification_id || '';
  const targetUrl = payloadData.url || (notificationId ? `/guardian/notifications/${notificationId}` : '/guardian/inbox');

  const options = {
    body: body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: targetUrl,
      notification_id: notificationId
    },
    vibrate: [200, 100, 200],
    tag: notificationId || 'academic-alert',
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click: Focus existing window or open target deep link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/guardian/inbox';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

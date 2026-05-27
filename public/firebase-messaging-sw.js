/* ─────────────────────────────────────────────────────────────────────────────
 * Firebase Cloud Messaging — Service Worker
 * This file MUST live at the root URL (/firebase-messaging-sw.js).
 * Handles background push messages when the app is not in the foreground.
 * ─────────────────────────────────────────────────────────────────────────────
 */

importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

// Firebase config is injected at build time via the service worker registration
// in pushNotificationService.ts, which passes the config through the URL or
// by reading window.FIREBASE_CONFIG. The compat SDK allows self.FIREBASE_CONFIG
// to be set before this script loads. Fallback: read from the SW query param.
const configParam = new URL(self.location).searchParams.get('firebaseConfig');
const firebaseConfig = configParam
  ? JSON.parse(decodeURIComponent(configParam))
  : self.FIREBASE_CONFIG || {};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  const title   = payload.notification?.title  || 'THE CCN DAILY';
  const body    = payload.notification?.body   || 'You have a new message.';
  const icon    = payload.notification?.icon   || '/logo-icon.webp';
  const badge   = '/logo-icon.webp';
  const data    = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    data,
    tag: data.tag || 'ccn-notification',
    renotify: false,
  });
});

// Notification click — bring app to foreground and navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

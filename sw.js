// Paws & Chaos – Service Worker
// ACE Digital Global © 2026

const CACHE_NAME = 'paws-chaos-v1';
const ASSETS = [
  './paws-and-chaos.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.png'
];

// ── Install: pre-cache all assets ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching Paws & Chaos assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first strategy (game works fully offline) ───────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache; also refresh in background
        const fetchUpdate = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {/* offline – that's fine, we have cache */});
        return cached;
      }
      // Not in cache – fetch network
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── Push notifications (future: daily chaos challenges) ──────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: 'Paws & Chaos',
    body: 'Your daily chaos challenge is ready! 🐾',
    icon: './icon-192.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: './favicon.png',
      vibrate: [200, 100, 200],
      tag: 'paws-chaos-daily'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./paws-and-chaos.html'));
});

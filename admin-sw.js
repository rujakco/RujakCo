const CACHE_NAME = 'rujakco-admin-v1';
const urlsToCache = [
  '/admin.html',
  '/admin-manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Notifikasi push (opsional, untuk notifikasi server)
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Pesanan Baru', body: 'Ada pesanan baru masuk!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp',
      badge: 'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/logo.webp',
      vibrate: [200, 100, 200]
    })
  );
});
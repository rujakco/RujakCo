// service-worker.js (Auto Update Real-Time)
const CACHE_NAME = 'rujakco-' + Date.now();

self.addEventListener('install', event => {
  // Hapus semua cache lama
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  // Skip waiting → langsung aktifkan SW baru
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Klaim semua halaman yang terbuka
  event.waitUntil(clients.claim());
  // Beritahu semua halaman bahwa ada update
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
});

// Strategi: Network First (utamakan jaringan)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request))
  );
});
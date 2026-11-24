const CACHE = 'pto-tracker-v1.3.6';
const FILES = [
  './', './index.html', './styles.css?v=1.3.6', './app.js?v=1.3.6',
  './theme.js?v=1.3.6', './manifest.webmanifest', './icon.svg',
  './about.html', './privacy.html', './terms.html',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('pto-tracker-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const app = await cache.match('./index.html');
        if (app) return app;
      }
      throw error;
    }
  })());
});

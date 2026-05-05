const CACHE_NAME = 'bewa-v1';

// We want to pull new changes aggressively
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS, skip other schemes like chrome-extension://
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
      .then((response) => response || new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } }))
  );
});

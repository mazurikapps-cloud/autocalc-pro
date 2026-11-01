
const CACHE_NAME = 'autocalc-v2';
const BASE_URL = new URL(self.registration.scope);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        BASE_URL.href,
        new URL('index.html', BASE_URL).href,
        new URL('manifest.json', BASE_URL).href,
        new URL('icon-192.png', BASE_URL).href,
        new URL('icon-512.png', BASE_URL).href
      ]);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === 'navigate') {
          return caches.match(
            new URL('index.html', BASE_URL).href
          );
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline'
        });
      })
  );
});

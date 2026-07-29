/* ═══════════════════════════════════════════════════
   ShiftScan Pro — Service Worker
   Strategy: network-first, fall back to cache only if offline.
   Bump CACHE_VERSION on every deploy so old cached copies
   on iPads get replaced automatically.
═══════════════════════════════════════════════════ */
const CACHE_VERSION = 'shiftscan-v6';
const CACHE_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];
// Install: pre-cache the core files for this version
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});
// Activate: delete any cache that isn't the current version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});
// Fetch: network-first. Only touches same-origin static files —
// never intercepts calls to the Azure API (different origin, so
// this fetch handler never even sees those requests).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
// Let the page tell a waiting service worker to activate immediately
// (used by the "update available" reload banner in index.html)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

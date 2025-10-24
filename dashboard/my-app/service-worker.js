// Minimal no-op service worker (keeps default network behavior)
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
// Optional: passthrough fetch (no caching)
self.addEventListener('fetch', () => {});

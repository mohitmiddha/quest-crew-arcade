// Quest Crew Arcade — service worker
// Caches the app shell so the arcade installs as an app and still opens if offline.
const CACHE_NAME = 'qca-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './good-paws-crew.html',
  './star-voyagers.html',
  './time-trekkers.html',
  './passport-quest.html',
  './world-wonders-builder.html',
  './fact-defenders.html',
  './word-wizards.html',
  './fact-racers.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for app shell pages/assets, falling back to network; network-first for
// everything else (e.g. the trailer video) so updates still show up without bloating the cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isShellAsset = APP_SHELL.some((path) => url.pathname.endsWith(path.replace('./', '/')) || url.pathname.endsWith(path.replace('./', '')));

  if (isShellAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached))
    );
  } else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});

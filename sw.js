// Quest Crew Arcade — service worker
// Caches the app shell so the arcade installs as an app and still opens if offline.
// IMPORTANT: HTML pages use network-first so edits always show up right away; only truly
// static assets (icons, manifest) use cache-first.
const CACHE_NAME = 'qca-cache-v2';
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

const STATIC_ASSETS = [
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

function isStaticAsset(url) {
  return STATIC_ASSETS.some((path) => url.pathname.endsWith(path.replace('./', '/')) || url.pathname.endsWith(path.replace('./', '')));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first: always try to get the latest page; only fall back to cache if offline.
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else if (isStaticAsset(url)) {
    // Cache-first: these rarely change.
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached))
    );
  } else {
    // Everything else (video, etc.): network-first, cache fallback.
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});

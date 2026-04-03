const CACHE_NAME = 'netrunner-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/theme.css',
  '/css/game.css',
  '/js/state.js',
  '/js/audio.js',
  '/js/upgrades.js',
  '/js/engine.js',
  '/js/shop.js',
  '/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

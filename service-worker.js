const CACHE_NAME = 'afrn-football-v1';
const APP_SHELL = [
  './', './index.html', './login.html', './club-dashboard.html',
  './clubs.html', './players.html', './transfers.html', './competitions.html',
  './matches.html', './reports.html', './accounts.html', './reset-password.html',
  './supabase-config.js', './manifest.json', './css/style.css',
  './IMG-20260319-WA0093.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./login.html')))
  );
});

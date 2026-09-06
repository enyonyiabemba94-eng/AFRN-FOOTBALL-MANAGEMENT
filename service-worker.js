const CACHE_NAME = 'afrn-football-v5';
const APP_SHELL = [
  './', './app.html', './index.html', './login.html', './club-dashboard.html',
  './clubs.html', './players.html', './player-profile.html', './transfers.html', './competitions.html',
  './matches.html', './reports.html', './accounts.html', './contracts.html', './reset-password.html',
  './supabase-config.js', './supabase-config-original.js', './afrn-transfer-workflow.js', './manifest.json', './css/style.css',
  './IMG-20260319-WA0093.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(async response => {
    if(url.pathname.endsWith('/transfers.html') || url.pathname.endsWith('/transfers.html/')){
      try{
        const text = await response.clone().text();
        if(!text.includes('afrn-transfer-workflow.js')){
          const injected = text.replace(/<\/body>/i,'<script src="./afrn-transfer-workflow.js"></script></body>');
          response = new Response(injected,{status:response.status,statusText:response.statusText,headers:response.headers});
        }
      }catch(e){}
    }
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./app.html'))));
});

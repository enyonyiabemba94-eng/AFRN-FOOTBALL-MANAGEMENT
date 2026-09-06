const CACHE_NAME = 'afrn-football-v10';
const APP_SHELL = [
  './','./app.html','./index.html','./login.html','./club-dashboard.html','./clubs.html','./players.html','./player-profile.html','./transfers.html','./competitions.html','./matches.html','./reports.html','./accounts.html','./contracts.html','./reset-password.html',
  './supabase-config.js','./supabase-config-original.js','./afrn-transfer-workflow.js','./afrn-registration-workflow.js','./afrn-standings-workflow.js','./afrn-standings-ui.js','./afrn-dashboard-standings.js','./afrn-realtime.js','./manifest.json','./css/style.css','./IMG-20260319-WA0093.jpg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(async response=>{
  const inject={
   '/transfers.html':'afrn-transfer-workflow.js','/players.html':'afrn-registration-workflow.js','/matches.html':'afrn-standings-workflow.js','/competitions.html':'afrn-standings-ui.js','/index.html':'afrn-dashboard-standings.js','/club-dashboard.html':'afrn-dashboard-standings.js'
  };
  const key=Object.keys(inject).find(k=>url.pathname.endsWith(k));
  if(key)try{const text=await response.clone().text(),script=inject[key];if(!text.includes(script))response=new Response(text.replace(/<\/body>/i,`<script src="./${script}"></script></body>`),{status:response.status,statusText:response.statusText,headers:response.headers});}catch(e){}
  const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return response;
 }).catch(()=>caches.match(event.request).then(c=>c||caches.match('./app.html'))));
});

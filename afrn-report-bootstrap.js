(()=>{
'use strict';
window.setStatus=window.setStatus||function(message,type=''){
  const el=document.getElementById('status');
  if(el){el.textContent=String(message||'');el.className='status '+String(type||'');}
};
if(window.supabase&&typeof window.supabase.createClient==='function')return;
const urls=[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
];
let i=0;
const load=()=>{
  if(window.supabase&&typeof window.supabase.createClient==='function')return;
  if(i>=urls.length){console.error('AFRN Supabase: all CDNs failed');return;}
  const s=document.createElement('script');
  s.src=urls[i++];
  s.async=true;
  let done=false;
  const next=()=>{if(done)return;done=true;s.remove();load()};
  s.onload=()=>{done=true;console.info('AFRN Supabase loaded:',s.src)};
  s.onerror=next;
  document.head.appendChild(s);
  setTimeout(()=>{if(!done&&!window.supabase)next()},8000);
};
load();
})();
// AFRN Reports resilient Supabase loader 2026-09-07
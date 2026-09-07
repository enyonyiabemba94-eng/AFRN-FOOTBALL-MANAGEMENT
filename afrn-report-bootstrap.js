(()=>{
'use strict';
const UMD='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
const ready=()=>!!(window.supabase&&typeof window.supabase.createClient==='function');
if(ready()){
  window.dispatchEvent(new Event('afrn:supabase-ready'));
}else{
  const s=document.createElement('script');
  s.src=UMD;
  s.async=false;
  s.onload=()=>window.dispatchEvent(new Event('afrn:supabase-ready'));
  s.onerror=()=>console.error('AFRN Supabase loader failed');
  (document.head||document.documentElement).appendChild(s);
}
})();
// AFRN Reports loader refresh: 2026-09-07
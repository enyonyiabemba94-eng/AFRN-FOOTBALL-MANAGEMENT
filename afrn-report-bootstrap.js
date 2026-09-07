(()=>{
'use strict';
const A='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
const B='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
if(!(window.supabase&&typeof window.supabase.createClient==='function')){
  document.write('<script src="'+A+'"><\\/script>');
  document.write('<script src="'+B+'"><\\/script>');
}
})();
// AFRN Reports loader: dual CDN fallback 2026-09-08
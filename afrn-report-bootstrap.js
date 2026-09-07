(()=>{
'use strict';
window.setStatus=window.setStatus||function(message,type=''){
  const el=document.getElementById('status');
  if(el){el.textContent=String(message||'');el.className='status '+String(type||'');}
};
if(window.supabase&&typeof window.supabase.createClient==='function')return;
const A='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
const B='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
// Parser-blocking loader: Reports must not execute before Supabase exists.
document.write('<script src="'+A+'" onerror="this.onerror=null;this.src=\''+B+'\'"><\\/script>');
})();
// AFRN Reports blocking Supabase loader 2026-09-07
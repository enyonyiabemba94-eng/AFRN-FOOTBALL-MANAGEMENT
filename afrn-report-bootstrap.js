(()=>{
'use strict';
window.setStatus=window.setStatus||function(message,type=''){
  const el=document.getElementById('status');
  if(el){el.textContent=String(message||'');el.className='status '+String(type||'');}
};
const A='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
if(!(window.supabase&&typeof window.supabase.createClient==='function')){
  document.write('<script src="'+A+'"><\/script>');
}
})();
// AFRN Reports stable Supabase bootstrap 2026-09-09

(()=>{
'use strict';
window.setStatus=window.setStatus||function(message,type=''){
 const el=document.getElementById('status');
 if(el){el.textContent=String(message||'');el.className='status '+String(type||'');}
};
const U='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
if(!(window.supabase&&typeof window.supabase.createClient==='function')){
 document.write('<script src="'+U+'"><\/script>');
}
})();
// AFRN Reports parser-blocking Supabase bootstrap 2026-09-11

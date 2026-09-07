(()=>{
'use strict';
window.setStatus=window.setStatus||function(message,type=''){
 const el=document.getElementById('status');
 if(el){el.textContent=String(message||'');el.className='status '+String(type||'');}
};
const ready=()=>window.supabase&&typeof window.supabase.createClient==='function';
const loadRuntimeFix=()=>{
 if(window.__AFRN_RUNTIME_FIX_LOADING__||window.__AFRN_REPORT_RUNTIME_FIX__)return;
 window.__AFRN_RUNTIME_FIX_LOADING__=true;
 const s=document.createElement('script');
 s.src='./afrn-report-runtime-fix.js?v=20260907';
 s.async=false;
 s.onload=()=>{window.__AFRN_RUNTIME_FIX_LOADING__=false;if(ready()&&typeof window.startReports==='function')window.startReports();};
 s.onerror=()=>{window.__AFRN_RUNTIME_FIX_LOADING__=false;window.setStatus('❌ Reports runtime haikupatikana.','err');};
 document.head.appendChild(s);
};
if(!ready()){
 const A='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
 const B='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
 document.write('<script src="'+A+'" onerror="this.onerror=null;this.src=\''+B+'\'"><\\/script>');
}
let n=0;
const boot=()=>{
 n++;
 if(typeof window.startReports==='function'&&ready()){
  window.startReports();
  return;
 }
 if(n===10)loadRuntimeFix();
 if(n<240)setTimeout(boot,100);
 else window.setStatus('❌ Reports haikuweza kuanzisha Supabase.','err');
};
setTimeout(boot,0);
})();
// AFRN Reports resilient Supabase bootstrap + runtime fallback 2026-09-07

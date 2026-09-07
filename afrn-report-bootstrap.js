(()=>{
'use strict';
if(window.supabase?.createClient)return;
try{
  document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"><\/script>');
}catch(e){
  console.error('AFRN Supabase bootstrap failed',e);
}
})();

(()=>{
'use strict';
const UMD='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
if(!(window.supabase&&typeof window.supabase.createClient==='function')){
  document.write('<script src="'+UMD+'"><\/script>');
}
})();
// AFRN Reports loader: parser-blocking UMD
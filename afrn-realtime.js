(()=>{
'use strict';
const db=window.supabaseClient;
if(!db||window.__AFRN_REALTIME__)return;
window.__AFRN_REALTIME__=true;
const tables=['players','transfers','player_contracts','matches','competitions','clubs','standings'];
let timer=null;
function refresh(){
 clearTimeout(timer);
 timer=setTimeout(()=>{
  const frame=document.getElementById('screen');
  if(!frame)return;
  const src=frame.getAttribute('src')||'';
  if(!src||src.includes('login.html'))return;
  const base=src.split('?')[0];
  if(!/\.html$/i.test(base))return;
  const url=base+(src.includes('?')?src.slice(src.indexOf('?')):'');
  frame.src=url;
  const toast=document.getElementById('toast');
  if(toast){toast.textContent='🔄 Taarifa mpya zimewasili';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
 },450);
}
const channel=db.channel('afrn-live-updates');
tables.forEach(table=>channel.on('postgres_changes',{event:'*',schema:'public',table},()=>refresh()));
channel.subscribe();
})();

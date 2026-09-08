(()=>{
'use strict';
if(window.__AFRN_MATCH_CENTER_FINAL_FIX_V2__)return;
window.__AFRN_MATCH_CENTER_FINAL_FIX_V2__=true;
const db=()=>window.supabaseClient||window.supabase;
const mid=()=>String(window.currentMatchId||document.getElementById('editMatchId')?.value||'');

/* Remove ONLY the old standalone Match Events card. Never scan/remove arbitrary divs. */
function removeLegacyEvents(){
  const headings=[...document.querySelectorAll('h2,h3')].filter(h=>{
    const t=(h.textContent||'').replace(/\s+/g,' ').trim();
    return /MATCH EVENTS\s*[—-]\s*GOLI,\s*KADI\s*&\s*MABADILIKO/i.test(t) || /🎬\s*MATCH EVENTS/i.test(t);
  });
  headings.forEach(h=>{
    const section=h.closest('section.card,section,.card');
    if(section && !section.querySelector('#afrnMatchEventsEmbedded')) section.remove();
  });
}

function checks(side,type){
  return [...document.querySelectorAll(`input[data-side="${side}"][data-type="${type}"][data-player-id]`)];
}
function enforceUi(side){
  const starts=new Set(checks(side,'starting').filter(x=>x.checked).map(x=>String(x.dataset.playerId||'')));
  checks(side,'substitute').forEach(x=>{
    const duplicate=starts.has(String(x.dataset.playerId||''));
    if(duplicate && x.checked)x.checked=false;
    x.disabled=duplicate;
    const row=x.closest('.player-row');
    if(row){
      row.style.display=duplicate?'none':'';
      row.style.opacity=duplicate?'.45':'';
      row.title=duplicate?'Mchezaji huyu yuko Starting XI':'';
    }
  });
}
function enforceAll(){enforceUi('home');enforceUi('away');}

async function cleanDbDuplicates(){
  const D=db(),match=mid();
  if(!D?.from||!match)return;
  try{
    const r=await D.from('match_events').select('id,player_id,event_type').eq('match_id',match).in('event_type',['lineup_starting','lineup_substitute']);
    if(r.error||!r.data)return;
    const starts=new Set(r.data.filter(x=>x.event_type==='lineup_starting').map(x=>String(x.player_id)));
    const dup=r.data.filter(x=>x.event_type==='lineup_substitute'&&starts.has(String(x.player_id))).map(x=>x.id).filter(Boolean);
    if(dup.length)await D.from('match_events').delete().in('id',dup);
  }catch(e){console.warn('AFRN lineup duplicate cleanup:',e.message||e)}
}

function hookCheckboxes(){
  document.addEventListener('change',e=>{
    const x=e.target;
    if(!(x instanceof HTMLInputElement)||!x.matches('input[data-side][data-type][data-player-id]'))return;
    const side=x.dataset.side;
    if(x.dataset.type==='starting' && x.checked){
      const sub=checks(side,'substitute').find(s=>String(s.dataset.playerId||'')===String(x.dataset.playerId||''));
      if(sub){sub.checked=false;sub.disabled=true;}
    }
    enforceUi(side);
  },true);
}

function hookSave(){
  const original=window.saveLineups;
  if(typeof original!=='function'||original.__afrnFinalFixV2)return false;
  const wrapped=async function(){
    enforceAll();
    const result=await original.apply(this,arguments);
    await cleanDbDuplicates();
    enforceAll();
    return result;
  };
  wrapped.__afrnFinalFixV2=true;
  window.saveLineups=wrapped;
  return true;
}

function boot(){
  if(!/matches\.html$/i.test(location.pathname))return;
  removeLegacyEvents();
  hookCheckboxes();
  hookSave();
  enforceAll();
  cleanDbDuplicates();
}

const observer=new MutationObserver(()=>{
  if(!/matches\.html$/i.test(location.pathname))return;
  removeLegacyEvents();
  hookSave();
  enforceAll();
});
const start=()=>{boot();observer.observe(document.documentElement,{childList:true,subtree:true});[300,700,1400,2500,4000].forEach(t=>setTimeout(boot,t));};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

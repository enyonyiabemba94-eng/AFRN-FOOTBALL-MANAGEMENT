(()=>{
'use strict';
if(window.__AFRN_PLAYER_PHOTO_GLOBAL__)return;
window.__AFRN_PLAYER_PHOTO_GLOBAL__=true;
const BUCKET='AFRN PLAYER PHOTOS';
const isHttp=v=>/^https?:\/\//i.test(String(v||'').trim());
const normalize=v=>String(v||'').trim().replace(/^\/+/, '').replace(/^AFRN%20PLAYER%20PHOTOS\//i,'').replace(/^AFRN PLAYER PHOTOS\//i,'');
const resolve=v=>{
  const value=String(v||'').trim();
  if(!value)return '';
  if(isHttp(value))return value;
  const db=window.supabaseClient||window.supabase;
  if(!db?.storage)return '';
  const path=normalize(value);
  return db.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl||'';
};
const fix=img=>{
  if(!img||img.dataset.afrnPhotoResolved==='1')return;
  const raw=img.getAttribute('src')||img.dataset.photo||img.dataset.src||'';
  if(!raw||isHttp(raw)||!/^\/?(?:players\/|AFRN(?:%20| )PLAYER(?:%20| )PHOTOS\/players\/)/i.test(raw))return;
  const url=resolve(raw);
  if(url){img.src=url;img.dataset.afrnPhotoResolved='1';}
};
const scan=()=>document.querySelectorAll('img').forEach(fix);
const start=()=>{scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* AFRN Match Center production fixes */
(()=>{const load=()=>{if(!/matches\.html$/i.test(location.pathname)||window.__AFRN_MATCH_FIX_LOADED__)return;window.__AFRN_MATCH_FIX_LOADED__=true;const s=document.createElement('script');s.src='./afrn-match-center-fix.js?v=20260907';s.async=false;(document.head||document.documentElement).appendChild(s);const b=document.createElement('script');b.src='./afrn-competition-match-sync.js?v=20260907';b.async=false;(document.head||document.documentElement).appendChild(b);setTimeout(()=>{if(window.__AFRN_DISCIPLINE_LINEUP_HOOK__)return;window.__AFRN_DISCIPLINE_LINEUP_HOOK__=true;const D=window.supabaseClient||window.supabase;const norm=v=>String(v??'').trim().toLowerCase();const hook=()=>{const original=window.saveLineups;if(typeof original!=='function'||original.__afrnDisciplineHook)return false;const wrapped=async function(){const checks=[...document.querySelectorAll('.lineup-check:checked')].map(x=>x.getAttribute('data-player-id')).filter(Boolean);if(checks.length&&D?.from){try{const r=await D.from('match_events').select('player_id,event_type,minute,description').in('player_id',[...new Set(checks)]);if(r.error)throw r.error;const map=new Map();(r.data||[]).forEach(e=>{const id=String(e.player_id),t=norm(e.event_type),z=map.get(id)||{y:0,r:0};if(/yellow|yc|njano/.test(t))z.y++;if(/red|rc|nyekundu/.test(t))z.r++;map.set(id,z)});const flagged=checks.map(String).filter(id=>{const z=map.get(id);return z&&(z.r>0||z.y>=2)});if(flagged.length){const names=flagged.map(id=>{const row=document.querySelector('.lineup-check[data-player-id="'+CSS.escape(id)+'"]')?.closest('.player-row');return row?.querySelector('.player-name')?.textContent?.trim()||id});const detail=flagged.map((id,i)=>{const z=map.get(id);return names[i]+' — '+(z.r?'🟥 Red Card':'🟨 '+z.y+' Yellow Cards')}).join('\n');const ok=confirm('⚠️ DISCIPLINARY REVIEW\n\nMchezaji hawa wana rekodi ya kadi kwenye Match Events:\n\n'+detail+'\n\nHakuna suspension inayodaiwa moja kwa moja; huu ni ukaguzi wa nidhamu.\n\nEndelea kuhifadhi line-up?');if(!ok)return}}catch(e){console.warn('AFRN lineup disciplinary review:',e.message||e)}}return original.apply(this,arguments)};wrapped.__afrnDisciplineHook=true;window.saveLineups=wrapped;return true};[300,800,1600,3000].forEach(t=>setTimeout(hook,t));},50)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else setTimeout(load,0)})();
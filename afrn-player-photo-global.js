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

/* AFRN Club Admin player-registration UI lock */
(()=>{
  'use strict';
  const run=async()=>{
    if(!/players\.html$/i.test(location.pathname))return;
    const db=window.supabaseClient||window.supabase;
    if(!db?.auth?.getSession)return;
    try{
      const {data:{session}}=await db.auth.getSession();
      if(!session)return;
      const {data:p,error}=await db.from('profiles').select('role,club_id').eq('id',session.user.id).maybeSingle();
      if(error||!p)return;
      const role=String(p.role||'').toLowerCase();
      if(!['club_admin','club','club_account'].includes(role)||!p.club_id)return;
      const sel=document.getElementById('clubId');
      if(!sel)return;
      const {data:club,error:ce}=await db.from('clubs').select('id,name,division').eq('id',p.club_id).maybeSingle();
      if(ce||!club)return;
      const label=(club.name||'Klabu yako')+(club.division?' — '+club.division:'');
      sel.innerHTML='';
      const opt=document.createElement('option');
      opt.value=club.id;
      opt.textContent=label;
      opt.selected=true;
      sel.appendChild(opt);
      sel.value=club.id;
      sel.setAttribute('data-afrn-club-locked','1');
      sel.style.background='#eef4ff';
      sel.style.fontWeight='700';
      sel.title='Club Admin anaweza kusajili wachezaji wa klabu yake pekee.';
      sel.addEventListener('change',()=>{sel.value=club.id;});
      const idField=document.getElementById('playerIdNumber');
      if(idField){idField.value='';idField.readOnly=true;idField.placeholder='Automatic — AFRN ita-generate Player ID';idField.title='Player ID hutengenezwa automatic na AFRN.';}
      const status=document.getElementById('status');
      if(status){status.textContent='⚽ Club Admin: usajili wa mchezaji wa '+(club.name||'klabu yako')+' pekee. Player ID itatengenezwa automatic; usajili utaenda PENDING kwa AFRN approval.';status.className='status warning';}
    }catch(e){console.warn('AFRN club player lock:',e.message||e)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,250));
  else setTimeout(run,250);
})();
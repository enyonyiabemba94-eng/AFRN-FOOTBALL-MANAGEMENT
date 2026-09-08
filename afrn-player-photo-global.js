(()=>{
'use strict';
if(window.__AFRN_PLAYER_PHOTO_GLOBAL__)return;
window.__AFRN_PLAYER_PHOTO_GLOBAL__=true;
const BUCKET='AFRN PLAYER PHOTOS';
const isHttp=v=>/^https?:\/\//i.test(String(v||'').trim());
const normalize=v=>String(v||'').trim().replace(/^\/+/, '').replace(/^AFRN%20PLAYER%20PHOTOS\//i,'').replace(/^AFRN PLAYER PHOTOS\//i,'');
const resolve=v=>{const value=String(v||'').trim();if(!value)return '';if(isHttp(value))return value;const db=window.supabaseClient||window.supabase;if(!db?.storage)return '';const path=normalize(value);return db.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl||'';};
const fix=img=>{if(!img||img.dataset.afrnPhotoResolved==='1')return;const raw=img.getAttribute('src')||img.dataset.photo||img.dataset.src||'';if(!raw||isHttp(raw)||!/^\/?(?:players\/|AFRN(?:%20| )PLAYER(?:%20| )PHOTOS\/players\/)/i.test(raw))return;const url=resolve(raw);if(url){img.src=url;img.dataset.afrnPhotoResolved='1';}};
const scan=()=>document.querySelectorAll('img').forEach(fix);
const start=()=>{scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

(()=>{const load=()=>{if(!/matches\.html$/i.test(location.pathname)||window.__AFRN_MATCH_FIX_LOADED__)return;window.__AFRN_MATCH_FIX_LOADED__=true;const s=document.createElement('script');s.src='./afrn-match-center-fix.js?v=20260907';s.async=false;(document.head||document.documentElement).appendChild(s);const b=document.createElement('script');b.src='./afrn-competition-match-sync.js?v=20260907';b.async=false;(document.head||document.documentElement).appendChild(b);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else setTimeout(load,0)})();

/* Club Admin: lock player registration to the logged-in club. */
(()=>{
'use strict';
const run=async()=>{
 if(!/players\.html$/i.test(location.pathname))return;
 const db=window.supabaseClient||window.supabase;if(!db?.auth?.getSession)return;
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:p,error}=await db.from('profiles').select('role,club_id').eq('id',session.user.id).maybeSingle();if(error||!p)return;
  const role=String(p.role||'').toLowerCase();if(!['club_admin','club','club_account'].includes(role)||!p.club_id)return;
  const sel=document.getElementById('clubId');if(!sel)return;
  const {data:club,error:ce}=await db.from('clubs').select('id,name,division').eq('id',p.club_id).maybeSingle();if(ce||!club)return;
  sel.innerHTML='';const opt=document.createElement('option');opt.value=club.id;opt.textContent=(club.name||'Klabu yako')+(club.division?' — Daraja '+club.division:'');opt.selected=true;sel.appendChild(opt);sel.value=club.id;
  sel.disabled=true;sel.setAttribute('data-afrn-club-locked','1');sel.style.background='#eef4ff';sel.style.fontWeight='700';sel.title='Club Admin anaweza kusajili wachezaji wa klabu yake pekee.';
  const status=document.getElementById('statusField');if(status){status.value='PENDING_APPROVAL';status.disabled=true;status.title='Usajili wa Club Admin lazima upitie AFRN approval.';}
  const idField=document.getElementById('playerIdNumber');if(idField){idField.value='';idField.readOnly=true;idField.placeholder='Automatic — AFRN ita-generate Player ID';}
  const banner=document.getElementById('status');if(banner){banner.textContent='⚽ Club Admin: '+club.name+' pekee • Usajili utaenda PENDING kwa AFRN approval • Player ID automatic.';banner.className='status warning';}
  const form=document.getElementById('playerForm');if(form&&!form.dataset.afrnClubGuard){form.dataset.afrnClubGuard='1';form.addEventListener('submit',()=>{sel.disabled=false;sel.value=club.id; if(status)status.disabled=false;},true);}
 }catch(e){console.warn('AFRN club player lock:',e.message||e)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,400));else setTimeout(run,400);
})();
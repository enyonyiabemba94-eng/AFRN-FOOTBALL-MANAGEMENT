(()=>{
'use strict';
if(window.__AFRN_PLAYER_PHOTO_GLOBAL__)return;
window.__AFRN_PLAYER_PHOTO_GLOBAL__=true;
if(!window.db&&window.supabase?.createClient)window.db=window.supabase.createClient('https://jjqhvruppafpumcthmwe.supabase.co','sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G');
const BUCKET='AFRN PLAYER PHOTOS';
const isHttp=v=>/^https?:\/\//i.test(String(v||'').trim());
const normalize=v=>String(v||'').trim().replace(/^\/+/, '').replace(/^AFRN%20PLAYER%20PHOTOS\//i,'').replace(/^AFRN PLAYER PHOTOS\//i,'');
const resolve=v=>{const value=String(v||'').trim();if(!value)return '';if(isHttp(value))return value;const db=window.supabaseClient||window.db||window.supabase;if(!db?.storage)return '';const path=normalize(value);return db.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl||'';};
const fix=img=>{if(!img||img.dataset.afrnPhotoResolved==='1')return;const raw=img.getAttribute('src')||img.dataset.photo||img.dataset.src||'';if(!raw||isHttp(raw)||!/^\/?(?:players\/|AFRN(?:%20| )PLAYER(?:%20| )PHOTOS\/players\/)/i.test(raw))return;const url=resolve(raw);if(url){img.src=url;img.dataset.afrnPhotoResolved='1';}};
const scan=()=>document.querySelectorAll('img').forEach(fix);
const start=()=>{scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

(()=>{const load=()=>{if(!/matches\.html$/i.test(location.pathname))return;if(!window.__AFRN_MATCH_FIX_LOADED__){window.__AFRN_MATCH_FIX_LOADED__=true;const s=document.createElement('script');s.src='./afrn-match-center-fix.js?v=20260908';s.async=false;(document.head||document.documentElement).appendChild(s)}if(!window.__AFRN_MATCH_EVENTS_UI_LOADED__){window.__AFRN_MATCH_EVENTS_UI_LOADED__=true;const e=document.createElement('script');e.src='./afrn-match-events-ui.js?v=20260911';e.async=false;(document.head||document.documentElement).appendChild(e)}if(!window.__AFRN_MATCH_FINAL_FIX_LOADED__){window.__AFRN_MATCH_FINAL_FIX_LOADED__=true;const f=document.createElement('script');f.src='./afrn-match-center-final-fix.js?v=20260913';f.async=false;(document.head||document.documentElement).appendChild(f)}if(!window.__AFRN_COMP_MATCH_SYNC_LOADED__){window.__AFRN_COMP_MATCH_SYNC_LOADED__=true;const b=document.createElement('script');b.src='./afrn-competition-match-sync.js?v=20260908';b.async=false;(document.head||document.documentElement).appendChild(b)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else setTimeout(load,0)})();
(()=>{const load=()=>{if(!/transfers\.html$/i.test(location.pathname)||window.__AFRN_TRANSFER_REQUEST_WORKFLOW_LOADED__)return;window.__AFRN_TRANSFER_REQUEST_WORKFLOW_LOADED__=true;const s=document.createElement('script');s.src='./afrn-transfer-request-workflow.js?v=20260908';s.async=false;(document.head||document.documentElement).appendChild(s)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else setTimeout(load,0)})();
(()=>{const load=()=>{if(!/players\.html$/i.test(location.pathname)||window.__AFRN_TWO_LEVEL_REGISTRATION_LOADED__)return;window.__AFRN_TWO_LEVEL_REGISTRATION_LOADED__=true;const s=document.createElement('script');s.src='./afrn-two-level-registration.js?v=20260910';s.async=false;(document.head||document.documentElement).appendChild(s)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else setTimeout(load,250)})();

/* =========================
   CLUB ADMIN PLAYER PRIVACY
========================= */
(()=>{
const run=async()=>{
 if(!/players\.html$/i.test(location.pathname))return;
 const db=window.supabaseClient||window.db;if(!db?.auth?.getSession)return;
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:p,error:pe}=await db.from('profiles').select('role,club_id,full_name').eq('id',session.user.id).maybeSingle();if(pe||!p)return;
  const role=String(p.role||'').toLowerCase();if(!['club_admin','club','club_account'].includes(role))return;
  window.__AFRN_CLUB_ADMIN__=true;
  const {data:rows}=await db.from('players').select('id,club_id');
  const ownIds=new Set((rows||[]).filter(x=>String(x.club_id||'')===String(p.club_id||'')).map(x=>String(x.id)));
  const hideAuthority=()=>{
   const addBtn=[...document.querySelectorAll('button,a')].find(el=>/ongeza\s+mchezaji/i.test(el.textContent||''));
   if(addBtn){addBtn.style.display='none';addBtn.setAttribute('aria-hidden','true');}
   const form=document.getElementById('playerForm');if(form)form.style.display='none';
   const modal=document.getElementById('playerModal');if(modal)modal.style.display='none';
   const banner=document.getElementById('status');if(banner){banner.textContent='🛡️ Club Admin: wachezaji wa timu yako wanaonekana kwa usimamizi wa kawaida. Wachezaji wa timu nyingine wanaonekana kwa picha, jina, timu na Tuma Ombi la Usajili tu.';banner.className='status warning';}
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getPlayerId=card=>{const b=card.querySelector('button[onclick*="editPlayer"]');const m=(b?.getAttribute('onclick')||'').match(/editPlayer\(['"]([^'"]+)/);return m?m[1]:null;};
  const cleanTeam=card=>{const ds=[...card.querySelectorAll('.detail')];const d=ds.find(x=>/klabu|club|timu/i.test(x.textContent||''));if(d){const t=d.textContent.replace(/KLABU|CLUB|TIMU/ig,'').replace(/[:：]/g,'').trim();if(t)return t;}return 'Timu nyingine';};
  const rebuild=()=>{
   hideAuthority();
   document.querySelectorAll('#playersContainer .card').forEach(card=>{
    if(card.dataset.afrnRestricted==='1')return;
    const playerId=getPlayerId(card);if(!playerId)return;
    if(ownIds.has(String(playerId))){card.dataset.afrnOwn='1';return;}
    const team=cleanTeam(card),photo=card.querySelector('img.photo')||card.querySelector('img'),photoSrc=photo?.getAttribute('src')||'',name=card.querySelector('.player-name')?.textContent?.trim()||'Mchezaji';
    card.dataset.afrnRestricted='1';
    card.innerHTML=`<div class="afrn-restricted-player"><div class="afrn-rp-top">${photoSrc?`<img class="afrn-rp-photo" src="${esc(photoSrc)}" alt="Picha ya ${esc(name)}">`:'<div class="afrn-rp-photo-placeholder">👤</div>'}<div><div class="afrn-rp-name">${esc(name)}</div><div class="afrn-rp-team">⚽ ${esc(team)}</div></div></div><button class="afrn-rp-btn" type="button" data-player-id="${esc(playerId)}">📝 Tuma Ombi la Usajili</button></div>`;
    card.querySelector('.afrn-rp-btn').addEventListener('click',()=>window.AFRNRequestRegistration(playerId));
   });
  };
  if(!document.getElementById('afrnRestrictedPlayerCss')){const st=document.createElement('style');st.id='afrnRestrictedPlayerCss';st.textContent=`.afrn-restricted-player{padding:2px}.afrn-rp-top{display:flex;gap:12px;align-items:center}.afrn-rp-photo,.afrn-rp-photo-placeholder{width:72px;height:72px;border-radius:14px;object-fit:cover;background:#eef2f7;border:1px solid #e0e6ef;display:flex;align-items:center;justify-content:center;font-size:28px}.afrn-rp-name{font-size:17px;font-weight:800}.afrn-rp-team{font-size:13px;color:#687386;margin-top:7px;font-weight:700}.afrn-rp-btn{width:100%;margin-top:14px;background:#0d47a1;color:#fff;font-weight:800;padding:12px;border-radius:10px}.afrn-rp-btn:hover{background:#1565c0}`;document.head.appendChild(st)}
  setTimeout(rebuild,1200);setTimeout(rebuild,2500);const target=document.getElementById('playersContainer')||document.body;new MutationObserver(()=>setTimeout(rebuild,150)).observe(target,{childList:true,subtree:true});
 }catch(e){console.warn('AFRN club player privacy:',e.message||e)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,600));else setTimeout(run,600);
})();

window.AFRNRequestRegistration=async function(playerId){
 const db=window.supabaseClient||window.db;
 try{
  if(!db?.auth?.getSession)throw new Error('Supabase haijapatikana');
  const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Hujalogin');
  const {data:p,error:pe}=await db.from('profiles').select('role,club_id').eq('id',session.user.id).maybeSingle();if(pe)throw pe;
  const role=String(p?.role||'').toLowerCase();if(!['club_admin','club','club_account'].includes(role))throw new Error('Ni Club Admin pekee anayeruhusiwa kutuma ombi');
  const {error}=await db.rpc('afrn_request_player_registration',{p_player_id:playerId,p_club_id:p.club_id});if(error)throw error;
  alert('✅ Ombi limetumwa kwa timu inayomiliki mchezaji. Timu hiyo lazima i-Approve kwanza; ndipo AFRN itaweza kuamua.');
  location.reload();
 }catch(e){alert('❌ '+(e?.message||e));}
};

/* =========================
   AFRN NOTIFICATIONS
========================= */
(()=>{
const start=async()=>{
 const db=window.supabaseClient||window.db;if(!db?.auth?.getSession)return;
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const style=document.createElement('style');style.textContent=`#afrnNotifWrap{position:fixed;right:12px;top:12px;z-index:9999}#afrnNotifBell{position:relative;background:#fff;border:1px solid #dce2ea;border-radius:999px;width:44px;height:44px;padding:0;font-size:20px;box-shadow:0 3px 12px #0002}#afrnNotifCount{position:absolute;right:-3px;top:-3px;background:#c62828;color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:800}#afrnNotifPanel{display:none;position:absolute;right:0;top:50px;width:min(360px,92vw);max-height:70vh;overflow:auto;background:#fff;border:1px solid #dce2ea;border-radius:14px;box-shadow:0 12px 40px #0003;padding:12px}.afrn-n-item{padding:10px;border-bottom:1px solid #edf0f4}.afrn-n-item:last-child{border-bottom:0}.afrn-n-title{font-weight:800;font-size:13px}.afrn-n-msg{font-size:12px;margin-top:4px;line-height:1.45}.afrn-n-time{font-size:10px;color:#687386;margin-top:5px}.afrn-n-unread{background:#eef4ff;border-radius:9px}`;document.head.appendChild(style);
  const wrap=document.createElement('div');wrap.id='afrnNotifWrap';wrap.innerHTML='<button id="afrnNotifBell" aria-label="Notifications">🔔<span id="afrnNotifCount" style="display:none">0</span></button><div id="afrnNotifPanel"></div>';document.body.appendChild(wrap);
  const bell=document.getElementById('afrnNotifBell'),panel=document.getElementById('afrnNotifPanel'),count=document.getElementById('afrnNotifCount');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=async()=>{const {data,error}=await db.from('afrn_notifications').select('id,type,title,message,created_at,read_at').order('created_at',{ascending:false}).limit(30);if(error){console.warn('AFRN notifications:',error.message);return;}const rows=data||[];const unread=rows.filter(x=>!x.read_at).length;count.textContent=unread>99?'99+':String(unread);count.style.display=unread?'flex':'none';panel.innerHTML=rows.length?rows.map(n=>`<div class="afrn-n-item ${n.read_at?'':'afrn-n-unread'}" data-notif-id="${esc(n.id)}"><div class="afrn-n-title">${esc(n.title)}</div><div class="afrn-n-msg">${esc(n.message)}</div><div class="afrn-n-time">${new Date(n.created_at).toLocaleString()}</div></div>`).join(''):'<div style="padding:15px;text-align:center;color:#687386">Hakuna notifications mpya.</div>';panel.querySelectorAll('.afrn-n-item').forEach(el=>el.addEventListener('click',async()=>{const id=el.dataset.notifId;await db.from('afrn_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('recipient_user_id',session.user.id);load();}));};
  bell.addEventListener('click',()=>{panel.style.display=panel.style.display==='block'?'none':'block';if(panel.style.display==='block')load();});
  await load();setInterval(load,20000);
 }catch(e){console.warn('AFRN notification UI:',e.message||e)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,900));else setTimeout(start,900);
})();
})();
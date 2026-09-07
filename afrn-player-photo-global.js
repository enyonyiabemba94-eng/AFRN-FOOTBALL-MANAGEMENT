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
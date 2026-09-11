/* AFRN KNOCKOUT CENTER + R16 SCHEDULE
   Visual redesign only: keeps existing knockout engine, pairings, results and match numbers.
   Adds a clean competition center, stage navigation and Admin date/time/venue for R16.
   Uses existing matches.match_date, matches.match_time and matches.venue columns.
*/
(function(){
'use strict';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
let db;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function formatDate(v){if(!v)return '';const p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:v;}
function injectStyle(){
 if($('#afrnKnockoutCenterStyle'))return;
 const s=document.createElement('style');s.id='afrnKnockoutCenterStyle';
 s.textContent=`
 #afrnKOHeader{margin:14px 0 18px}
 .afrn-ko-shell{background:#f7f9fc;border:1px solid #e3e8ef;border-radius:18px;padding:16px;box-shadow:0 8px 28px rgba(15,23,42,.06)}
 .afrn-ko-title{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
 .afrn-ko-title h2{margin:0;font-size:21px;color:#102a43}
 .afrn-ko-title p{margin:4px 0 0;color:#667085;font-size:13px}
 .afrn-ko-badge{background:#102a43;color:#fff;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:700}
 .afrn-ko-tabs{display:flex;gap:8px;overflow:auto;padding:3px 1px 10px;scrollbar-width:thin}
 .afrn-ko-tabs button{border:1px solid #d9e1ea;background:#fff;color:#344054;border-radius:10px;padding:9px 12px;font-weight:700;white-space:nowrap;cursor:pointer}
 .afrn-ko-tabs button:hover{background:#eef5ff}
 .afrn-ko-note{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:10px 12px;color:#667085;font-size:13px;margin-bottom:12px}
 #afrnR16Schedule{margin:0 0 18px}
 .r16s-card{border:1px solid #dfe5ec;border-radius:16px;padding:15px;background:#fff;box-shadow:0 5px 18px rgba(16,42,67,.05)}
 .r16s-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
 .r16s-head h3{margin:0;color:#102a43;font-size:18px}
 .r16s-count{font-size:12px;font-weight:700;background:#eef5ff;color:#175cd3;padding:6px 10px;border-radius:999px}
 .r16s-table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #e4e7ec;border-radius:12px}
 .r16s-table th{background:#f8fafc;color:#475467;font-size:12px;text-transform:uppercase;letter-spacing:.02em}
 .r16s-table th,.r16s-table td{padding:10px 9px;border-bottom:1px solid #eef1f4;text-align:left;vertical-align:middle}
 .r16s-table tr:last-child td{border-bottom:0}
 .r16s-table td:nth-child(2){font-weight:700;color:#1d2939;min-width:190px}
 .r16s-table input{width:100%;min-width:120px;box-sizing:border-box;padding:8px 9px;border:1px solid #d0d5dd;border-radius:9px;background:#fff}
 .r16s-table input:focus{outline:2px solid #b2ddff;border-color:#53b1fd}
 .r16s-save{padding:8px 11px;border:0;border-radius:9px;background:#175cd3;color:#fff;font-weight:700;cursor:pointer}
 .r16s-save:hover{filter:brightness(.95)}
 .r16s-note{font-size:13px;color:#667085;margin:6px 0 12px}
 .r16s-matchno{font-size:11px;color:#667085;font-weight:600}
 #afrnKOTable{margin-top:0}
 #afrnKOTable .ce-card{background:#fff!important;border:1px solid #dfe5ec!important;border-radius:16px!important;box-shadow:0 5px 18px rgba(16,42,67,.05)!important;padding:15px!important;margin:0 0 14px!important}
 #afrnKOTable .ce-card h3{margin:0 0 10px;color:#102a43}
 #afrnKOTable .ce-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
 #afrnKOTable button{border-radius:9px!important;font-weight:700!important}
 #afrnKOTable input,#afrnKOTable select{border-radius:9px!important;border:1px solid #d0d5dd!important;padding:8px!important}
 #afrnKOTable .ce-muted{color:#667085!important}
 @media(max-width:700px){
   .afrn-ko-shell{padding:12px;border-radius:14px}
   .afrn-ko-title h2{font-size:18px}
   .r16s-table{display:block;overflow-x:auto;white-space:nowrap}
   .r16s-table input{min-width:125px}
   .r16s-table th,.r16s-table td{padding:8px}
 }
 `;
 document.head.appendChild(s);
}
function findStageCards(){
 const root=$('#afrnKOTable');if(!root)return [];
 return $$('.ce-card',root).filter(c=>/HATUA YA 16|ROBO FAINALI|NUSU FAINALI|MSHINDI WA TATU|FAINALI/i.test(c.textContent||''));
}
function setupCenter(){
 const kot=$('#afrnKOTable');if(!kot)return;
 injectStyle();
 let head=$('#afrnKOHeader');
 if(!head){
  head=document.createElement('section');head.id='afrnKOHeader';
  head.innerHTML=`<div class="afrn-ko-shell">
    <div class="afrn-ko-title"><div><h2>⚔️ AFRN KNOCKOUT CENTER</h2><p>Droo → Hatua ya 16 → Robo Fainali → Nusu Fainali → Mshindi wa Tatu → Fainali</p></div><span class="afrn-ko-badge">MFUMO RASMI</span></div>
    <div class="afrn-ko-note">📌 <b>Admin:</b> Namba ya mechi, tarehe, muda na uwanja vinaweza kudhibitiwa bila kubadilisha droo au matokeo yaliyopo.</div>
    <div class="afrn-ko-tabs" id="afrnKOTabs"></div>
  </div>`;
  kot.parentNode.insertBefore(head,kot);
 }
 const tabs=$('#afrnKOTabs');
 const defs=[['R16','HATUA YA 16'],['QF','ROBO FAINALI'],['SF','NUSU FAINALI'],['3RD','MSHINDI WA TATU'],['FINAL','FAINALI']];
 tabs.innerHTML=defs.map(([key,label])=>`<button type="button" data-stage="${key}">${label}</button>`).join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  const card=findStageCards().find(c=>new RegExp(b.dataset.stage==='R16'?'HATUA YA 16':b.dataset.stage==='QF'?'ROBO FAINALI':b.dataset.stage==='SF'?'NUSU FAINALI':b.dataset.stage==='3RD'?'MSHINDI WA TATU':'FAINALI','i').test(c.textContent||''));
  if(card)card.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
async function load(){
 db=client();if(!db)return;
 const r=await db.from('matches').select('id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,match_number,notes').like('notes','%AFRN_STAGE=R16%').order('match_number');
 if(r.error)throw r.error;
 const ms=r.data||[];
 const ids=[...new Set(ms.flatMap(m=>[m.home_team_id,m.away_team_id]).filter(Boolean))];
 let clubs=[];
 if(ids.length){const c=await db.from('clubs').select('id,name').in('id',ids);if(!c.error)clubs=c.data||[];}
 const cname=id=>clubs.find(c=>String(c.id)===String(id))?.name||'—';
 setupCenter();renderSchedule(ms,cname);
}
function renderSchedule(ms,cname){
 let root=$('#afrnR16Schedule');
 if(!root){
  root=document.createElement('section');root.id='afrnR16Schedule';
  root.innerHTML=`<div class="r16s-card"><div class="r16s-head"><h3>📅 RATIBA — HATUA YA 16</h3><span class="r16s-count">8 MECHI</span></div><p class="r16s-note">Weka tarehe, muda na uwanja kwa kila mechi. Namba ya mechi inaendelea kutumiwa kama kitambulisho rasmi.</p><div id="afrnR16ScheduleBody"></div></div>`;
  const header=$('#afrnKOHeader');
  if(header)header.parentNode.insertBefore(root,header.nextSibling);else{
   const target=$('#afrnKOTable')||document.querySelector('main')||document.body;target.parentNode.insertBefore(root,target);
  }
 }
 const body=$('#afrnR16ScheduleBody',root);
 if(!ms.length){body.innerHTML='<p class="r16s-note">⏳ Hatua ya 16 bado haijazalishwa. Tengeneza R16 kwanza.</p>';return;}
 body.innerHTML='<div style="overflow-x:auto"><table class="r16s-table"><thead><tr><th>Mechi</th><th>Timu</th><th>Tarehe</th><th>Muda</th><th>Uwanja</th><th>Hifadhi</th></tr></thead><tbody>'+ms.map((m,i)=>{
  const num=m.match_number||i+1;
  return `<tr><td><b>#${esc(num)}</b><br><span class="r16s-matchno">R16 ${i+1}</span></td><td>${esc(cname(m.home_team_id))} <span style="opacity:.55">×</span> ${esc(cname(m.away_team_id))}</td><td><input type="date" id="r16date_${m.id}" value="${esc(m.match_date||'')}"></td><td><input type="time" id="r16time_${m.id}" value="${esc(String(m.match_time||'').slice(0,5))}"></td><td><input type="text" id="r16venue_${m.id}" value="${esc(m.venue||'')}" placeholder="Mfano: Uwanja wa O3"></td><td><button class="r16s-save" data-id="${m.id}">💾 Hifadhi</button></td></tr>`;
 }).join('')+'</tbody></table></div>';
 body.querySelectorAll('.r16s-save').forEach(b=>b.onclick=()=>save(b.dataset.id));
}
async function save(id){
 const date=$('#r16date_'+id)?.value||null;
 const time=$('#r16time_'+id)?.value||null;
 const venue=($('#r16venue_'+id)?.value||'').trim()||null;
 const b=document.querySelector('.r16s-save[data-id="'+id+'"]');if(b){b.disabled=true;b.textContent='⏳';}
 const r=await db.from('matches').update({match_date:date,match_time:time,venue:venue}).eq('id',id);
 if(b)b.disabled=false;
 if(r.error){if(b)b.textContent='💾 Hifadhi';alert('❌ Imeshindikana kuhifadhi ratiba: '+r.error.message);return;}
 if(b){b.textContent='✅ Imehifadhiwa';setTimeout(()=>b.textContent='💾 Hifadhi',1400);}
}
function boot(){let tries=0;const go=async()=>{tries++;try{injectStyle();setupCenter();await load();}catch(e){if(tries<10)setTimeout(go,700);else console.warn('AFRN Knockout Center:',e);}};go();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

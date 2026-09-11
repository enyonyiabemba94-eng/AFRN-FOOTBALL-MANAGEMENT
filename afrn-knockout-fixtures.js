/* AFRN Knockout Fixture Details v1
   Adds editable date, kick-off time and venue to every knockout fixture.
   Data is stored directly in matches.match_date, matches.match_time and matches.venue.
*/
(function(){
'use strict';
if(window.__AFRN_KO_FIXTURES_V1__) return;
window.__AFRN_KO_FIXTURES_V1__=true;
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const $=(s,r=document)=>r.querySelector(s);
let db;
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function cid(){const a=$('#teamCompetitionId')?.value||$('#generatorCompetitionId')?.value;if(a)return a;const s=$('select[name="competition_id"]');if(s?.value)return s.value;const o=[...document.querySelectorAll('option')].find(x=>/UPENDO WA WAKIMBIZI/i.test(x.textContent||''));return o?.value||null;}
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));}
function stage(m){const x=String(m.notes||'').match(/AFRN_STAGE=(R16|QF|SF|3RD|FINAL)/);return x?x[1]:null;}
function slot(m){const x=String(m.notes||'').match(/AFRN_SLOT=(\d+)/);return x?Number(x[1]):999;}
function cname(id,clubs){return clubs.find(c=>String(c.id)===String(id))?.name||'—';}
async function run(){
 try{
  const id=cid(); if(!id)return;
  db=client();
  const [mm,cc]=await Promise.all([db.from('matches').select('id,home_team_id,away_team_id,match_date,match_time,venue,match_number,notes').eq('competition_id',id),db.from('clubs').select('id,name').order('name')]);
  if(mm.error)throw mm.error;if(cc.error)throw cc.error;
  const ms=(mm.data||[]).filter(m=>stage(m)).sort((a,b)=>(Number(a.match_number||999)-Number(b.match_number||999)));
  const clubs=cc.data||[]; const root=$('#afrnPenaltyPanel'); if(!root)return;
  let box=$('#afrnFixtureDetails'); if(box)box.remove();
  box=document.createElement('div');box.id='afrnFixtureDetails';box.className='ce-card';
  box.innerHTML='<h3>📅 RATIBA RASMI YA KNOCKOUT</h3><p class="ce-muted">Weka tarehe, muda na uwanja kwa kila mechi. Taarifa hizi zinahifadhiwa moja kwa moja kwenye mfumo na hazibadilishi matokeo.</p>';
  ms.forEach(m=>{
   const row=document.createElement('div');row.style.cssText='border-top:1px solid #ddd;padding:12px 0';
   row.innerHTML=`<div><b>Mechi #${esc(m.match_number)}</b> — ${esc(cname(m.home_team_id,clubs))} vs ${esc(cname(m.away_team_id,clubs))}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label>📅 Tarehe<input type="date" data-date value="${esc(m.match_date||'')}"></label><label>⏰ Muda<input type="time" data-time value="${esc(m.match_time?String(m.match_time).slice(0,5):'')}"></label></div><label style="display:block;margin-top:8px">🏟️ Uwanja<input type="text" data-venue value="${esc(m.venue||'')}" placeholder="Mfano: Uwanja wa O3"></label><button class="primary" data-save style="margin-top:8px">💾 Hifadhi Ratiba #${esc(m.match_number)}</button><span data-msg style="margin-left:8px"></span>`;
   row.querySelector('[data-save]').addEventListener('click',async()=>{
    const date=row.querySelector('[data-date]').value||null,time=row.querySelector('[data-time]').value||null,venue=row.querySelector('[data-venue]').value.trim()||null,msg=row.querySelector('[data-msg]');
    if(!date||!time||!venue){msg.textContent='⚠️ Jaza tarehe, muda na uwanja.';return;}
    const r=await db.from('matches').update({match_date:date,match_time:time,venue:venue}).eq('id',m.id);if(r.error){msg.textContent='❌ '+r.error.message;return;}msg.textContent='✅ Imehifadhiwa';m.match_date=date;m.match_time=time;m.venue=venue;
   });
   box.appendChild(row);
  });
  root.parentNode.insertBefore(box,root);
 }catch(e){console.error('AFRN Knockout Fixtures',e);}
}
let t=0;function boot(){clearTimeout(t);t=setTimeout(run,900);}new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

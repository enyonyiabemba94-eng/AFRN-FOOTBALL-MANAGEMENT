/* AFRN R16 Schedule
   Adds Admin-controlled date, time and venue to each Round of 16 match.
   Uses existing matches.match_date, matches.match_time and matches.venue columns.
   Does not alter knockout qualification logic or match numbering.
*/
(function(){
'use strict';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
let db;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function formatDate(v){if(!v)return '';const p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:v;}
async function load(){
 db=client(); if(!db)return;
 const r=await db.from('matches').select('id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,match_number,notes').like('notes','%AFRN_STAGE=R16%').order('match_number');
 if(r.error)throw r.error;
 const ms=r.data||[];
 const ids=[...new Set(ms.flatMap(m=>[m.home_team_id,m.away_team_id]).filter(Boolean))];
 let clubs=[];
 if(ids.length){const c=await db.from('clubs').select('id,name').in('id',ids);if(!c.error)clubs=c.data||[];}
 const cname=id=>clubs.find(c=>String(c.id)===String(id))?.name||'—';
 render(ms,cname);
}
function render(ms,cname){
 let root=$('#afrnR16Schedule');
 if(!root){
  root=document.createElement('section');root.id='afrnR16Schedule';
  root.innerHTML='<style>#afrnR16Schedule{margin-top:16px}.r16s-card{border:1px solid #ddd;border-radius:14px;padding:14px;background:#fff}.r16s-table{width:100%;border-collapse:collapse}.r16s-table th,.r16s-table td{padding:9px 7px;border-bottom:1px solid #eee;text-align:left;vertical-align:middle}.r16s-table input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px}.r16s-actions{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}.r16s-save{padding:9px 13px;border:0;border-radius:9px;cursor:pointer}.r16s-note{font-size:13px;opacity:.75}@media(max-width:700px){.r16s-table{display:block;overflow-x:auto;white-space:nowrap}.r16s-table input{min-width:125px}}</style><div class="r16s-card"><h3>📅 RATIBA — HATUA YA 16</h3><p class="r16s-note">Admin anaweka tarehe, muda na uwanja wa kila mechi ya Hatua ya 16. Taarifa hizi zinahifadhiwa moja kwa moja kwenye mechi husika.</p><div id="afrnR16ScheduleBody"></div></div>';
  const target=$('#afrnKOTable')||document.querySelector('main')||document.body;target.parentNode.insertBefore(root,target.nextSibling);
 }
 const body=$('#afrnR16ScheduleBody',root);
 if(!ms.length){body.innerHTML='<p class="r16s-note">⏳ Hatua ya 16 bado haijazalishwa. Tengeneza R16 kwanza.</p>';return;}
 body.innerHTML='<div style="overflow-x:auto"><table class="r16s-table"><thead><tr><th>Mechi</th><th>Timu</th><th>Tarehe</th><th>Muda</th><th>Uwanja</th><th>Hifadhi</th></tr></thead><tbody>'+ms.map((m,i)=>{
  const num=m.match_number||i+1;
  return '<tr><td><b>#'+esc(num)+'</b><br><small>R16 '+(i+1)+'</small></td><td>'+esc(cname(m.home_team_id))+' × '+esc(cname(m.away_team_id))+'</td><td><input type="date" id="r16date_'+m.id+'" value="'+esc(m.match_date||'')+'"></td><td><input type="time" id="r16time_'+m.id+'" value="'+esc(String(m.match_time||'').slice(0,5))+'"></td><td><input type="text" id="r16venue_'+m.id+'" value="'+esc(m.venue||'')+'" placeholder="Mfano: Uwanja wa O3"></td><td><button class="r16s-save" data-id="'+m.id+'">💾</button></td></tr>';
 }).join('')+'</tbody></table></div>';
 body.querySelectorAll('.r16s-save').forEach(b=>b.onclick=()=>save(b.dataset.id));
}
async function save(id){
 const date=$('#r16date_'+id)?.value||null,time=$('#r16time_'+id)?.value||null,venue=($('#r16venue_'+id)?.value||'').trim()||null;
 const b=document.querySelector('.r16s-save[data-id="'+id+'"]');if(b)b.disabled=true;
 const r=await db.from('matches').update({match_date:date,match_time:time,venue:venue}).eq('id',id);
 if(b)b.disabled=false;
 if(r.error){alert('❌ Imeshindikana kuhifadhi ratiba: '+r.error.message);return;}
 if(b){b.textContent='✅';setTimeout(()=>b.textContent='💾',1200);}
}
function boot(){let tries=0;const go=async()=>{tries++;try{await load();}catch(e){if(tries<8)setTimeout(go,700);else console.warn('AFRN R16 Schedule:',e);}};go();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
/* Load the unified Knockout Center after the existing R16 scheduler is initialized. */
setTimeout(()=>{if(!document.getElementById('afrn-knockout-center')){const s=document.createElement('script');s.src='./afrn-knockout-center.js?v=20260911';document.body.appendChild(s);}},1200);
})();

/* AFRN R16 Schedule — legacy compatibility
   The unified AFRN Knockout Center owns the R16 presentation on competitions.html.
*/
(function(){
'use strict';
/* Do not render the old scattered R16 table on the Competition page. */
if(location.pathname.endsWith('/competitions.html') || location.pathname.endsWith('competitions.html')) return;
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
let db;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
async function load(){
 db=client(); if(!db)return;
 const r=await db.from('matches').select('id,competition_id,home_team_id,away_team_id,match_date,match_time,venue,match_number,notes').like('notes','%AFRN_STAGE=R16%').order('match_number');
 if(r.error)throw r.error;
 const ms=r.data||[];
 const ids=[...new Set(ms.flatMap(m=>[m.home_team_id,m.away_team_id]).filter(Boolean))];
 let clubs=[];
 if(ids.length){const c=await db.from('clubs').select('id,name').in('id',ids);if(!c.error)clubs=c.data||[];}
 render(ms,id=>clubs.find(c=>String(c.id)===String(id))?.name||'—');
}
function render(ms,cname){
 let root=$('#afrnR16Schedule');
 if(!root){root=document.createElement('section');root.id='afrnR16Schedule';root.innerHTML='<div><h3>📅 RATIBA — HATUA YA 16</h3><div id="afrnR16ScheduleBody"></div></div>';($('main')||document.body).appendChild(root);}
 const body=$('#afrnR16ScheduleBody',root);if(!ms.length){body.innerHTML='<p>⏳ Hatua ya 16 bado haijazalishwa.</p>';return;}
 body.innerHTML='<table><tbody>'+ms.map((m,i)=>'<tr><td>#'+esc(m.match_number||i+1)+'</td><td>'+esc(cname(m.home_team_id))+' × '+esc(cname(m.away_team_id))+'</td></tr>').join('')+'</tbody></table>';
}
function boot(){load().catch(console.warn)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

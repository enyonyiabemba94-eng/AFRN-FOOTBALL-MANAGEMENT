(()=>{
'use strict';
if(window.__AFRN_STANDINGS_UI__)return;window.__AFRN_STANDINGS_UI__=true;
const db=window.supabaseClient||window.db;if(!db)return;
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const final=s=>['finished','completed','full time','ft'].includes(String(s||'').trim().toLowerCase());
async function render(){
 const cid=$('standingsCompetitionId')?.value, selected=$('standingsGroup')?.value, box=$('standingsContainer');if(!cid||!box)return;
 box.innerHTML='<div class="empty">⏳ Inapakia msimamo rasmi...</div>';
 const [{data:teams,error:te},{data:games,error:me}]=await Promise.all([db.from('competition_teams').select('club_id,group_name').eq('competition_id',cid),db.from('matches').select('home_team_id,away_team_id,home_score,away_score,status').eq('competition_id',cid)]);
 if(te||me){box.innerHTML='<div class="empty">❌ Imeshindikana kupakia msimamo.</div>';return;}
 const clubs=new Map((window.clubs||[]).map(c=>[String(c.id),c.name]));
 const groups=[...new Set((teams||[]).map(t=>t.group_name||'').filter(Boolean))].sort();
 const show=selected?[selected]:groups;let html='';
 for(const group of show){const members=(teams||[]).filter(t=>String(t.group_name||'')===group);if(!members.length)continue;
  const rows=new Map(members.map(t=>[String(t.club_id),{id:String(t.club_id),name:clubs.get(String(t.club_id))||'Klabu',P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0,opps:[]} ]));
  (games||[]).filter(m=>final(m.status)).forEach(m=>{const h=rows.get(String(m.home_team_id)),a=rows.get(String(m.away_team_id));if(!h||!a||m.home_score==null||m.away_score==null)return;const hs=Number(m.home_score)||0,as=Number(m.away_score)||0;h.P++;a.P++;h.GF+=hs;h.GA+=as;a.GF+=as;a.GA+=hs;h.opps.push({id:a.id,pts:hs>as?3:hs===as?1:0,gd:hs-as});a.opps.push({id:h.id,pts:as>hs?3:as===hs?1:0,gd:as-hs});if(hs>as){h.W++;h.pts+=3;a.L++;}else if(hs<as){a.W++;a.pts+=3;h.L++;}else{h.D++;a.D++;h.pts++;a.pts++;}});
  const mini=(a,b)=>{let ap=0,bp=0,ag=0,bg=0;for(const x of a.opps){if(x.id===b.id){ap+=x.pts;ag+=x.gd;}}for(const x of b.opps){if(x.id===a.id){bp+=x.pts;bg+=x.gd;}}return [bp-ap,bg-ag];};
  const sorted=[...rows.values()].sort((a,b)=>{let d=b.pts-a.pts;if(d)return d;d=(b.GF-b.GA)-(a.GF-a.GA);if(d)return d;d=b.GF-a.GF;if(d)return d;[d]=mini(a,b);if(d)return d;d=(b.GF-b.GA)-(a.GF-a.GA);if(d)return d;d=b.W-a.W;if(d)return d;return a.name.localeCompare(b.name);});
  html+=`<div class="group-title">GROUP ${esc(group)} <span style="float:right;font-size:11px">Points → GD → GF → H2H → GA → Wins</span></div><div class="table-wrap"><table class="standings-table"><thead><tr><th>#</th><th>Klabu</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>${sorted.map((r,i)=>`<tr><td><strong>${i+1}</strong></td><td style="text-align:left;font-weight:800">${esc(r.name)}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${r.GF-r.GA>0?'+':''}${r.GF-r.GA}</td><td><strong>${r.pts}</strong></td></tr>`).join('')}</tbody></table></div>`;
 }
 box.innerHTML=html||'<div class="empty">Hakuna kundi lenye timu kwenye competition hii.</div>';
}
function start(){const c=$('standingsCompetitionId'),g=$('standingsGroup');if(!c)return; c.addEventListener('change',render);g?.addEventListener('change',render);setTimeout(render,250);setInterval(()=>{if(c.value)render()},15000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

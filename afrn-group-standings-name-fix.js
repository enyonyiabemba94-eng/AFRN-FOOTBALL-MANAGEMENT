/* AFRN Group Standings — persistent real club names, never changes statistics. */
(function(){
'use strict';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const db=window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));
if(!db)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let cache=null;
function played(m){return ['finished','completed','played','full time','ft'].includes(String(m?.status||'').trim().toLowerCase())&&m?.home_score!=null&&m?.away_score!=null}
function key(s){return [s.played,s.wins,s.draws,s.losses,s.goals_for,s.goals_against,s.red_cards,s.yellow_cards,s.points].join('|')}
async function load(){
 const id=new URLSearchParams(location.search).get('id');
 let cr=id?await db.from('competitions').select('id').eq('id',id).maybeSingle():await db.from('competitions').select('id').order('created_at',{ascending:false}).limit(1).maybeSingle();
 const competitionId=cr.data?.id;
 if(!competitionId)return;
 const [tr,mr,er]=await Promise.all([
   db.from('competition_teams').select('club_id,group_name').eq('competition_id',competitionId),
   db.from('matches').select('home_team_id,away_team_id,home_score,away_score,status').eq('competition_id',competitionId),
   db.from('match_events').select('club_id,event_type,match_id').in('match_id',[])
 ]);
 const teams=tr.data||[], matches=mr.data||[];
 const mids=matches.map(m=>m.id).filter(Boolean);
 let events=[];
 if(mids.length){const er2=await db.from('match_events').select('club_id,event_type,match_id').in('match_id',mids);events=er2.data||[]}
 const ids=[...new Set(teams.map(t=>t.club_id).filter(Boolean))];
 if(!ids.length)return;
 const clubsRes=await db.from('clubs').select('id,name,short_name').in('id',ids);
 const clubs=clubsRes.data||[]; const names=new Map(clubs.map(c=>[String(c.id),c.name||c.short_name||'Klabu']));
 const map={};
 teams.forEach(t=>{map[String(t.club_id)]={club_id:t.club_id,group_name:t.group_name||'',played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,red_cards:0,yellow_cards:0,points:0}});
 matches.filter(played).forEach(m=>{const h=map[String(m.home_team_id)],a=map[String(m.away_team_id)];if(!h||!a)return;const hs=+m.home_score,as=+m.away_score;h.played++;a.played++;h.goals_for+=hs;h.goals_against+=as;a.goals_for+=as;a.goals_against+=hs;if(hs>as){h.wins++;h.points+=3;a.losses++}else if(hs<as){a.wins++;a.points+=3;h.losses++}else{h.draws++;a.draws++;h.points++;a.points++}});
 events.forEach(e=>{const t=map[String(e.club_id)];if(!t)return;const x=String(e.event_type||'').toLowerCase();if(x.includes('red'))t.red_cards++;if(x.includes('yellow'))t.yellow_cards++});
 const all=Object.values(map).sort((a,b)=>b.points-a.points||b.goals_for-a.goals_for||a.goals_against-b.goals_against||a.red_cards-b.red_cards||a.yellow_cards-b.yellow_cards);
 cache={competitionId,names,all,groups:{}};
 all.forEach(x=>{(cache.groups[x.group_name]??=[]).push(x)});
 Object.values(cache.groups).forEach(a=>a.sort((x,y)=>bcmp(x,y)));
 fixTables();
}
function bcmp(a,b){return b.points-a.points||b.goals_for-a.goals_for||a.goals_against-b.goals_against||a.red_cards-b.red_cards||a.yellow_cards-b.yellow_cards}
function rowNums(row){return [...row.cells].map(c=>String(c.textContent||'').trim()).filter(x=>/^\d+$/.test(x)).map(Number)}
function sameRow(s,nums){
 const basic=[s.played,s.wins,s.draws,s.losses,s.goals_for,s.goals_against,s.points];
 if(nums.length<7)return false;
 return basic.every(v=>nums.includes(Number(v)));
}
function groupFor(table){
 let p=table.parentElement;
 for(let i=0;i<4&&p;i++,p=p.parentElement){const m=String(p.textContent||'').match(/GROUP\s*([A-H])\b/i);if(m)return m[1].toUpperCase()}
 return '';
}
function fixTables(){if(!cache)return;document.querySelectorAll('table').forEach(table=>{
 const group=groupFor(table); const pool=group?(cache.groups[group]||[]):cache.all; const used=new Set();
 [...table.rows].forEach(row=>{
   if(row.dataset.afrnNameFixed)return;
   const cells=[...row.cells]; if(cells.length<2)return;
   const nameCell=cells.find((c,i)=>i>0&&/^(Klabu|Timu haijawekwa|Club|Team)$/i.test(String(c.textContent||'').trim()));
   if(!nameCell)return;
   const nums=rowNums(row); let candidate=pool.find(s=>!used.has(String(s.club_id))&&sameRow(s,nums));
   if(!candidate){candidate=pool.find(s=>!used.has(String(s.club_id)))}
   if(candidate){nameCell.innerHTML=esc(cache.names.get(String(candidate.club_id))||'Klabu');used.add(String(candidate.club_id));row.dataset.afrnNameFixed='1'}
 });
 });
}
load().catch(()=>{});
setTimeout(fixTables,700);setTimeout(fixTables,1800);setTimeout(fixTables,3500);
new MutationObserver(()=>fixTables()).observe(document.body,{subtree:true,childList:true});
})();

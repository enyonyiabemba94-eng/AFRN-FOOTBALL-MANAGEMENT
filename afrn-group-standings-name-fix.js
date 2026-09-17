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
 let cr=id?await db.from('competitions').select('id,name,competition_type,season,status').eq('id',id).maybeSingle():await db.from('competitions').select('id,name,competition_type,season,status').order('created_at',{ascending:false}).limit(1).maybeSingle();
 const competitionId=cr.data?.id;
 if(!competitionId)return;
 const [tr,mr]=await Promise.all([
   db.from('competition_teams').select('club_id,group_name').eq('competition_id',competitionId),
   db.from('matches').select('id,home_team_id,away_team_id,home_score,away_score,status,match_number,notes,match_date,match_time,venue').eq('competition_id',competitionId).order('match_number',{ascending:true}).order('match_date',{ascending:true})
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
 cache={competitionId,competition:cr.data,names,all,groups:{},teams,matches};
 all.forEach(x=>{(cache.groups[x.group_name]??=[]).push(x)});
 Object.values(cache.groups).forEach(a=>a.sort((x,y)=>bcmp(x,y)));
 fixTables();
 renderOfficialCompetitionData();
}
function bcmp(a,b){return b.points-a.points||b.goals_for-a.goals_for||a.goals_against-b.goals_against||a.red_cards-b.red_cards||a.yellow_cards-b.yellow_cards}
function rowNums(row){return [...row.cells].map(c=>String(c.textContent||'').trim()).filter(x=>/^\d+$/.test(x)).map(Number)}
function sameRow(s,nums){const basic=[s.played,s.wins,s.draws,s.losses,s.goals_for,s.goals_against,s.points];if(nums.length<7)return false;return basic.every(v=>nums.includes(Number(v)))}
function groupFor(table){let p=table.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){const m=String(p.textContent||'').match(/GROUP\s*([A-H])\b/i);if(m)return m[1].toUpperCase()}return ''}
function fixTables(){if(!cache)return;document.querySelectorAll('table').forEach(table=>{const group=groupFor(table);const pool=group?(cache.groups[group]||[]):cache.all;const used=new Set();[...table.rows].forEach(row=>{if(row.dataset.afrnNameFixed)return;const cells=[...row.cells];if(cells.length<2)return;const nameCell=cells.find((c,i)=>i>0&&/^(Klabu|Timu haijawekwa|Club|Team)$/i.test(String(c.textContent||'').trim()));if(!nameCell)return;const nums=rowNums(row);let candidate=pool.find(s=>!used.has(String(s.club_id))&&sameRow(s,nums));if(!candidate)candidate=pool.find(s=>!used.has(String(s.club_id)));if(candidate){nameCell.innerHTML=esc(cache.names.get(String(candidate.club_id))||'Klabu');used.add(String(candidate.club_id));row.dataset.afrnNameFixed='1'}})}
function stageOf(m){const n=String(m?.notes||'');const x=n.match(/AFRN_STAGE=(R16|QF|SF|3RD|FINAL)/i);if(x){return({R16:'HATUA YA 16',QF:'ROBO FAINALI',SF:'NUSU FAINALI',3RD:'MSHINDI WA 3',FINAL:'FINALI'})[x[1].toUpperCase()]||'MTOANO'}const g=n.match(/GROUP\s*([A-H])/i);if(g)return 'KUNDI '+g[1].toUpperCase();return 'MECHI'
}
function stageRank(s){return {'KUNDI A':1,'KUNDI B':1,'KUNDI C':1,'KUNDI D':1,'KUNDI E':1,'KUNDI F':1,'KUNDI G':1,'KUNDI H':1,'HATUA YA 16':2,'ROBO FAINALI':3,'NUSU FAINALI':4,'MSHINDI WA 3':5,'FINALI':6,'MTOANO':2,'MECHI':1}[s]||1}
function isGroupMatch(m){if(/AFRN_STAGE=/i.test(String(m?.notes||'')))return false;const h=cache?.teams?.find(t=>String(t.club_id)===String(m.home_team_id));const a=cache?.teams?.find(t=>String(t.club_id)===String(m.away_team_id));return !!(h?.group_name&&a?.group_name&&String(h.group_name)===String(a.group_name))}
function fmtDate(m){return [m.match_date,m.match_time].filter(Boolean).join(' · ')||'—'}
function matchRows(matches){return matches.map(m=>{const hs=m.home_score!=null?m.home_score:'—',as=m.away_score!=null?m.away_score:'—';const stat=played(m)?'ZIMEchezwa':'RATIBA';return `<tr><td>${esc(m.match_number||'—')}</td><td>${esc(stageOf(m))}</td><td>${esc(fmtDate(m))}</td><td>${esc(cache.names.get(String(m.home_team_id))||'Timu')}</td><td><b>${esc(hs)} : ${esc(as)}</b></td><td>${esc(cache.names.get(String(m.away_team_id))||'Timu')}</td><td>${esc(m.venue||'—')}</td><td>${stat}</td></tr>`}).join('')}
function standingsTable(rows){return `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:720px;font-size:12px"><thead><tr><th>#</th><th style="text-align:left">CLUB</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th></tr></thead><tbody>${rows.map((s,i)=>`<tr><td>${i+1}</td><td style="text-align:left;font-weight:bold">${esc(cache.names.get(String(s.club_id))||'Klabu')}</td><td>${s.played}</td><td>${s.wins}</td><td>${s.draws}</td><td>${s.losses}</td><td>${s.goals_for}</td><td>${s.goals_against}</td><td>${s.goals_for-s.goals_against}</td><td><b>${s.points}</b></td></tr>`).join('')}</tbody></table></div>`}
function renderOfficialCompetitionData(){if(!cache)return;let host=document.getElementById('afrnOfficialCompetitionData');if(!host){host=document.createElement('section');host.id='afrnOfficialCompetitionData';host.style.cssText='margin:18px 0;background:#fff;border:1px solid #e4e9f0;border-radius:16px;padding:16px;box-shadow:0 3px 15px #14213d10';const main=document.querySelector('main');(main||document.body).appendChild(host)}const c=cache.competition||{};const matches=cache.matches||[];const playedCount=matches.filter(played).length;const goals=matches.filter(played).reduce((n,m)=>n+(+m.home_score||0)+(+m.away_score||0),0);const groupNames=[...new Set(cache.teams.map(t=>t.group_name).filter(Boolean))].sort();const groupMatches=matches.filter(isGroupMatch);const knockout=matches.filter(m=>!isGroupMatch(m));const groupsHtml=groupNames.length?groupNames.map(g=>`<div style="margin:14px 0"><h3 style="color:#0d47a1">GROUP ${esc(g)}</h3>${standingsTable((cache.groups[g]||[]).slice().sort(bcmp))}</div>`).join(''):'<div style="color:#687386">Makundi hayajawekwa.</div>';const ordered=[...matches].sort((a,b)=>stageRank(stageOf(a))-stageRank(stageOf(b))||Number(a.match_number||9999)-Number(b.match_number||9999)||String(a.match_date||'').localeCompare(String(b.match_date||'')));host.innerHTML=`<h2 style="margin:0 0 6px">📊 TAKWIMU RASMI ZA ${esc(c.name||'COMPETITION')}</h2><div style="color:#687386;font-size:12px;margin-bottom:12px">Season ${esc(c.season||'—')} · ${esc(c.status||'—')} · Data moja kwa moja kutoka kwenye mechi za competition hii</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:16px"><div style="background:#f0f4f8;padding:12px;border-radius:10px;text-align:center"><b style="font-size:22px;display:block">${cache.teams.length}</b>Timu</div><div style="background:#f0f4f8;padding:12px;border-radius:10px;text-align:center"><b style="font-size:22px;display:block">${matches.length}</b>Mechi</div><div style="background:#f0f4f8;padding:12px;border-radius:10px;text-align:center"><b style="font-size:22px;display:block">${playedCount}</b>Zimechezwa</div><div style="background:#f0f4f8;padding:12px;border-radius:10px;text-align:center"><b style="font-size:22px;display:block">${goals}</b>Magoli</div><div style="background:#f0f4f8;padding:12px;border-radius:10px;text-align:center"><b style="font-size:22px;display:block">${groupNames.length}</b>Makundi</div></div><div style="border-top:1px solid #edf0f4;padding-top:10px"><h3>📋 MSIMAMO WA MAKUNDI</h3>${groupsHtml}</div><div style="border-top:1px solid #edf0f4;padding-top:10px"><h3>🏟️ MECHI ZOTE HADI HATUA YA SASA</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:980px;font-size:12px"><thead><tr><th>#</th><th>HATUA</th><th>TAREHE/MUDA</th><th>NYUMBANI</th><th>MATOKEO</th><th>MEGENI</th><th>UWANJA</th><th>HALI</th></tr></thead><tbody>${ordered.length?matchRows(ordered):'<tr><td colspan="8">Hakuna mechi zilizohifadhiwa kwenye competition hii.</td></tr>'}</tbody></table></div></div><div style="border-top:1px solid #edf0f4;padding-top:10px"><h3>🔥 HATUA YA MTOANO</h3>${knockout.length?matchRows(knockout):'<div style="color:#687386">Hakuna mechi za mtoano zilizohifadhiwa.</div>'}</div>`}
load().catch(()=>{});
setTimeout(fixTables,700);setTimeout(fixTables,1800);setTimeout(fixTables,3500);setTimeout(renderOfficialCompetitionData,1200);setTimeout(renderOfficialCompetitionData,3000);
new MutationObserver(()=>fixTables()).observe(document.body,{subtree:true,childList:true});
})();

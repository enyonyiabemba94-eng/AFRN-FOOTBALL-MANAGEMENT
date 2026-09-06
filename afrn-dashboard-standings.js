(()=>{
'use strict';
const db=window.supabaseClient||window.db;if(!db)return;
const path=location.pathname.toLowerCase();
if(!/\/(index|club-dashboard)\.html$/.test(path))return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
const final=s=>['finished','completed','full time','ft'].includes(String(s||'').trim().toLowerCase());
const points=(w,d)=>w*3+d;
function addCard(){
 if($('dashboardStandings'))return $('dashboardStandings');
 const section=document.createElement('section');section.className='card';section.id='dashboardStandings';section.style.cssText='margin:18px auto;max-width:1200px;background:#fff;border:1px solid #d9e1ec;border-radius:15px;padding:16px;box-shadow:0 3px 12px #00000008';
 section.innerHTML='<h3 style="margin:0 0 5px;color:#071a33">📊 Msimamo wa Ligi</h3><div id="dashStandingsSub" style="font-size:11px;color:#667085;margin-bottom:10px">Points → GD → GF → H2H → GA → Wins</div><div id="dashStandingsBody">Inapakia...</div>';
 const main=document.querySelector('main');if(main)main.appendChild(section);return section;
}
function h2h(a,b,matches){let ag=0,bg=0;for(const m of matches){if(m.home_team_id===a&&m.away_team_id===b){ag+=(m.home_score??0);bg+=(m.away_score??0)}else if(m.home_team_id===b&&m.away_team_id===a){ag+=(m.away_score??0);bg+=(m.home_score??0)}}return ag-bg}
async function render(){
 const card=addCard(),body=$('dashStandingsBody');if(!body)return;
 try{
  const [{data:comps},{data:teams},{data:matches},{data:clubs}]=await Promise.all([
   db.from('competitions').select('id,name,season,status,start_date').order('start_date',{ascending:false,nullsFirst:false}).limit(10),
   db.from('competition_teams').select('competition_id,club_id,group_name'),
   db.from('matches').select('competition_id,home_team_id,away_team_id,home_score,away_score,status,match_date').order('match_date',{ascending:false}),
   db.from('clubs').select('id,name,division,afrn_club_id')
  ]);
  const cs=comps||[],ts=teams||[],ms=(matches||[]).filter(m=>final(m.status)&&m.home_score!=null&&m.away_score!=null),cm=new Map((clubs||[]).map(c=>[String(c.id),c]));
  if(!cs.length){body.innerHTML='<div style="padding:15px;text-align:center;color:#667085;background:#f8fafc;border-radius:9px">Hakuna mashindano yaliyorekodiwa.</div>';return}
  const current=cs[0], cts=ts.filter(t=>t.competition_id===current.id), teamIds=new Set(cts.map(t=>String(t.club_id)));
  ms.filter(m=>m.competition_id===current.id).forEach(m=>{if(m.home_team_id)teamIds.add(String(m.home_team_id));if(m.away_team_id)teamIds.add(String(m.away_team_id))});
  const rows=[...teamIds].map(id=>{const r={id,group:(cts.find(t=>String(t.club_id)===id)||{}).group_name||'—',p:0,w:0,d:0,l:0,gf:0,ga:0};return r});const map=new Map(rows.map(r=>[r.id,r]));
  const finals=ms.filter(m=>m.competition_id===current.id);
  finals.forEach(m=>{const h=map.get(String(m.home_team_id)),a=map.get(String(m.away_team_id));if(!h||!a)return;h.p++;a.p++;h.gf+=+m.home_score;h.ga+=+m.away_score;a.gf+=+m.away_score;a.ga+=+m.home_score;if(+m.home_score>+m.away_score){h.w++;a.l++}else if(+m.home_score<+m.away_score){a.w++;h.l++}else{h.d++;a.d++}});
  rows.sort((a,b)=>{let x=points(b.w,b.d)-points(a.w,a.d);if(x)return x;x=(b.gf-b.ga)-(a.gf-a.ga);if(x)return x;x=b.gf-a.gf;if(x)return x;x=h2h(b.id,a.id,finals);if(x)return x;x=b.ga-a.ga;if(x)return x;x=b.w-a.w;return x||String(cm.get(a.id)?.name||a.id).localeCompare(String(cm.get(b.id)?.name||b.id))});
  const myClub=path.includes('club-dashboard')?await db.from('profiles').select('club_id').eq('id',(await db.auth.getUser()).data.user?.id||'').maybeSingle():null;const myId=myClub?.data?.club_id?String(myClub.data.club_id):null;
  $('dashStandingsSub').textContent=`${esc(current.name||'Mashindano')} ${current.season?'· '+esc(current.season):''} · Points → GD → GF → H2H → GA → Wins`;
  body.innerHTML='<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:600px"><thead><tr><th style="padding:8px;text-align:left;background:#f1f4f8">#</th><th style="padding:8px;text-align:left;background:#f1f4f8">Klabu</th><th style="padding:8px;background:#f1f4f8">P</th><th style="padding:8px;background:#f1f4f8">W</th><th style="padding:8px;background:#f1f4f8">D</th><th style="padding:8px;background:#f1f4f8">L</th><th style="padding:8px;background:#f1f4f8">GF</th><th style="padding:8px;background:#f1f4f8">GA</th><th style="padding:8px;background:#f1f4f8">GD</th><th style="padding:8px;background:#f1f4f8">Pts</th></tr></thead><tbody>'+rows.map((r,i)=>{const c=cm.get(r.id)||{},mine=myId&&myId===r.id;return `<tr style="${mine?'background:#eaf8f0;font-weight:900':''}"><td style="padding:8px;border-bottom:1px solid #e8edf3">${i+1}</td><td style="padding:8px;border-bottom:1px solid #e8edf3">${mine?'⭐ ':''}${esc(c.name||'Klabu')}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.p}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.w}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.d}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.l}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.gf}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3">${r.ga}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3"><b>${r.gf-r.ga}</b></td><td style="padding:8px;text-align:center;border-bottom:1px solid #e8edf3"><b>${points(r.w,r.d)}</b></td></tr>`}).join('')+'</tbody></table></div>';
 }catch(e){body.innerHTML='<div style="padding:15px;text-align:center;color:#667085;background:#f8fafc;border-radius:9px">Msimamo haukupatikana kwa sasa.</div>'}
}
render();setInterval(render,15000);
})();

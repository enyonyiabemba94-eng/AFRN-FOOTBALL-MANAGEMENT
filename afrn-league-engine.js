/* AFRN League Center
   Generic league UI: Competition -> Week/Matchday -> Fixtures/Results -> Standings.
   Uses existing competitions, competition_teams, clubs and matches tables.
   Week is stored in match notes as AFRN_WEEK=n when available; otherwise derived from match date.
*/
(function(){
'use strict';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
let db, comp=null, clubs=[], teams=[], matches=[], selectedWeek=1;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function cname(id){return clubs.find(c=>String(c.id)===String(id))?.name||'—';}
function weekOf(m){const n=String(m.notes||'').match(/AFRN_WEEK=(\d+)/i);if(n)return Number(n[1]);if(!m.match_date||!comp?.start_date)return 1;const a=new Date(comp.start_date+'T00:00:00'),b=new Date(String(m.match_date).slice(0,10)+'T00:00:00');return Math.max(1,Math.floor((b-a)/604800000)+1);}
function played(m){return m&&m.home_score!=null&&m.away_score!=null&&Number.isInteger(Number(m.home_score))&&Number.isInteger(Number(m.away_score));}
function load(){return Promise.all([
 db.from('clubs').select('id,name').order('name'),
 db.from('competition_teams').select('id,club_id,group_name').eq('competition_id',comp.id),
 db.from('matches').select('*').eq('competition_id',comp.id).order('match_date').order('match_number')
 ]).then(([c,t,m])=>{if(c.error||t.error||m.error)throw new Error(c.error?.message||t.error?.message||m.error?.message||'Failed loading league data');clubs=c.data||[];teams=t.data||[];matches=m.data||[];});}
function standings(){
 const ids=[...new Set(teams.map(x=>String(x.club_id)))];const rows=ids.map(id=>({id,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,mp:0}));
 for(const m of matches.filter(played)){const h=rows.find(x=>x.id===String(m.home_team_id)),a=rows.find(x=>x.id===String(m.away_team_id));if(!h||!a)continue;const hs=Number(m.home_score),as=Number(m.away_score);h.mp++;a.mp++;h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as){h.w++;h.p+=3;a.l++;}else if(as>hs){a.w++;a.p+=3;h.l++;}else{h.d++;a.d++;h.p++;a.p++;}}
 rows.forEach(r=>r.gd=r.gf-r.ga);rows.sort((a,b)=>b.p-a.p||b.gd-a.gd||b.gf-a.gf||b.w-a.w||cname(a.id).localeCompare(cname(b.id)));return rows.map((r,i)=>({...r,rank:i+1}));
}
function weeks(){const set=new Set(matches.map(weekOf));if(!set.size)set.add(1);return [...set].sort((a,b)=>a-b);}
function ensure(){let host=$('#afrnLeagueCenter');if(host)return host;const anchor=$('#afrnKnockoutEngine')||document.querySelector('main');if(!anchor)return null;host=document.createElement('section');host.id='afrnLeagueCenter';host.className='card';anchor.parentNode.insertBefore(host,anchor);return host;}
function render(){const root=ensure();if(!root)return;if(!comp||String(comp.type||'').toLowerCase()!=='league'){root.innerHTML='';root.style.display='none';return;}root.style.display='block';const ws=weeks();if(!ws.includes(selectedWeek))selectedWeek=ws[0]||1;const weekMatches=matches.filter(m=>weekOf(m)===selectedWeek);const table=standings();root.innerHTML=`<div class="afrn-league-head"><div><div class="afrn-league-kicker">🏆 AFRN LEAGUE CENTER</div><h2 style="margin:3px 0">${esc(comp.name)}</h2><div class="afrn-league-meta">Season ${esc(comp.season||'—')} · ${teams.length} teams</div></div><button id="afrnLeagueRefresh" class="secondary">↻ Refresh</button></div><div class="afrn-league-tabs"><button class="afrnLeagueTab active" data-tab="standings">📊 Msimamo</button><button class="afrnLeagueTab" data-tab="fixtures">📅 Wiki / Matchday</button></div><div id="afrnLeagueBody"></div>`;
const body=$('#afrnLeagueBody');body.innerHTML=`<div class="afrn-weekbar"><button id="afrnWeekPrev" class="secondary">‹</button>${ws.map(w=>`<button class="afrnWeekBtn ${w===selectedWeek?'active':''}" data-week="${w}">Wiki ${w}</button>`).join('')}<button id="afrnWeekNext" class="secondary">›</button></div><div class="afrn-league-grid"><div><h3>📊 Msimamo wa Ligi</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>Timu</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>${table.map(r=>`<tr><td>${r.rank}</td><td><b>${esc(cname(r.id))}</b></td><td>${r.mp}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td><b>${r.p}</b></td></tr>`).join('')||'<tr><td colspan="10">Hakuna timu bado.</td></tr>'}</tbody></table></div></div><div><h3>📅 Wiki ${selectedWeek} — Mechi</h3><div class="afrn-fixtures">${weekMatches.map(m=>`<div class="afrn-fixture"><div><b>${esc(cname(m.home_team_id))}</b><br><span>vs</span><br><b>${esc(cname(m.away_team_id))}</b></div><div class="afrn-score">${played(m)?`${m.home_score} - ${m.away_score}`:'—'}</div><div class="afrn-date">${esc(m.match_date||'Tarehe haijawekwa')}</div></div>`).join('')||'<div class="afrn-empty">Hakuna mechi za wiki hii.</div>'}</div></div></div>`;
root.querySelectorAll('.afrnWeekBtn').forEach(b=>b.onclick=()=>{selectedWeek=Number(b.dataset.week);render();});$('#afrnWeekPrev').onclick=()=>{const i=ws.indexOf(selectedWeek);if(i>0){selectedWeek=ws[i-1];render();}};$('#afrnWeekNext').onclick=()=>{const i=ws.indexOf(selectedWeek);if(i<ws.length-1){selectedWeek=ws[i+1];render();}};$('#afrnLeagueRefresh').onclick=async()=>{await init(true);};
}
async function init(force){try{db=client();if(!db)return;const r=await db.from('competitions').select('*').eq('type','League').order('start_date');if(r.error)throw r.error;const selectedId=window.__AFRN_SELECTED_COMPETITION_ID__||null;comp=(r.data||[]).find(x=>String(x.id)===String(selectedId))||(r.data||[])[0]||null;if(!comp){const h=ensure();if(h){h.style.display='none';h.innerHTML='';}return;}await load();render();}catch(e){console.warn('AFRN League Center:',e);}}
window.AFRNLeagueCenter={refresh:()=>init(true)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
})();

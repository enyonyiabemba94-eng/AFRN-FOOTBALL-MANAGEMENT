(()=>{
'use strict';
if(location.pathname.split('/').pop()!=='matches.html')return;
const db=window.supabaseClient||window.db;if(!db)return;
let box,matchCache=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const scoring=t=>['goal','goli','penalty','own goal','own_goal'].includes(String(t||'').toLowerCase());
async function getMatches(){const {data,error}=await db.from('matches').select('id,match_date,match_time,home_team_id,away_team_id,home_score,away_score,status').order('match_date',{ascending:false}).limit(100);if(error)throw error;matchCache=data||[];return matchCache}
async function getClubs(){const {data}=await db.from('clubs').select('id,name');return data||[]}
async function recalcScore(matchId){
 const {data:m,error:me}=await db.from('matches').select('id,home_team_id,away_team_id,competition_id,status').eq('id',matchId).maybeSingle();
 if(me||!m)return null;
 const [{data:events},{data:players}]=await Promise.all([
  db.from('match_events').select('player_id,event_type').eq('match_id',matchId),
  db.from('players').select('id,club_id').in('id',(await db.from('match_events').select('player_id').eq('match_id',matchId).not('player_id','is',null)).data?.map(x=>x.player_id)||[])
 ]);
 const byPlayer=new Map((players||[]).map(p=>[String(p.id),p]));let home=0,away=0;
 (events||[]).filter(e=>!String(e.event_type||'').startsWith('lineup_')&&scoring(e.event_type)).forEach(e=>{const p=byPlayer.get(String(e.player_id));if(!p)return;const own=String(e.event_type||'').toLowerCase().replace('_',' ')==='own goal';if(String(p.club_id)===String(m.home_team_id)){own?away++:home++}else if(String(p.club_id)===String(m.away_team_id)){own?home++:away++}});
 const {data:updated,error}=await db.from('matches').update({home_score:home,away_score:away}).eq('id',matchId).select('id,competition_id,home_score,away_score,status').maybeSingle();
 if(error)return null;
 if(window.AFRNStandings?.syncFromMatch&&updated)try{await window.AFRNStandings.syncFromMatch(updated)}catch(_){ }
 return updated;
}
async function load(id){
 const [{data:m},{data:e},{data:p}]=await Promise.all([db.from('matches').select('id,home_team_id,away_team_id,home_score,away_score,status').eq('id',id).maybeSingle(),db.from('match_events').select('id,player_id,event_type,minute,description').eq('match_id',id).order('minute',{ascending:true}),db.from('players').select('id,first_name,middle_name,last_name,club_id').order('first_name')]);
 if(!m)return;
 const ps=p||[],events=e||[];const name=id=>{const x=ps.find(z=>String(z.id)===String(id));return x?[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' '):'Mchezaji'};const teamPlayers=ps.filter(x=>String(x.club_id)===String(m.home_team_id)||String(x.club_id)===String(m.away_team_id));
 box.innerHTML=`<div class="aev-head"><div><b>🎬 Matukio ya Mechi</b><span>${esc(m.status||'Scheduled')}</span></div><div class="aev-score">${m.home_score??0} - ${m.away_score??0}</div></div><div class="aev-form"><select id="aevType"><option value="goal">⚽ Goli</option><option value="yellow">🟨 Kadi ya Njano</option><option value="red">🟥 Kadi Nyekundu</option><option value="substitution">🔄 Substitution</option><option value="penalty">🎯 Penalty</option><option value="own goal">🥅 Own Goal</option></select><select id="aevPlayer"><option value="">Chagua mchezaji</option>${teamPlayers.map(x=>`<option value="${esc(x.id)}">${esc(name(x.id))}</option>`).join('')}</select><input id="aevMinute" type="number" min="0" max="130" placeholder="Dakika"><input id="aevDesc" placeholder="Maelezo (hiari)"><button id="aevSave">➕ Ongeza</button></div><div class="aev-list">${events.filter(x=>!String(x.event_type||'').startsWith('lineup_')).map(x=>`<div class="aev-row"><b>${icon(x.event_type)}</b><span><strong>${esc(name(x.player_id))}</strong><small>${esc(x.event_type)} · ${x.minute==null?'-':esc(x.minute)+"'"}${x.description?' · '+esc(x.description):''}</small></span><button data-del="${esc(x.id)}">🗑</button></div>`).join('')||'<div class="empty">Hakuna matukio bado.</div>'}</div>`;
 document.getElementById('aevSave').onclick=()=>add(m);box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>del(b.dataset.del,id));
}
function icon(t){t=String(t||'').toLowerCase();if(t.includes('goal')||t==='goli')return '⚽';if(t.includes('yellow')||t.includes('njano'))return '🟨';if(t.includes('red')||t.includes('nyekundu'))return '🟥';if(t.includes('sub'))return '🔄';if(t.includes('penalty'))return '🎯';return '📌'}
async function add(m){const type=document.getElementById('aevType').value,pid=document.getElementById('aevPlayer').value,minute=document.getElementById('aevMinute').value,desc=document.getElementById('aevDesc').value.trim();if(!pid){alert('Chagua mchezaji.');return}const {error}=await db.from('match_events').insert({match_id:m.id,player_id:pid,event_type:type,minute:minute===''?null:Number(minute),description:desc||null});if(error){alert('❌ '+error.message);return}await recalcScore(m.id);await load(m.id)}
async function del(id,matchId){if(!confirm('Futa tukio hili?'))return;const {error}=await db.from('match_events').delete().eq('id',id);if(error){alert('❌ '+error.message);return}await recalcScore(matchId);await load(matchId)}
async function mount(){if(document.getElementById('afrnMatchEvents'))return;const host=document.querySelector('main');if(!host)return;box=document.createElement('section');box.id='afrnMatchEvents';box.className='card';host.appendChild(box);box.innerHTML='<h2>🎬 Match Events</h2><div class="form-group"><label>Chagua Mechi</label><select id="aevMatch"><option value="">Inapakia...</option></select></div>';const clubs=await getClubs();const cn=id=>{const c=clubs.find(x=>String(x.id)===String(id));return c?.name||'Klabu'};const ms=await getMatches();const sel=document.getElementById('aevMatch');sel.innerHTML='<option value="">Chagua mechi</option>'+ms.map(m=>`<option value="${esc(m.id)}">${esc(cn(m.home_team_id))} ${m.home_score??0}-${m.away_score??0} ${esc(cn(m.away_team_id))} · ${esc(m.match_date||'')}</option>`).join('');sel.onchange=()=>sel.value&&load(sel.value);setInterval(async()=>{if(sel.value){await load(sel.value)}},15000)}
const st=document.createElement('style');st.textContent='#afrnMatchEvents .aev-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.aev-head span{display:block;font-size:12px;opacity:.7}.aev-score{font-size:28px;font-weight:800}.aev-form{display:grid;grid-template-columns:1fr 1.5fr .6fr 1.5fr auto;gap:8px;margin:15px 0}.aev-form select,.aev-form input{padding:10px;border:1px solid #dfe5ec;border-radius:8px}.aev-form button{background:#0b5ed7;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700}.aev-row{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #eee}.aev-row span{flex:1}.aev-row small{display:block;color:#6c757d}.aev-row button{background:#dc3545;color:#fff;border:0;border-radius:6px;padding:6px}@media(max-width:700px){.aev-form{grid-template-columns:1fr 1fr}.aev-form button{grid-column:1/-1}.aev-head{align-items:flex-start!important}}';document.head.appendChild(st);setTimeout(mount,0)}
mount();
})();
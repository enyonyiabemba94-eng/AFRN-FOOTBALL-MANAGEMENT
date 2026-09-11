(()=>{
'use strict';
if(window.__AFRN_STANDINGS_WORKFLOW__)return;
window.__AFRN_STANDINGS_WORKFLOW__=true;
const db=window.supabaseClient;
if(!db||typeof db.from!=='function')return;
const FINAL=['finished','completed','full time','ft'];
const norm=v=>String(v||'').trim().toLowerCase();
const isFinal=v=>FINAL.includes(norm(v));
async function syncCompetition(competitionId){
 if(!competitionId)return false;
 try{
  const [{data:teams,error:te},{data:games,error:me}]=await Promise.all([
   db.from('competition_teams').select('club_id,group_name').eq('competition_id',competitionId),
   db.from('matches').select('id,home_team_id,away_team_id,home_score,away_score,status').eq('competition_id',competitionId)
  ]);
  if(te)throw te;if(me)throw me;
  const stats=new Map();
  (teams||[]).forEach(t=>stats.set(String(t.club_id),{club_id:t.club_id,group_name:t.group_name||null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0}));
  (games||[]).filter(m=>isFinal(m.status)&&m.home_team_id&&m.away_team_id&&m.home_score!=null&&m.away_score!=null).forEach(m=>{
   const h=String(m.home_team_id),a=String(m.away_team_id),hs=Math.max(0,Number(m.home_score)||0),as=Math.max(0,Number(m.away_score)||0);
   if(!stats.has(h))stats.set(h,{club_id:m.home_team_id,group_name:null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0});
   if(!stats.has(a))stats.set(a,{club_id:m.away_team_id,group_name:null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0});
   const H=stats.get(h),A=stats.get(a);H.played++;A.played++;H.goals_for+=hs;H.goals_against+=as;A.goals_for+=as;A.goals_against+=hs;
   if(hs>as){H.wins++;H.points+=3;A.losses++;}else if(hs<as){A.wins++;A.points+=3;H.losses++;}else{H.draws++;A.draws++;H.points++;A.points++;}
  });
  const {data:existing,error:ee}=await db.from('standings').select('id,club_id,competition_id').eq('competition_id',competitionId);if(ee)throw ee;
  const byClub=new Map((existing||[]).map(r=>[String(r.club_id),r]));
  for(const s of stats.values()){
   const payload={group_name:s.group_name,played:s.played,wins:s.wins,draws:s.draws,losses:s.losses,goals_for:s.goals_for,goals_against:s.goals_against,points:s.points};
   const old=byClub.get(String(s.club_id));
   const result=old?await db.from('standings').update(payload).eq('id',old.id):await db.from('standings').insert({...payload,competition_id:competitionId,club_id:s.club_id});
   if(result.error)throw result.error;
  }
  return true;
 }catch(e){console.warn('AFRN standings sync:',e.message);return false;}
}
window.AFRNStandings={syncCompetition,syncFromMatch:async m=>m&&syncCompetition(m.competition_id)};

/* =========================================================
   AFRN MATCH NUMBER — ADMIN CONTROLLED, ALL STAGES
   Group stage -> R16 -> QF -> SF -> 3rd place -> Final.
   Uses existing matches.match_number; no new table/column.
========================================================= */
function matchNumberValue(){return String(document.getElementById('afrnMatchNumber')?.value||'').trim();}
function injectMatchNumberField(){
 if(!/matches\.html$/i.test(location.pathname))return;
 if(document.getElementById('afrnMatchNumber'))return;
 const competition=document.getElementById('competitionId');
 if(!competition)return;
 const group=competition.closest('.form-group');
 if(!group)return;
 const wrap=document.createElement('div');
 wrap.className='form-group';
 wrap.innerHTML='<label>🔢 Namba / Idadi ya Mechi *</label><input id="afrnMatchNumber" type="number" min="1" step="1" inputmode="numeric" placeholder="Mfano: 1, 2, 3..." autocomplete="off"><div class="small">Admin anaweka namba mwenyewe. Inatumika kuanzia Makundi mpaka Fainali.</div>';
 group.parentNode.insertBefore(wrap,group);
}
async function findSavedMatch(idBefore){
 if(idBefore){const r=await db.from('matches').select('id,competition_id,match_number').eq('id',idBefore).maybeSingle();return r.data||null;}
 const competition_id=document.getElementById('competitionId')?.value||'';
 const home_team_id=document.getElementById('homeClubId')?.value||'';
 const away_team_id=document.getElementById('awayClubId')?.value||'';
 const match_date=document.getElementById('matchDate')?.value||'';
 const match_time=document.getElementById('matchTime')?.value||'';
 if(!competition_id)return null;
 let q=db.from('matches').select('id,competition_id,match_number').eq('competition_id',competition_id).order('created_at',{ascending:false}).limit(1);
 if(home_team_id)q=q.eq('home_team_id',home_team_id);
 if(away_team_id)q=q.eq('away_team_id',away_team_id);
 if(match_date)q=q.eq('match_date',match_date);
 if(match_time)q=q.eq('match_time',match_time);
 const r=await q;
 return r.data?.[0]||null;
}
function hookSaveMatchNumber(){
 if(!/matches\.html$/i.test(location.pathname))return;
 const original=window.saveMatch;
 if(typeof original!=='function'||original.__afrnMatchNumberWrapped)return;
 const wrapped=async function(){
  const idBefore=document.getElementById('editMatchId')?.value||'';
  const n=matchNumberValue();
  if(!n||!/^\d+$/.test(n)||Number(n)<1){alert('⚠️ Weka Namba / Idadi ya Mechi (mfano 1, 2, 3...).');return;}
  const snapshot={competition:document.getElementById('competitionId')?.value||'',home:document.getElementById('homeClubId')?.value||'',away:document.getElementById('awayClubId')?.value||'',date:document.getElementById('matchDate')?.value||'',time:document.getElementById('matchTime')?.value||''};
  const result=await original.apply(this,arguments);
  try{
   let saved=null;
   if(idBefore){const r=await db.from('matches').select('id,competition_id').eq('id',idBefore).maybeSingle();saved=r.data||null;}
   if(!saved){let q=db.from('matches').select('id,competition_id').eq('competition_id',snapshot.competition).order('created_at',{ascending:false}).limit(1);if(snapshot.home)q=q.eq('home_team_id',snapshot.home);if(snapshot.away)q=q.eq('away_team_id',snapshot.away);if(snapshot.date)q=q.eq('match_date',snapshot.date);if(snapshot.time)q=q.eq('match_time',snapshot.time);const r=await q;saved=r.data?.[0]||null;}
   if(saved){const u=await db.from('matches').update({match_number:Number(n)}).eq('id',saved.id);if(u.error)throw u.error;}
   else console.warn('AFRN: mechi imehifadhiwa lakini haikupatikana kwa kuunganisha match_number.');
  }catch(e){console.warn('AFRN match number save:',e.message);alert('⚠️ Mechi imehifadhiwa, lakini Namba ya Mechi haikuweza kuunganishwa: '+e.message);}
  return result;
 };
 wrapped.__afrnMatchNumberWrapped=true;
 window.saveMatch=wrapped;
}
async function refreshMatchNumberColumn(){
 if(!/matches\.html$/i.test(location.pathname))return;
 const tbody=document.getElementById('matchesTable');if(!tbody)return;
 const competition=document.getElementById('filterCompetition')?.value||'';
 const status=document.getElementById('filterStatus')?.value||'';
 let q=db.from('matches').select('id,match_number').order('match_date',{ascending:false});
 if(competition)q=q.eq('competition_id',competition);
 if(status)q=q.eq('status',status);
 const r=await q;if(r.error||!r.data)return;
 const rows=Array.from(tbody.querySelectorAll('tr')).filter(tr=>tr.children.length>1);
 rows.forEach((tr,i)=>{if(r.data[i])tr.cells[0].textContent=r.data[i].match_number!=null?'#'+r.data[i].match_number:'#—';});
}
function hookLoadMatches(){
 if(!/matches\.html$/i.test(location.pathname))return;
 const original=window.loadMatches;
 if(typeof original!=='function'||original.__afrnMatchNumberWrapped)return;
 const wrapped=async function(){const r=await original.apply(this,arguments);setTimeout(refreshMatchNumberColumn,100);return r;};
 wrapped.__afrnMatchNumberWrapped=true;window.loadMatches=wrapped;
}
function fillExistingMatchNumber(){
 const id=document.getElementById('editMatchId')?.value||'';if(!id)return;
 db.from('matches').select('match_number').eq('id',id).maybeSingle().then(r=>{if(r.data&&document.getElementById('afrnMatchNumber'))document.getElementById('afrnMatchNumber').value=r.data.match_number??'';});
}
function watchEditMatch(){
 if(!/matches\.html$/i.test(location.pathname))return;
 const el=document.getElementById('editMatchId');if(!el)return;
 let last='';setInterval(()=>{const x=el.value||'';if(x!==last){last=x;if(x)fillExistingMatchNumber();else if(document.getElementById('afrnMatchNumber'))document.getElementById('afrnMatchNumber').value='';}},500);
}
function installMatchNumber(){
 injectMatchNumberField();
 hookSaveMatchNumber();
 hookLoadMatches();
 watchEditMatch();
 setTimeout(injectMatchNumberField,500);setTimeout(hookSaveMatchNumber,500);setTimeout(hookLoadMatches,500);
 setTimeout(injectMatchNumberField,1500);setTimeout(hookSaveMatchNumber,1500);setTimeout(hookLoadMatches,1500);
 setTimeout(refreshMatchNumberColumn,1800);
}
setTimeout(installMatchNumber,700);setTimeout(installMatchNumber,2000);setTimeout(installMatchNumber,4000);

function hook(){
 if(!/matches\.html$/i.test(location.pathname))return;
 const original=window.saveMatch;if(typeof original!=='function'||original.__afrnWrapped)return;
 const wrapped=async function(){
  const idBefore=document.getElementById('editMatchId')?.value||'';
  const result=await original.apply(this,arguments);
  const id=document.getElementById('editMatchId')?.value||idBefore;
  if(id){const {data}=await db.from('matches').select('competition_id,status').eq('id',id).maybeSingle();if(data&&isFinal(data.status))await syncCompetition(data.competition_id);}
  return result;
 };wrapped.__afrnWrapped=true;window.saveMatch=wrapped;
}
setTimeout(hook,500);setTimeout(hook,1500);setTimeout(hook,3000);
const channel=db.channel('afrn-standings-sync').on('postgres_changes',{event:'*',schema:'public',table:'matches'},p=>{
 const x=p.new||p.old;
 if(x&&x.competition_id)syncCompetition(x.competition_id);
});channel.subscribe();
})();
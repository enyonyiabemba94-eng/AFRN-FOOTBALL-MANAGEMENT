/* AFRN Competition ↔ Match Center bridge
   Connects Group Stage + Knockout results entered in matches.html to the existing
   competition knockout tree. No new tables. Uses existing matches.notes stage/slot markers.
*/
(()=>{
'use strict';
if(window.__AFRN_COMPETITION_MATCH_SYNC__)return;
window.__AFRN_COMPETITION_MATCH_SYNC__=true;
if(!/matches\.html$/i.test(location.pathname))return;
const db=()=>window.supabaseClient||window.supabase;
const FINAL=['finished','completed','played','full time','ft'];
const norm=v=>String(v??'').trim().toLowerCase();
const isFinal=v=>FINAL.includes(norm(v));
const stageOf=m=>String(m?.notes||'').match(/AFRN_STAGE=(R16|QF|SF|3RD|FINAL)/)?.[1]||'';
const slotOf=m=>Number(String(m?.notes||'').match(/AFRN_SLOT=(\d+)/)?.[1]||0);
const winner=m=>{if(!m||!isFinal(m.status)||m.home_score==null||m.away_score==null)return null;const h=Number(m.home_score),a=Number(m.away_score);if(h>a)return m.home_team_id;if(a>h)return m.away_team_id;const n=String(m.notes||'');if(/AFRN_WINNER=HOME/.test(n))return m.home_team_id;if(/AFRN_WINNER=AWAY/.test(n))return m.away_team_id;return null;};
const loser=m=>{const w=winner(m);if(!w)return null;return String(w)===String(m.home_team_id)?m.away_team_id:m.home_team_id;};
async function loadCompetition(id){
 const D=db();
 const r=await D.from('matches').select('*').eq('competition_id',id).order('match_number');
 if(r.error)throw r.error;
 return r.data||[];
}
async function ensure(D,compId,stage,slot,home,away,label){
 if(!home||!away||String(home)===String(away))return null;
 const all=await loadCompetition(compId);
 let m=all.find(x=>stageOf(x)===stage&&slotOf(x)===slot);
 const note='AFRN_STAGE='+stage+'|AFRN_SLOT='+slot+(label?'|'+label:'');
 if(m){
  if(String(m.home_team_id)!==String(home)||String(m.away_team_id)!==String(away)){
   const r=await D.from('matches').update({home_team_id:home,away_team_id:away,notes:note,status:'scheduled',home_score:null,away_score:null}).eq('id',m.id);
   if(r.error)throw r.error;
  }
  return m;
 }
 const max=Math.max(0,...all.map(x=>Number(x.match_number)||0));
 const r=await D.from('matches').insert({competition_id:compId,home_team_id:home,away_team_id:away,match_number:max+1,status:'scheduled',notes:note}).select().single();
 if(r.error)throw r.error;
 return r.data;
}
async function progress(compId){
 const D=db();if(!D?.from||!compId)return;
 let all=await loadCompetition(compId);
 const by=(stage,n)=>all.filter(m=>stageOf(m)===stage).sort((a,b)=>slotOf(a)-slotOf(b)).find(m=>slotOf(m)===n);
 const maybeWinner=async m=>{
  if(!m||!isFinal(m.status)||m.home_score==null||m.away_score==null)return winner(m);
  if(Number(m.home_score)!==Number(m.away_score))return winner(m);
  if(winner(m))return winner(m);
  const pick=prompt('⚽ Mechi ya hatua ya '+stageOf(m)+' imeisha sare. Andika HOME au AWAY kwa mshindi wa extra time/penalty:','');
  if(!/^home$|^away$/i.test(pick||''))return null;
  const token='|AFRN_WINNER='+pick.toUpperCase();
  const clean=String(m.notes||'').replace(/\|AFRN_WINNER=(HOME|AWAY)/g,'');
  const r=await D.from('matches').update({notes:clean+token}).eq('id',m.id);if(r.error)throw r.error;
  m.notes=clean+token;return winner(m);
 };
 const r16=all.filter(m=>stageOf(m)==='R16').sort((a,b)=>slotOf(a)-slotOf(b));
 if(r16.length===8){
  const ws=[];for(const m of r16)ws.push(await maybeWinner(m));
  if(ws.every(Boolean)){
   await ensure(D,compId,'QF',1,ws[0],ws[1],'QF 1');
   await ensure(D,compId,'QF',2,ws[2],ws[3],'QF 2');
   await ensure(D,compId,'QF',3,ws[4],ws[5],'QF 3');
   await ensure(D,compId,'QF',4,ws[6],ws[7],'QF 4');
  }
 }
 all=await loadCompetition(compId);
 const qf=all.filter(m=>stageOf(m)==='QF').sort((a,b)=>slotOf(a)-slotOf(b));
 if(qf.length===4){const ws=[];for(const m of qf)ws.push(await maybeWinner(m));if(ws.every(Boolean)){await ensure(D,compId,'SF',1,ws[0],ws[2],'SF 1');await ensure(D,compId,'SF',2,ws[1],ws[3],'SF 2');}}
 all=await loadCompetition(compId);
 const sf=all.filter(m=>stageOf(m)==='SF').sort((a,b)=>slotOf(a)-slotOf(b));
 if(sf.length===2){const ws=[],ls=[];for(const m of sf){ws.push(await maybeWinner(m));ls.push(loser(m));}if(ws.every(Boolean)){await ensure(D,compId,'FINAL',1,ws[0],ws[1],'Final');if(ls.every(Boolean))await ensure(D,compId,'3RD',1,ls[0],ls[1],'Mshindi wa 3');}}
}
async function run(){try{
 const D=db();if(!D?.from)return;
 const id=new URLSearchParams(location.search).get('competition_id')||new URLSearchParams(location.search).get('competitionId');
 const selected=document.getElementById('competitionId');const compId=id||selected?.value||'';
 if(!compId)return;
 await progress(compId);
 if(typeof window.loadMatches==='function')try{await window.loadMatches()}catch(_){}
}catch(e){console.warn('AFRN Competition Match Sync:',e.message||e)}}
window.AFRNCompetitionMatchSync=run;
[1200,3500].forEach(t=>setTimeout(run,t));
})();

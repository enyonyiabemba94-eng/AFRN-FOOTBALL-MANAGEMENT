/* AFRN Penalty Shootout Manager v1
   Knockout only: R16, QF, SF, 3RD, FINAL.
   Regular score stays in home_score/away_score.
   Shootout score is stored in home_penalties/away_penalties and does NOT affect GF/GA.
*/
(function(){
'use strict';
if(window.__AFRN_PENALTY_V1__) return;
window.__AFRN_PENALTY_V1__=true;
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const STAGES=['R16','QF','SF','3RD','FINAL'];
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
let db,comp,clubs=[],matches=[];
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function cid(){
 const a=$('#teamCompetitionId')?.value||$('#generatorCompetitionId')?.value;
 if(a)return a;
 const s=$('select[name="competition_id"]'); if(s?.value)return s.value;
 const opts=[...document.querySelectorAll('option')]; const o=opts.find(x=>/UPENDO WA WAKIMBIZI/i.test(x.textContent||'')); return o?.value||null;
}
function stage(m){const x=String(m.notes||'').match(/AFRN_STAGE=(R16|QF|SF|3RD|FINAL)/);return x?x[1]:null;}
function slot(m){const x=String(m.notes||'').match(/AFRN_SLOT=(\d+)/);return x?Number(x[1]):999;}
function cname(id){return clubs.find(c=>String(c.id)===String(id))?.name||'—';}
function isKnockout(m){return STAGES.includes(stage(m));}
function played(m){return m?.home_score!=null&&m?.away_score!=null&&Number.isInteger(Number(m.home_score))&&Number.isInteger(Number(m.away_score));}
function winner(m){if(!played(m))return null;const hs=Number(m.home_score),as=Number(m.away_score);if(hs>as)return m.home_team_id;if(as>hs)return m.away_team_id;const hp=m.home_penalties,ap=m.away_penalties;if(hp!=null&&ap!=null&&Number(hp)!==Number(ap))return Number(hp)>Number(ap)?m.home_team_id:m.away_team_id;const n=String(m.notes||'');return n.includes('AFRN_WINNER=HOME')?m.home_team_id:n.includes('AFRN_WINNER=AWAY')?m.away_team_id:null;}
function loser(m){const w=winner(m);if(!w)return null;return String(w)===String(m.home_team_id)?m.away_team_id:m.home_team_id;}
async function load(){
 comp={id:cid()}; if(!comp.id)return false; db=client();
 const [c,m]=await Promise.all([
  db.from('clubs').select('id,name').order('name'),
  db.from('matches').select('*').eq('competition_id',comp.id).order('match_number')
 ]);
 if(c.error)throw c.error;if(m.error)throw m.error;clubs=c.data||[];matches=m.data||[];return true;
}
function ordered(stageName){return matches.filter(m=>stage(m)===stageName).sort((a,b)=>slot(a)-slot(b));}
function note(stageName,i,label){return `AFRN_STAGE=${stageName}|AFRN_SLOT=${i}|${label||stageName+' '+i}`;}
async function ensure(stageName,i,home,away,label){
 if(!home||!away)return null;
 let m=ordered(stageName).find(x=>slot(x)===i);
 if(m){
  const patch={home_team_id:home,away_team_id:away,notes:note(stageName,i,label)};
  if(String(m.home_team_id)!==String(home)||String(m.away_team_id)!==String(away)||String(m.notes)!==String(patch.notes)){
   const r=await db.from('matches').update(patch).eq('id',m.id);if(r.error)throw r.error;Object.assign(m,patch);
  }
  return m;
 }
 const nums=matches.map(x=>Number(x.match_number)||0);let num=Math.max(0,...nums)+1;
 const desired={R16:[37,38,39,40,41,42,43,44][i-1],QF:[45,46,47,48][i-1],SF:[49,50][i-1],3RD:51,FINAL:52};if(desired)num=desired;
 const r=await db.from('matches').insert({competition_id:comp.id,home_team_id:home,away_team_id:away,match_number:num,status:'scheduled',notes:note(stageName,i,label)}).select().single();
 if(r.error)throw r.error;matches.push(r.data);return r.data;
}
async function progress(){
 await load();
 const r=ordered('R16');
 if(r.length===8&&r.every(winner)){
  for(const [i,a,b] of [[1,1,2],[2,3,4],[3,5,6],[4,7,8]]) await ensure('QF',i,winner(r[a-1]),winner(r[b-1]),'QF '+i);
 }
 await load();const q=ordered('QF');
 if(q.length===4&&q.every(winner)){
  await ensure('SF',1,winner(q[0]),winner(q[2]),'SF 1');
  await ensure('SF',2,winner(q[1]),winner(q[3]),'SF 2');
 }
 await load();const s=ordered('SF');
 if(s.length===2&&s.every(winner)){
  await ensure('3RD',1,loser(s[0]),loser(s[1]),'Mshindi wa 3');
  await ensure('FINAL',1,winner(s[0]),winner(s[1]),'Final');
 }
}
async function savePenalty(id){
 const m=matches.find(x=>String(x.id)===String(id));if(!m)return;
 if(!played(m))return alert('⚠️ Kwanza hifadhi matokeo ya dakika 90.');
 if(Number(m.home_score)!==Number(m.away_score))return alert('⚠️ Mikwaju inaruhusiwa tu kama dakika 90 zimeisha sare.');
 let hp=prompt('Mikwaju — '+cname(m.home_team_id),m.home_penalties??'');if(hp===null)return;
 let ap=prompt('Mikwaju — '+cname(m.away_team_id),m.away_penalties??'');if(ap===null)return;
 hp=Number(hp);ap=Number(ap);
 if(!Number.isInteger(hp)||!Number.isInteger(ap)||hp<0||ap<0||hp===ap)return alert('⚠️ Mikwaju si sahihi. Weka namba mbili tofauti, mfano 4 na 3.');
 const clean=String(m.notes||'').replace(/\|AFRN_WINNER=(HOME|AWAY)/g,'').replace(/\|AFRN_PEN=[^|]+/g,'');
 const side=hp>ap?'HOME':'AWAY';
 const r=await db.from('matches').update({home_penalties:hp,away_penalties:ap,status:'played',notes:clean+'|AFRN_WINNER='+side+'|AFRN_PEN='+hp+'-'+ap}).eq('id',id);
 if(r.error)return alert('❌ '+r.error.message);
 await progress();await load();render();alert('✅ Mikwaju imehifadhiwa: '+hp+'–'+ap+'. Mshindi ameendelezwa hatua inayofuata.');
}
function resultText(m){if(!played(m))return 'Haijachezwa';const a=Number(m.home_score),b=Number(m.away_score);if(a!==b)return `${a} – ${b}`;if(m.home_penalties!=null&&m.away_penalties!=null)return `${a} – ${b}  (Mikwaju ${m.home_penalties} – ${m.away_penalties})`;return `${a} – ${b}  (Sare — chagua mshindi kwa mikwaju)`;}
function render(){
 const old=$('#afrnPenaltyPanel');if(old)old.remove();
 const root=$('#afrnKOTable');if(!root||!comp?.id)return;
 const ko=matches.filter(isKnockout).sort((a,b)=>(STAGES.indexOf(stage(a))-STAGES.indexOf(stage(b)))||slot(a)-slot(b));
 if(!ko.length)return;
 const box=document.createElement('div');box.id='afrnPenaltyPanel';box.className='ce-card';
 box.innerHTML='<h3>🥅 MIKWAJU YA PENALTY — HATUA ZA KNOCKOUT</h3><p class="ce-muted">Mikwaju inawekwa tu baada ya dakika 90 kuisha sare. Alama za mikwaju haziongezwi kwenye GF/GA.</p><div id="afrnPenaltyRows"></div>';
 const rows=$('#afrnPenaltyRows',box);
 ko.forEach(m=>{
  const tied=played(m)&&Number(m.home_score)===Number(m.away_score);
  const row=document.createElement('div');row.className='ce-actions';row.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid #ddd;padding:10px 0';
  row.innerHTML=`<span style="min-width:230px"><b>${esc(stage(m))} ${slot(m)}</b> — ${esc(cname(m.home_team_id))} vs ${esc(cname(m.away_team_id))}<br><span class="ce-muted">${esc(resultText(m))}</span></span>${tied?`<button class="primary" data-pen="${m.id}">🥅 Weka Mikwaju</button>`:`<span class="ce-muted">${played(m)?'Mshindi tayari anajulikana.':'Subiri matokeo.'}</span>`}`;
  rows.appendChild(row);
  row.querySelector('[data-pen]')?.addEventListener('click',()=>savePenalty(m.id));
 });
 root.parentNode.insertBefore(box,root);
}
async function run(){try{if(await load())render();}catch(e){console.error('AFRN penalty manager',e);}}
let timer=0;const boot=()=>{clearTimeout(timer);timer=setTimeout(run,700);};
new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

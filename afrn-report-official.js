(()=>{
'use strict';
if(window.__AFRN_OFFICIAL_REPORT__) return;
window.__AFRN_OFFICIAL_REPORT__=true;
const pad=n=>String(n).padStart(5,'0');
const today=()=>new Date().toISOString().slice(0,10);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const id8=v=>String(v||'').replace(/-/g,'').slice(0,8).toUpperCase();
const matchNo=m=>m?.match_number?`MR-${new Date(m.match_date||Date.now()).getFullYear()}-${pad(m.match_number)}`:`MR-${new Date(m?.match_date||Date.now()).getFullYear()}-${id8(m?.id)}`;
const stamp=(type,id)=>{const box=document.createElement('div');box.className='official-meta';box.innerHTML=`<div><b>DOCUMENT TYPE</b>${esc(type)}</div><div><b>DOCUMENT NO.</b>${esc(id)}</div><div><b>GENERATED</b>${today()}</div><div><b>STATUS</b><span>OFFICIAL</span></div>`;return box};
const addMeta=()=>{
 const report=document.querySelector('#reportContainer .report');
 if(!report||report.querySelector('.official-meta')) return;
 const heading=[...report.querySelectorAll('.report-head h1,.report-head h2')].map(x=>x.textContent).join(' ').toLowerCase();
 const matchId=document.getElementById('matchSelect')?.value;
 const playerId=document.getElementById('playerSelect')?.value;
 const clubId=document.getElementById('clubSelect')?.value;
 const competitionId=document.getElementById('competitionSelect')?.value;
 let type='AFRN OFFICIAL REPORT',id=`AFRN-RPT-${today().replace(/-/g,'')}`;
 if(heading.includes('match')){const m=window.matches?.find(x=>String(x.id)===String(matchId));type='OFFICIAL MATCH REPORT';id=matchNo(m||{id:matchId});}
 else if(heading.includes('player')){const p=window.players?.find(x=>String(x.id)===String(playerId));type='OFFICIAL PLAYER REPORT';id=`PLY-${String(p?.player_id_number||p?.afrn_player_id||p?.id||playerId||'').replace(/^AFRN-/i,'AFRN-')}`;}
 else if(heading.includes('club')){const c=window.clubs?.find(x=>String(x.id)===String(clubId));type='OFFICIAL CLUB REPORT';id=`CLB-${c?.afrn_club_id||c?.club_code||id8(c?.id||clubId)}`;}
 else if(heading.includes('competition')){type='OFFICIAL COMPETITION REPORT';id=`CMP-${id8(competitionId)}`;}
 report.querySelector('.report-head')?.after(stamp(type,id));
};
const style=document.createElement('style');style.textContent='.official-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0;padding:10px;border:1px solid #dce2ea;border-radius:9px;background:#f7f9fc;text-align:center}.official-meta div{font-size:10px}.official-meta b{display:block;font-size:8px;color:#687386;margin-bottom:3px}.official-meta span{font-weight:900;color:#16834b}@media(max-width:520px){.official-meta{grid-template-columns:1fr 1fr}}@media print{.official-meta{break-inside:avoid}}';document.head.appendChild(style);
['loadMatchReport','loadPlayerReport','loadClubReport','loadCompetitionReport'].forEach(name=>{const original=window[name];if(typeof original!=='function')return;window[name]=async function(...args){const r=await original.apply(this,args);setTimeout(addMeta,20);return r;};});
new MutationObserver(addMeta).observe(document.body,{childList:true,subtree:true});
})();
/* AFRN Competition Knockout Engine
   Admin-controlled draw -> 8 group labels A-H -> exact AFRN R16 -> QF -> SF -> 3rd -> Final.
   No fixed team count. No new tables. G/H may be real groups OR Best-Loser qualification slots.
*/
(function(){
'use strict';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
let db,comp,clubs=[],teams=[],matches=[],bestLosers=[];
const GROUPS=['A','B','C','D','E','F','G','H'];
const BL_SLOTS=['G1','G2','H1','H2'];
const R16=[['A','B'],['C','D'],['B','A'],['D','C'],['E','F'],['G','H'],['F','E'],['H','G']];
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function cname(id){return clubs.find(c=>String(c.id)===String(id))?.name||'—';}
function stageMatches(stage){return matches.filter(m=>String(m.notes||'').includes('AFRN_STAGE='+stage));}
function slot(m){const x=String(m.notes||'').match(/AFRN_SLOT=(\d+)/);return x?Number(x[1]):999;}
function played(m){return m&&m.home_score!=null&&m.away_score!=null&&Number.isInteger(Number(m.home_score))&&Number.isInteger(Number(m.away_score));}
function winner(m){if(!played(m))return null;const hs=Number(m.home_score),as=Number(m.away_score);if(hs>as)return m.home_team_id;if(as>hs)return m.away_team_id;const n=String(m.notes||'');return n.includes('AFRN_WINNER=HOME')?m.home_team_id:n.includes('AFRN_WINNER=AWAY')?m.away_team_id:null;}
function loser(m){const w=winner(m);if(!w)return null;return String(w)===String(m.home_team_id)?m.away_team_id:m.home_team_id;}
function isKnockout(m){return /AFRN_STAGE=(R16|QF|SF|3RD|FINAL)/.test(String(m.notes||''));}
function groupMap(){const out={};for(const t of teams){const g=String(t.group_name||'').trim().toUpperCase();if(!GROUPS.includes(g))continue;(out[g]??=[]).push(String(t.club_id));}return out;}
function standings(){
 const groups=groupMap(),out={};
 const cards={};
 for(const e of window.__afrnEvents||[]){const typ=String(e.event_type||'').toLowerCase(),cid=String(e.club_id||'');if(!cid)continue;(cards[cid]??={yc:0,rc:0});if(typ.includes('red'))cards[cid].rc++;else if(typ.includes('yellow'))cards[cid].yc++;}
 for(const g of Object.keys(groups).sort()){
  const rows=groups[g].map(id=>{const c=cards[id]||{yc:0,rc:0};return{id,p:0,gf:0,ga:0,yc:c.yc,rc:c.rc};});
  for(const m of matches.filter(x=>!isKnockout(x)&&played(x))){const h=rows.find(r=>String(r.id)===String(m.home_team_id)),a=rows.find(r=>String(r.id)===String(m.away_team_id));if(!h||!a)continue;const hs=Number(m.home_score),as=Number(m.away_score);h.gf+=hs;h.ga+=as;a.gf+=as;a.ga+=hs;if(hs>as)h.p+=3;else if(as>hs)a.p+=3;else{h.p++;a.p++;}}
  rows.sort((a,b)=>b.p-a.p||b.gf-a.gf||a.ga-b.ga||a.rc-b.rc||a.yc-b.yc||String(a.id).localeCompare(String(b.id)));
  out[g]=rows.map((r,i)=>({...r,rank:i+1}));
 }
 return out;
}
function q(g,rank){return (standings()[g]||[]).find(r=>r.rank===rank)?.id||null;}
function bestLoserCandidates(){
 const s=standings(),out=[];
 for(const g of GROUPS){
  for(const r of (s[g]||[])) if(r.rank>=3) out.push({id:r.id,group:g,rank:r.rank,p:r.p,gf:r.gf,ga:r.ga,rc:r.rc,yc:r.yc});
 }
 return out;
}
function loadBestLosers(){try{const x=JSON.parse(localStorage.getItem('afrn_best_losers_'+comp.id)||'[]');bestLosers=Array.isArray(x)?x.filter(x=>x&&BL_SLOTS.includes(x.slot)):[];}catch(_){bestLosers=[];}}
function saveBestLosers(){try{localStorage.setItem('afrn_best_losers_'+comp.id,JSON.stringify(bestLosers));}catch(_){} }
function blTeam(s){return bestLosers.find(x=>x.slot===s)?.teamId||null;}
function load(){return Promise.all([
 db.from('clubs').select('id,name,division').order('name'),
 db.from('competition_teams').select('id,club_id,group_name').eq('competition_id',comp.id),
 db.from('matches').select('*').eq('competition_id',comp.id).order('match_number')
 ]).then(async ([c,t,m])=>{
  if(c.error||t.error||m.error)throw new Error(c.error?.message||t.error?.message||m.error?.message||'Failed loading competition data');
  clubs=c.data||[];teams=t.data||[];matches=m.data||[];window.__afrnEvents=[];
  const mids=matches.map(x=>x.id);if(mids.length){const er=await db.from('match_events').select('match_id,club_id,event_type').in('match_id',mids);if(!er.error)window.__afrnEvents=er.data||[];}
 });}
function validation(){
 const gm=groupMap(),duplicates=[],seen=new Set();
 for(const t of teams){const id=String(t.club_id);if(seen.has(id))duplicates.push(id);seen.add(id);}
 const actual=GROUPS.filter(g=>(gm[g]||[]).length>0);
 const missingDirect=GROUPS.filter(g=>(gm[g]||[]).length<2);
 const physicalReady=GROUPS.every(g=>(gm[g]||[]).length>=2);
 const virtualGH=!(gm.G?.length>=2)&&!(gm.H?.length>=2);
 const blIds=bestLosers.map(x=>String(x.teamId));
 const blUnique=new Set(blIds).size===blIds.length;
 const blReady=BL_SLOTS.every(s=>!!blTeam(s))&&blUnique;
 const directReady=GROUPS.filter(g=>!['G','H'].includes(g)).every(g=>(gm[g]||[]).length>=2);
 return{gm,actual,duplicates,missingDirect,physicalReady,virtualGH,blReady,directReady,ok:duplicates.length===0&&((physicalReady)||(directReady&&virtualGH&&blReady))};
}
function qualificationMap(){
 const s=standings(),gm=groupMap(),map={};
 for(const g of GROUPS){
  if((gm[g]||[]).length>=2){map[g+'1']=q(g,1);map[g+'2']=q(g,2);}
 }
 if((gm.G||[]).length<2&&(gm.H||[]).length<2){map.G1=blTeam('G1');map.G2=blTeam('G2');map.H1=blTeam('H1');map.H2=blTeam('H2');}
 return map;
}
function notes(stage,i,label=''){return 'AFRN_STAGE='+stage+'|AFRN_SLOT='+i+(label?'|'+label:'');}
async function ensureMatch(stage,index,home,away,label){
 if(!home||!away)return null;
 let m=stageMatches(stage).find(x=>slot(x)===index);
 if(m){if(String(m.home_team_id)!==String(home)||String(m.away_team_id)!==String(away)){const r=await db.from('matches').update({home_team_id:home,away_team_id:away,notes:notes(stage,index,label)}).eq('id',m.id);if(r.error)throw r.error;m={...m,home_team_id:home,away_team_id:away,notes:notes(stage,index,label)};}return m;}
 const max=Math.max(0,...matches.map(x=>Number(x.match_number)||0));
 const r=await db.from('matches').insert({competition_id:comp.id,home_team_id:home,away_team_id:away,match_number:max+1,status:'scheduled',notes:notes(stage,index,label)}).select().single();
 if(r.error)throw r.error;matches.push(r.data);return r.data;
}
async function generateR16(){try{
 await load();loadBestLosers();const v=validation();
 if(!v.ok){alert('⚠️ R16 bado haijawa tayari. Admin lazima amalize droo kwenye makundi A–H. Kila kundi linalotumika kwa R16 liwe na nafasi 1 na 2; au, kwa mfumo wa Best Losers, G/H zijazwe 1G, 2G, 1H, 2H. Hakuna timu itakayogawiwa automatically.');return;}
 const map=qualificationMap();
 const pairs=[[map.A1,map.B2],[map.C1,map.D2],[map.B1,map.A2],[map.D1,map.C2],[map.E1,map.F2],[map.G1,map.H2],[map.F1,map.E2],[map.H1,map.G2]];
 if(pairs.some(p=>!p[0]||!p[1])){alert('⚠️ R16 haijakamilika: baadhi ya nafasi za qualifiers hazina timu.');return;}
 for(let i=0;i<pairs.length;i++){const [home,away]=pairs[i];const label=(i===5||i===7)?'R16 '+(i+1)+' | G/H qualification slots':'R16 '+(i+1);await ensureMatch('R16',i+1,home,away,label);}
 await load();render();alert('✅ R16 imetengenezwa kutoka kwenye droo ya Admin. Hakuna idadi maalum ya timu iliyowekwa kwenye mfumo.');
 }catch(e){alert('❌ '+(e.message||e));}}
async function autoProgress(){
 await load();let r=stageMatches('R16').sort((a,b)=>slot(a)-slot(b));
 if(r.length===8&&r.every(winner))for(const [i,a,b] of [[1,1,2],[2,3,4],[3,5,6],[4,7,8]])await ensureMatch('QF',i,winner(r[a-1]),winner(r[b-1]),'QF '+i);
 await load();let qf=stageMatches('QF').sort((a,b)=>slot(a)-slot(b));
 if(qf.length===4&&qf.every(winner)){await ensureMatch('SF',1,winner(qf[0]),winner(qf[2]),'SF 1');await ensureMatch('SF',2,winner(qf[1]),winner(qf[3]),'SF 2');}
 await load();let sf=stageMatches('SF').sort((a,b)=>slot(a)-slot(b));
 if(sf.length===2&&sf.every(winner)){await ensureMatch('3RD',1,loser(sf[0]),loser(sf[1]),'Mshindi wa 3');await ensureMatch('FINAL',1,winner(sf[0]),winner(sf[1]),'Final');}
}
async function saveResult(id){
 const m=matches.find(x=>String(x.id)===String(id));if(!m)return;
 let hs=prompt('Magoli '+cname(m.home_team_id),m.home_score??0),as=prompt('Magoli '+cname(m.away_team_id),m.away_score??0);if(hs===null||as===null)return;
 hs=Number(hs);as=Number(as);if(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0)return alert('Score si sahihi.');
 let winToken='';if(hs===as){const pick=prompt('Sare. Andika HOME au AWAY kwa mshindi wa extra time/penalty:','');if(!/^home$|^away$/i.test(pick||''))return alert('Chagua HOME au AWAY.');winToken='|AFRN_WINNER='+pick.toUpperCase();}
 const clean=String(m.notes||'').replace(/\|AFRN_WINNER=(HOME|AWAY)/g,'');
 const r=await db.from('matches').update({home_score:hs,away_score:as,status:'played',notes:clean+winToken}).eq('id',id);if(r.error)return alert('❌ '+r.error.message);
 await autoProgress();await load();render();
}
function renderBestLoser(){
 const root=$('#afrnBestLoser');if(!root)return;
 const v=validation(),cands=bestLoserCandidates(),show=!(v.gm.G?.length>=2)&&!(v.gm.H?.length>=2);
 if(!show){root.innerHTML='';return;}
 let html='<div class="ce-card"><h3>⭐ BEST LOSERS — Qualification Slots G/H</h3><p class="ce-muted">Hii ni option ya mashindano ambayo G na H hazina timu za moja kwa moja. Admin anachagua Best Losers kutoka kwenye msimamo; mfumo hauwagawi timu automatically.</p><div class="ce-grid2">';
 for(const s of BL_SLOTS){const cur=bestLosers.find(x=>x.slot===s);html+='<div><label class="ce-muted"><b>'+s+'</b> — Best Loser</label><select id="afrnBL_'+s+'" class="ce-field"><option value="">Chagua timu</option>'+cands.map(x=>'<option value="'+x.id+'" '+(cur&&String(cur.teamId)===String(x.id)?'selected':'')+'>'+esc(cname(x.id))+' — Kundi '+esc(x.group)+' — Nafasi '+x.rank+' — '+x.p+' pts</option>').join('')+'</select></div>';}
 html+='</div><div class="ce-actions"><button id="afrnBLSave" class="primary">💾 Hifadhi Best Losers 4</button><button id="afrnBLClear" class="secondary">🗑️ Ondoa</button></div>';
 if(bestLosers.length)html+='<div class="ce-good">'+BL_SLOTS.map(s=>{const x=bestLosers.find(x=>x.slot===s);return x?('✅ '+s+': '+esc(cname(x.teamId))):('⏳ '+s+': bado');}).join('<br>')+'</div>';
 html+='</div>';root.innerHTML=html;
 $('#afrnBLSave').onclick=()=>{const picks=BL_SLOTS.map(s=>({slot:s,teamId:$('#afrnBL_'+s).value}));if(picks.some(x=>!x.teamId))return alert('⚠️ Chagua Best Losers wote: 1G, 2G, 1H, 2H.');if(new Set(picks.map(x=>x.teamId)).size!==4)return alert('⚠️ Timu moja haiwezi kuchaguliwa mara mbili.');const allowed=new Set(cands.map(x=>String(x.id)));if(picks.some(x=>!allowed.has(String(x.teamId))))return alert('⚠️ Best Loser lazima awe nafasi ya 3 au chini.');bestLosers=picks;saveBestLosers();render();};
 $('#afrnBLClear').onclick=()=>{bestLosers=[];saveBestLosers();render();};
}
function render(){
 const root=$('#afrnKOTable');if(!root)return;let bl=$('#afrnBestLoser');if(!bl){bl=document.createElement('div');bl.id='afrnBestLoser';root.parentNode.insertBefore(bl,root);}renderBestLoser();
 const v=validation();const stages=[['R16','HATUA YA 16 BORA',8],['QF','ROBO FAINALI',4],['SF','NUSU FAINALI / DEMI FINAL',2],['3RD','MSHINDI WA TATU / CLASSEMENT',1],['FINAL','FAINALI',1]];let html='';
 if(!v.ok)html+='<div class="ce-card ce-warning"><b>⚠️ Droo/qualification bado haijakamilika.</b><br>Admin ndiye anaweka timu kwenye A–H kulingana na droo. Mfumo hautagawi timu automatically. Kwa mfumo wa Best Losers, G/H zinaweza kuwa qualification slots 1G, 2G, 1H, 2H.</div>';
 for(const [stage,title,count] of stages){const ms=stageMatches(stage).sort((a,b)=>slot(a)-slot(b));html+='<div class="ce-card"><h3>'+title+'</h3>';for(let i=0;i<count;i++){const m=ms[i],label=stage==='R16'?(i+1)+'. '+R16[i][0]+' × '+R16[i][1]:stage+' '+(i+1);if(!m){html+='<div class="ce-team"><span><b>'+label+'</b> — Inasubiri qualifiers</span></div>';continue;}const sc=played(m)?m.home_score+' : '+m.away_score:'- : -',wm=winner(m)?' 🏆':'';html+='<div class="ce-team"><span><b>'+label+'</b><br>'+esc(cname(m.home_team_id))+' <strong>'+sc+'</strong> '+esc(cname(m.away_team_id))+wm+'</span><button class="small-btn" data-kor="'+m.id+'">'+(played(m)?'Badili Result':'Weka Result')+'</button></div>';}html+='</div>';}
 root.innerHTML=html;$$('[data-kor]',root).forEach(b=>b.onclick=()=>saveResult(b.dataset.kor));const fin=stageMatches('FINAL')[0],status=$('#afrnKOStatus');if(status)status.innerHTML=fin&&winner(fin)?'🏆 <b>BINGWA: '+esc(cname(winner(fin)))+'</b>':'ℹ️ Mfumo unasubiri matokeo.';
}
async function init(){try{db=client();if(!db)return;const id=new URLSearchParams(location.search).get('id');const cr=id?await db.from('competitions').select('*').eq('id',id).single():await db.from('competitions').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();if(cr.error||!cr.data)return;comp=cr.data;await load();loadBestLosers();if(!document.getElementById('afrnKnockoutEngine')){const host=$('#ce-knockout')||document.body,box=document.createElement('div');box.id='afrnKnockoutEngine';box.innerHTML='<div class="ce-card"><h3>⚔️ AFRN KNOCKOUT — DROW + MFUMO RASMI</h3><div id="afrnKOStatus" class="ce-warning"></div><div class="ce-actions"><button id="afrnKOGenerate" class="primary">⚙️ Tengeneza Hatua ya 16 Kutoka kwenye Droo</button><button id="afrnKORefresh" class="secondary">↻ Refresh</button></div><div id="afrnKOTable" style="margin-top:12px"></div></div>';host.prepend(box);}$('#afrnKOGenerate').onclick=generateR16;$('#afrnKORefresh').onclick=async()=>{await load();loadBestLosers();render();};render();}catch(e){console.error('AFRN Knockout Engine',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
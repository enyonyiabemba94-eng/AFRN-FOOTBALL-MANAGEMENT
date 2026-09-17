/* AFRN KNOCKOUT CENTER — official draw + bracket manager */
(function(){
'use strict';
const ROOT='afrn-knockout-center', STYLE='afrn-ko-style';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const db=()=>window.supabaseClient||(window.supabase&&window.supabase.createClient?window.supabase.createClient(URL,KEY):null);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const stage=m=>{const x=String(m?.notes||'').toUpperCase();if(x.includes('AFRN_STAGE=R16'))return'R16';if(x.includes('AFRN_STAGE=QF'))return'QF';if(x.includes('AFRN_STAGE=SF'))return'SF';if(x.includes('AFRN_STAGE=3RD'))return'3RD';if(x.includes('AFRN_STAGE=FINAL'))return'FINAL';return''};
const slot=m=>Number(String(m?.notes||'').match(/AFRN_SLOT=(\d+)/)?.[1]||0);
const name=(id,clubs)=>clubs.find(c=>String(c.id)===String(id))?.name||'Chagua timu';
const compId=()=>new URLSearchParams(location.search).get('competition_id')||document.getElementById('koCompetition')?.value||'';
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`#${ROOT}{margin:18px 0;font-family:Arial,sans-serif}.ko-head{background:linear-gradient(135deg,#06152b,#0d47a1);color:#fff;border-radius:18px;padding:18px}.ko-head h2{margin:0;font-size:21px}.ko-head p{margin:6px 0 0;font-size:12px;opacity:.88}.ko-bar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ko-card{background:#fff;border:1px solid #dfe5ee;border-radius:15px;padding:14px;box-shadow:0 3px 14px #0000000b}.ko-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.ko-label{font-size:11px;font-weight:900;color:#0d47a1}.ko-input{width:100%;padding:9px;border:1px solid #d5dce7;border-radius:8px;background:#fff;font-size:12px}.ko-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.ko-primary{background:#0d47a1;color:#fff}.ko-green{background:#e8f7ef;color:#087443}.ko-gold{background:#fff5cf;color:#6b4f00}.ko-danger{background:#fff0f0;color:#c62828}.ko-muted{color:#687386;font-size:12px}.ko-title{font-size:15px;font-weight:900;margin-bottom:10px}.ko-match{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;font-weight:900}.ko-match div:last-child{text-align:right}.ko-score{font-size:18px}.ko-meta{margin-top:10px;padding-top:9px;border-top:1px solid #edf0f4;font-size:11px;color:#687386}.ko-tabs{display:flex;gap:7px;overflow:auto;margin:12px 0}.ko-tab{white-space:nowrap;border:1px solid #d5dce7;background:#fff;border-radius:999px;padding:9px 12px;font-weight:800}.ko-tab.active{background:#0d47a1;color:#fff}.ko-panel{display:none}.ko-panel.active{display:block}.ko-draw{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ko-field label{display:block;font-size:10px;font-weight:800;color:#687386;margin-bottom:4px}@media(max-width:600px){.ko-draw{grid-template-columns:1fr}.ko-match{grid-template-columns:1fr}.ko-match div:last-child{text-align:left}.ko-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
async function load(){
 css();
 if(document.getElementById(ROOT))return;
 const old=document.getElementById('afrnR16Schedule')||[...document.querySelectorAll('section,div,article')].find(x=>x.id!==ROOT&&(x.innerText||'').toUpperCase().includes('HATUA YA 16')&&(x.innerText||'').toUpperCase().includes('BEST LOSERS'));
 if(!old)return setTimeout(load,500);
 const D=db();if(!D)return;
 const cr=await D.from('competitions').select('*').order('created_at',{ascending:false});if(cr.error)return console.warn(cr.error);
 const root=document.createElement('section');root.id=ROOT;
 root.innerHTML=`<div class="ko-head"><h2>⚔️ AFRN KNOCKOUT — DROW + MFUMO RASMI</h2><p>Admin anaweka timu kwenye A–H na namba za mechi. Mfumo hauundi timu za kubuni.</p></div><div class="ko-bar"><select id="koCompetition" class="ko-input" style="max-width:420px"><option value="">Chagua Competition ya Knockout</option>${(cr.data||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.season||'')}</option>`).join('')}</select><button class="ko-btn ko-primary" id="koRefresh">↻ Refresh</button></div><div id="koBody" class="ko-muted">Chagua competition ili kuanza.</div>`;
 old.replaceWith(root);
 const sel=root.querySelector('#koCompetition');const urlId=new URLSearchParams(location.search).get('competition_id');if(urlId)sel.value=urlId;
 sel.onchange=()=>render(sel.value);root.querySelector('#koRefresh').onclick=()=>render(sel.value);
 if(sel.value)render(sel.value);
}
async function render(id){
 const D=db(),body=document.querySelector('#koBody');if(!D||!id||!body){if(body)body.innerHTML='<div class="ko-card">Chagua competition.</div>';return}
 const [cr,tr,mr]=await Promise.all([D.from('competitions').select('*').eq('id',id).single(),D.from('competition_teams').select('club_id,group_name').eq('competition_id',id),D.from('matches').select('*').eq('competition_id',id).order('match_number',{ascending:true,nullsLast:true})]);
 if(cr.error){body.innerHTML='<div class="ko-card">❌ '+esc(cr.error.message)+'</div>';return}
 const ids=[...new Set([...(tr.data||[]).map(x=>x.club_id),...(mr.data||[]).flatMap(x=>[x.home_team_id,x.away_team_id]).filter(Boolean),cr.data.knockout_g1,cr.data.knockout_g2,cr.data.knockout_h1,cr.data.knockout_h2].filter(Boolean))];
 const clubs=ids.length?(await D.from('clubs').select('id,name').in('id',ids)).data||[]:[];
 const teamRows=tr.data||[];
 const opts=teamRows.map(x=>`<option value="${esc(x.club_id)}">${esc(name(x.club_id,clubs))} ${x.group_name?'· '+esc(x.group_name):''}</option>`).join('');
 const slots=['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1','F2','G1','G2','H1','H2'];
 const val=s=>cr.data['knockout_'+s.toLowerCase()]||'';
 body.innerHTML=`<div class="ko-card"><div class="ko-title">⭐ BEST LOSERS — Qualification Slots G/H</div><div class="ko-muted">Admin anachagua timu halisi. G1/G2/H1/H2 si timu zinazobuniwa na mfumo.</div><div class="ko-draw" id="koDraw">${slots.map(s=>`<div class="ko-field"><label>${s} ${['G1','G2','H1','H2'].includes(s)?'— Best Loser':''}</label><select class="ko-input" data-slot="${s}"><option value="">Chagua timu</option>${opts}</select></div>`).join('')}</div><div style="margin-top:12px" class="ko-muted">Namba za mechi za Hatua ya 16:</div><div class="ko-draw" id="koNumbers">${Array.from({length:8},(_,i)=>`<div class="ko-field"><label>Mechi ${i+1}</label><input class="ko-input ko-no" type="number" min="1" value="${i+1}"></div>`).join('')}</div><div class="ko-bar"><button class="ko-btn ko-green" id="koSaveDraw">💾 Hifadhi Droo + Best Losers</button><button class="ko-btn ko-primary" id="koGenerate">⚙️ Tengeneza Hatua ya 16 Kutoka kwenye Droo</button></div><div class="ko-muted">Droo itahifadhiwa kwenye competition. Timu moja haiwezi kuwekwa kwenye nafasi mbili.</div></div><div class="ko-tabs">${[['R16','🏆 HATUA YA 16'],['QF','⚔️ ROBO FAINALI'],['SF','🔥 NUSU FAINALI'],['3RD','🥉 MSHINDI WA 3'],['FINAL','🏆 FAINALI']].map((x,i)=>`<button class="ko-tab ${i?'':'active'}" data-tab="${x[0]}">${x[1]}</button>`).join('')}</div><div id="koPanels"></div>`;
 slots.forEach(s=>{const el=body.querySelector(`[data-slot="${s}"]`);el.value=val(s)});
 body.querySelectorAll('.ko-tab').forEach(b=>b.onclick=()=>{body.querySelectorAll('.ko-tab').forEach(x=>x.classList.remove('active'));body.querySelectorAll('.ko-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');body.querySelector(`[data-panel="${b.dataset.tab}"]`).classList.add('active')});
 const save=async()=>{const data={};const used=new Set();for(const s of slots){const v=body.querySelector(`[data-slot="${s}"]`).value||null;if(v&&used.has(v)){alert('❌ Timu hiyo imechaguliwa zaidi ya nafasi moja: '+s);return}if(v)used.add(v);data['knockout_'+s.toLowerCase()]=v}const r=await D.from('competitions').update(data).eq('id',id);if(r.error){alert('❌ '+r.error.message);return}await render(id);alert('✅ Droo imehifadhiwa.')};
 body.querySelector('#koSaveDraw').onclick=save;
 body.querySelector('#koGenerate').onclick=async()=>{await save();await generateR16(D,id,clubs)};
 renderPanels(body.querySelector('#koPanels'),mr.data||[],clubs);
}
function renderPanels(root,matches,clubs){const map={R16:'🏆 HATUA YA 16',QF:'⚔️ ROBO FAINALI',SF:'🔥 NUSU FAINALI','3RD':'🥉 MSHINDI WA 3',FINAL:'🏆 FAINALI'};root.innerHTML=Object.keys(map).map((s,i)=>{const ms=matches.filter(m=>stage(m)===s).sort((a,b)=>{const aa=Number(String(a.notes||'').match(/AFRN_SLOT=(\d+)/)?.[1]||0),bb=Number(String(b.notes||'').match(/AFRN_SLOT=(\d+)/)?.[1]||0);return aa-bb});return `<div class="ko-panel ${i?'':'active'}" data-panel="${s}"><div class="ko-grid">${ms.length?ms.map((m,j)=>`<div class="ko-card"><div class="ko-title">${map[s]} — ${j+1}</div><div class="ko-match"><div>${esc(name(m.home_team_id,clubs))}</div><div class="ko-score">${m.home_score==null?'—':esc(m.home_score)+' : '+esc(m.away_score??0)}</div><div>${esc(name(m.away_team_id,clubs))}</div></div><div class="ko-meta">📌 Mechi #${esc(m.match_number||'—')} · 📅 ${esc(m.match_date||'—')} · 🕐 ${esc(String(m.match_time||'').slice(0,5)||'—')} · 🏟️ ${esc(m.venue||'—')} · ${esc(m.status||'scheduled')}</div></div>`).join(''):'<div class="ko-card">ℹ️ Hakuna mechi za hatua hii bado.</div>'}</div></div>`}).join('')}
async function generateR16(D,id,clubs){
 const c=(await D.from('competitions').select('*').eq('id',id).single()).data;if(!c)return;
 const p=['a1','b2','c1','d2','b1','a2','d1','c2','e1','f2','g1','h2','f1','e2','h1','g2'];
 const teams=p.map(k=>c['knockout_'+k]);if(teams.some(x=>!x)){alert('⚠️ Jaza nafasi zote A1–H2 kwanza.');return}
 const pairs=[];for(let i=0;i<16;i+=2)pairs.push([teams[i],teams[i+1]]);
 if(new Set(teams).size!==16){alert('❌ Timu lazima ziwe tofauti kwenye A1–H2.');return}
 const existing=(await D.from('matches').select('*').eq('competition_id',id)).data||[];
 const nums=[...document.querySelectorAll('.ko-no')].map(x=>Number(x.value)||0);for(let i=0;i<8;i++){if(!nums[i]){alert('❌ Weka namba ya kila mechi ya Hatua ya 16.');return}const pair=pairs[i],note='AFRN_STAGE=R16|AFRN_SLOT='+(i+1)+'|AFRN_DRAW='+String.fromCharCode(65+i);const old=existing.find(m=>stage(m)==='R16'&&slot(m)==i+1);if(old){const r=await D.from('matches').update({home_team_id:pair[0],away_team_id:pair[1],match_number:nums[i],notes:note,status:'scheduled',home_score:null,away_score:null}).eq('id',old.id);if(r.error){alert('❌ '+r.error.message);return}}else{const r=await D.from('matches').insert({competition_id:id,home_team_id:pair[0],away_team_id:pair[1],match_number:nums[i],status:'scheduled',notes:note});if(r.error){alert('❌ '+r.error.message);return}}}
 alert('✅ Hatua ya 16 imetengenezwa kwa droo ulioweka.');await render(id);
}
function boot(){load().catch(e=>console.warn('AFRN Knockout Center',e))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

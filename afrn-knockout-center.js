/* AFRN KNOCKOUT CENTER — unified presentation layer
   Keeps the existing knockout engine and Supabase data.
   Replaces the old scattered knockout block with one center.
*/
(function(){
'use strict';
const ROOT_ID='afrn-knockout-center', STYLE_ID='afrn-knockout-center-style';
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
function db(){return window.supabaseClient||(window.supabase&&window.supabase.createClient?window.supabase.createClient(URL,KEY):null)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function date(v){if(!v)return '—';return String(v).slice(0,10)}
function stage(m){
  const x=String(m.stage||m.round||m.match_stage||m.notes||'').toUpperCase();
  if(!x.includes('R16')&&!x.includes('HATUA YA 16')&&!x.includes('ROUND OF 16')&&!x.includes('QUARTER')&&!x.includes('ROBO')&&!x.includes('SEMI')&&!x.includes('NUSU')&&!x.includes('3RD')&&!x.includes('THIRD')&&!x.includes('MSHINDI WA TATU')&&!x.includes('FINAL')) return null;
  if(x.includes('FINAL')&&!x.includes('SEMI'))return'final';
  if(x.includes('3RD')||x.includes('THIRD')||x.includes('MSHINDI WA TATU'))return'third';
  if(x.includes('SEMI')||x.includes('NUSU'))return'semi';
  if(x.includes('QUARTER')||x.includes('ROBO'))return'qf';
  return'r16';
}
function addStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`#${ROOT_ID}{margin:18px 0;font-family:Arial,Helvetica,sans-serif;color:#172033}#${ROOT_ID} *{box-sizing:border-box}.afk-head{background:linear-gradient(135deg,#06152b,#0d47a1);color:#fff;border-radius:18px;padding:18px;box-shadow:0 8px 24px #071a3326}.afk-head h2{margin:0;font-size:21px}.afk-head p{margin:6px 0 0;opacity:.86;font-size:12px}.afk-tabs{display:flex;gap:7px;overflow-x:auto;margin:12px 0;padding-bottom:3px}.afk-tab{border:1px solid #d8e0ec;background:#fff;border-radius:999px;padding:9px 13px;font-weight:800;font-size:12px;white-space:nowrap;cursor:pointer}.afk-tab.active{background:#0d47a1;color:#fff;border-color:#0d47a1}.afk-panel{display:none}.afk-panel.active{display:block}.afk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:13px}.afk-match{background:#fff;border:1px solid #e1e7ef;border-radius:15px;padding:14px;box-shadow:0 3px 14px #14213d0d}.afk-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:12px}.afk-no{font-size:11px;font-weight:900;color:#0d47a1}.afk-status{font-size:10px;padding:5px 8px;border-radius:999px;background:#eef4ff;color:#0d47a1;font-weight:800}.afk-teams{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.afk-team{font-weight:900;font-size:14px;min-height:38px;display:flex;align-items:center}.afk-team:last-child{justify-content:flex-end;text-align:right}.afk-score{font-size:20px;font-weight:900;white-space:nowrap}.afk-meta{margin-top:13px;padding-top:11px;border-top:1px solid #edf0f4;display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.afk-meta div{background:#f7f9fc;border-radius:9px;padding:8px;text-align:center}.afk-meta b{display:block;font-size:10px;color:#687386;margin-bottom:3px}.afk-meta span{font-size:11px;font-weight:800}.afk-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.afk-actions button{border:0;border-radius:8px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}.afk-edit{background:#e8f0ff;color:#0d47a1}.afk-save{background:#e8f7ef;color:#16834b}.afk-admin{margin-top:13px;background:#fff8df;border-left:4px solid #f5b400;border-radius:9px;padding:10px 12px;font-size:11px}.afk-empty{background:#fff;border:1px dashed #cbd3df;border-radius:14px;padding:25px;text-align:center;color:#687386;font-size:12px}.afk-input{width:100%;padding:8px;border:1px solid #d4dbe6;border-radius:8px;font-size:12px}.afk-editor{margin-top:11px;display:grid;grid-template-columns:1fr 1fr;gap:7px}.afk-editor label{font-size:10px;font-weight:800;color:#687386}.afk-editor .full{grid-column:1/-1}@media(max-width:600px){.afk-meta,.afk-editor{grid-template-columns:1fr}.afk-teams{grid-template-columns:1fr}.afk-team:last-child{justify-content:flex-start;text-align:left}.afk-score{text-align:center}}`;document.head.appendChild(s)}
function findOld(){
  const exact=document.getElementById('afrnKOTable');if(exact)return exact.closest('section')||exact.parentElement||exact;
  const r16=document.getElementById('afrnR16Schedule');if(r16)return r16;
  const els=[...document.querySelectorAll('section,div,article')];
  return els.find(el=>{if(el.id===ROOT_ID)return false;const t=(el.innerText||'').toUpperCase();return t.includes('RATIBA — HATUA YA 16')&&t.includes('ADMIN ANAWEKA TAREHE')});
}
function team(m,side,clubs){
  const id=m[side+'_team_id'];
  if(id){const c=clubs.find(x=>String(x.id)===String(id));if(c?.name)return c.name;}
  return m[side+'_team_name']||m[side+'_team']||m[side+'_club_name']||m[side+'_name']||m[side]||m[side==='home'?'team1':'team2']||'Timu';
}
function score(m){const h=m.home_score??m.home_goals??m.home_result,a=m.away_score??m.away_goals??m.away_result;return h==null&&a==null?'—':`${esc(h??0)} : ${esc(a??0)}`}
function card(m,label,canEdit,clubs){const id=esc(m.id);return `<article class="afk-match" data-id="${id}"><div class="afk-top"><span class="afk-no">MECHI #${esc(m.match_number??'—')}</span><span class="afk-status">${label}</span></div><div class="afk-teams"><div class="afk-team">${esc(team(m,'home',clubs))}</div><div class="afk-score">${score(m)}</div><div class="afk-team">${esc(team(m,'away',clubs))}</div></div><div class="afk-meta"><div><b>📅 TAREHE</b><span>${date(m.match_date)}</span></div><div><b>🕐 MUDA</b><span>${esc(m.match_time||'—')}</span></div><div><b>🏟️ UWANJA</b><span>${esc(m.venue||'—')}</span></div></div>${canEdit?`<div class="afk-editor"><label>Namba ya mechi<input class="afk-input e-no" type="number" value="${esc(m.match_number??'')}"/></label><label>Tarehe<input class="afk-input e-date" type="date" value="${esc(m.match_date||'')}"/></label><label>Muda<input class="afk-input e-time" type="time" value="${esc(String(m.match_time||'').slice(0,5))}"/></label><label>Uwanja<input class="afk-input e-venue" value="${esc(m.venue||'')}"/></label></div><div class="afk-actions"><button class="afk-save" data-save="1">💾 Hifadhi ratiba</button><button class="afk-edit" onclick="window.location.href='./matches.html'">⚽ Fungua Mechi</button></div>`:`<div class="afk-actions"><button class="afk-edit" onclick="window.location.href='./matches.html'">⚽ Fungua Mechi</button></div>`}</article>`}
async function load(){
  addStyle();
  if(document.getElementById(ROOT_ID))return true;
  const old=findOld();
  if(!old)return false;
  const root=document.createElement('section');root.id=ROOT_ID;
  root.innerHTML=`<div class="afk-head"><h2>🏆 AFRN KNOCKOUT CENTER</h2><p>MFUMO RASMI WA HATUA ZA MTOANO — Ratiba, matokeo, tarehe, muda na uwanja</p></div><div class="afk-tabs"><button class="afk-tab active" data-stage="best">⭐ BEST LOSERS</button><button class="afk-tab" data-stage="r16">🏆 HATUA YA 16</button><button class="afk-tab" data-stage="qf">⚔️ ROBO FAINALI</button><button class="afk-tab" data-stage="semi">🔥 NUSU FAINALI</button><button class="afk-tab" data-stage="third">🥉 MSHINDI WA 3</button><button class="afk-tab" data-stage="final">🏆 FAINALI</button></div><div id="afk-panels"></div>`;
  root.querySelectorAll('.afk-tab').forEach(b=>b.onclick=()=>{root.querySelectorAll('.afk-tab').forEach(x=>x.classList.remove('active'));root.querySelectorAll('.afk-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');root.querySelector('[data-panel="'+b.dataset.stage+'"]').classList.add('active')});
  const client=db();let matches=[],clubs=[];
  if(client){
    try{
      const r=await client.from('matches').select('*').order('match_number',{ascending:true,nullsLast:true}).order('match_date',{ascending:true,nullsLast:true});
      if(!r.error)matches=(r.data||[]).filter(m=>stage(m));
      const ids=[...new Set(matches.flatMap(m=>[m.home_team_id,m.away_team_id]).filter(Boolean))];
      if(ids.length){const c=await client.from('clubs').select('id,name').in('id',ids);if(!c.error)clubs=c.data||[];}
    }catch(e){console.warn('AFRN Knockout Center',e)}
  }
  old.replaceWith(root);render(root,matches,client,clubs);return true;
}
function render(root,matches,client,clubs){const panels=root.querySelector('#afk-panels'),labels={r16:'HATUA YA 16',qf:'ROBO FAINALI',semi:'NUSU FAINALI',third:'MSHINDI WA 3',final:'FAINALI'};panels.innerHTML='';const bp=document.createElement('div');bp.className='afk-panel active';bp.dataset.panel='best';bp.innerHTML='<div class="afk-grid">'+['G1','G2','H1','H2'].map((x,i)=>`<div class="afk-match"><div class="afk-top"><span class="afk-no">SLOT ${i+1}</span><span class="afk-status">ADMIN</span></div><div class="afk-teams"><div class="afk-team">${x}</div><div class="afk-score">—</div><div class="afk-team">ADMIN</div></div><div class="afk-admin">Slot hii inawekwa na Admin. Mfumo hautatengeneza timu ya kubuni.</div></div>`).join('')+'</div>';panels.appendChild(bp);['r16','qf','semi','third','final'].forEach(s=>{const p=document.createElement('div');p.className='afk-panel';p.dataset.panel=s;const rows=matches.filter(m=>stage(m)===s);p.innerHTML=rows.length?'<div class="afk-grid">'+rows.map(m=>card(m,labels[s],!!client,clubs)).join('')+'</div>':'<div class="afk-empty">Hakuna mechi za hatua hii bado.</div>';panels.appendChild(p)});root.querySelectorAll('[data-save]').forEach(b=>b.onclick=async()=>{const c=b.closest('.afk-match');const r=await client.from('matches').update({match_number:c.querySelector('.e-no').value?Number(c.querySelector('.e-no').value):null,match_date:c.querySelector('.e-date').value||null,match_time:c.querySelector('.e-time').value||null,venue:c.querySelector('.e-venue').value.trim()||null}).eq('id',c.dataset.id);if(r.error){alert('❌ '+r.error.message);return}b.textContent='✅ Imehifadhiwa';setTimeout(()=>b.textContent='💾 Hifadhi ratiba',1600)})}
function boot(){let tries=0;const go=async()=>{tries++;if(await load())return;if(tries<12)setTimeout(go,500)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

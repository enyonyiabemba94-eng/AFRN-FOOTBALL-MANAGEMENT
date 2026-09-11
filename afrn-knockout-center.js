/* AFRN KNOCKOUT CENTER — presentation layer only
   Keeps existing knockout engine, match numbering and Supabase data.
   Replaces scattered knockout output with one professional center.
*/
(function(){
  'use strict';
  const STYLE_ID='afrn-knockout-center-style';
  const ROOT_ID='afrn-knockout-center';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
#${ROOT_ID}{margin:18px 0;font-family:Arial,Helvetica,sans-serif;color:#172033}
#${ROOT_ID} *{box-sizing:border-box}
.afk-head{background:linear-gradient(135deg,#06152b,#0d47a1);color:#fff;border-radius:18px;padding:18px;box-shadow:0 8px 24px #071a3326}
.afk-head h2{margin:0;font-size:21px}.afk-head p{margin:6px 0 0;opacity:.86;font-size:12px}
.afk-tabs{display:flex;gap:7px;overflow-x:auto;margin:12px 0;padding-bottom:3px}.afk-tab{border:1px solid #d8e0ec;background:#fff;border-radius:999px;padding:9px 13px;font-weight:800;font-size:12px;white-space:nowrap;cursor:pointer}.afk-tab.active{background:#0d47a1;color:#fff;border-color:#0d47a1}
.afk-panel{display:none}.afk-panel.active{display:block}
.afk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:13px}
.afk-match{background:#fff;border:1px solid #e1e7ef;border-radius:15px;padding:14px;box-shadow:0 3px 14px #14213d0d}
.afk-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:12px}.afk-no{font-size:11px;font-weight:900;color:#0d47a1}.afk-status{font-size:10px;padding:5px 8px;border-radius:999px;background:#eef4ff;color:#0d47a1;font-weight:800}
.afk-teams{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.afk-team{font-weight:900;font-size:14px;min-height:38px;display:flex;align-items:center}.afk-team:last-child{justify-content:flex-end;text-align:right}.afk-score{font-size:20px;font-weight:900;white-space:nowrap}.afk-meta{margin-top:13px;padding-top:11px;border-top:1px solid #edf0f4;display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.afk-meta div{background:#f7f9fc;border-radius:9px;padding:8px;text-align:center}.afk-meta b{display:block;font-size:10px;color:#687386;margin-bottom:3px}.afk-meta span{font-size:11px;font-weight:800}.afk-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.afk-actions button{border:0;border-radius:8px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}.afk-edit{background:#e8f0ff;color:#0d47a1}.afk-save{background:#e8f7ef;color:#16834b}.afk-empty{background:#fff;border:1px dashed #cbd3df;border-radius:14px;padding:25px;text-align:center;color:#687386;font-size:12px}
.afk-admin{margin-top:13px;background:#fff8df;border-left:4px solid #f5b400;border-radius:9px;padding:10px 12px;font-size:11px}
@media(max-width:600px){.afk-meta{grid-template-columns:1fr}.afk-teams{grid-template-columns:1fr}.afk-team:last-child{justify-content:flex-start;text-align:left}.afk-score{text-align:center}}
`;
    document.head.appendChild(s);
  }

  function findOld(){
    const all=[...document.querySelectorAll('section,div,article')];
    return all.find(el=>{const t=(el.innerText||'').toUpperCase();return t.includes('AFRN KNOCKOUT')&&t.includes('HATUA YA 16 BORA')&&t.includes('ROBO FAINALI')&&el.id!=='afrn-knockout-center';});
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function fmtDate(v){if(!v)return '—';try{return new Date(v+'T00:00:00').toLocaleDateString('sw-TZ',{day:'2-digit',month:'2-digit',year:'numeric'})}catch(e){return v}}
  function getScore(m){
    const h=m.home_score??m.home_goals??m.home_result??null, a=m.away_score??m.away_goals??m.away_result??null;
    return h==null&&a==null?'—':`${esc(h??0)} : ${esc(a??0)}`;
  }
  function stageOf(m){const x=String(m.stage||m.round||m.match_stage||m.notes||'').toUpperCase(); if(x.includes('FINAL')&&!x.includes('SEMI'))return 'final'; if(x.includes('3RD')||x.includes('THIRD')||x.includes('MSHINDI WA TATU'))return 'third'; if(x.includes('SEMI')||x.includes('NUSU'))return 'semi'; if(x.includes('QUARTER')||x.includes('ROBO'))return 'qf'; return 'r16';}

  async function load(){
    addStyle();
    const old=findOld();
    if(!old)return;
    const root=document.createElement('section'); root.id=ROOT_ID;
    root.innerHTML=`<div class="afk-head"><h2>🏆 AFRN KNOCKOUT CENTER</h2><p>MFUMO RASMI WA HATUA ZA MTOANO — Ratiba, matokeo, tarehe, muda na uwanja</p></div>
    <div class="afk-tabs"><button class="afk-tab active" data-stage="best">⭐ BEST LOSERS</button><button class="afk-tab" data-stage="r16">🏆 HATUA YA 16</button><button class="afk-tab" data-stage="qf">⚔️ ROBO FAINALI</button><button class="afk-tab" data-stage="semi">🔥 NUSU FAINALI</button><button class="afk-tab" data-stage="third">🥉 MSHINDI WA 3</button><button class="afk-tab" data-stage="final">🏆 FAINALI</button></div>
    <div id="afk-panels"></div>`;
    old.replaceWith(root);
    root.querySelectorAll('.afk-tab').forEach(b=>b.onclick=()=>{root.querySelectorAll('.afk-tab').forEach(x=>x.classList.remove('active'));root.querySelectorAll('.afk-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');const p=root.querySelector('[data-panel="'+b.dataset.stage+'"]');if(p)p.classList.add('active');});

    const sb=window.supabase||window._supabase;
    let matches=[];
    try{
      if(sb){let q=sb.from('matches').select('*').order('match_number',{ascending:true,nullsLast:true}).order('match_date',{ascending:true,nullsLast:true}); const r=await q; if(!r.error)matches=r.data||[];}
    }catch(e){console.warn(e)}
    render(root,matches);
  }
  function render(root,matches){
    const panels=root.querySelector('#afk-panels');
    const labels={r16:'HATUA YA 16',qf:'ROBO FAINALI',semi:'NUSU FAINALI',third:'MSHINDI WA 3',final:'FAINALI'};
    const best=['G1','G2','H1','H2'];
    panels.innerHTML='';
    const bp=document.createElement('div');bp.className='afk-panel active';bp.dataset.panel='best';bp.innerHTML='<div class="afk-grid">'+best.map((x,i)=>`<div class="afk-match"><div class="afk-top"><span class="afk-no">SLOT ${i+1}</span><span class="afk-status">ADMIN</span></div><div class="afk-teams"><div class="afk-team">${x}</div><div class="afk-score">—</div><div class="afk-team">ADMIN</div></div><div class="afk-admin">Slot hii inawekwa na Admin. Mfumo hautatengeneza timu ya kubuni.</div></div>`).join('')+'</div>';panels.appendChild(bp);
    ['r16','qf','semi','third','final'].forEach(stage=>{
      const p=document.createElement('div');p.className='afk-panel';p.dataset.panel=stage;
      const rows=matches.filter(m=>stageOf(m)===stage);
      p.innerHTML=rows.length?'<div class="afk-grid">'+rows.map(m=>card(m,labels[stage])).join('')+'</div>':'<div class="afk-empty">Hakuna mechi za hatua hii bado. Mechi zitaonekana hapa baada ya kuundwa na mfumo wa mashindano.</div>';
      panels.appendChild(p);
    });
  }
  function card(m,label){
    const home=m.home_team_name||m.home_team||m.home_club_name||m.home||m.team1||'Timu 1';
    const away=m.away_team_name||m.away_team||m.away_club_name||m.away||m.team2||'Timu 2';
    return `<article class="afk-match"><div class="afk-top"><span class="afk-no">MECHI #${esc(m.match_number??'—')}</span><span class="afk-status">${label}</span></div><div class="afk-teams"><div class="afk-team">${esc(home)}</div><div class="afk-score">${getScore(m)}</div><div class="afk-team">${esc(away)}</div></div><div class="afk-meta"><div><b>📅 TAREHE</b><span>${fmtDate(m.match_date)}</span></div><div><b>🕐 MUDA</b><span>${esc(m.match_time||'—')}</span></div><div><b>🏟️ UWANJA</b><span>${esc(m.venue||'—')}</span></div></div><div class="afk-actions"><button class="afk-edit" onclick="window.location.href='./matches.html'">⚽ Fungua Mechi</button></div></article>`;
  }
  function boot(){setTimeout(load,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

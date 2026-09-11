/* AFRN KNOCKOUT CENTER — final presentation layer
   Keeps existing knockout data/logic intact and replaces the scattered visual blocks
   with one professional center. Schedule fields remain match_date, match_time, venue,
   and match_number. Admin-controlled slots 1H/2H and G1/G2 are preserved.
*/
(function(){
  'use strict';
  function boot(){
    if(!document.body || window.__AFRN_KNOCKOUT_CENTER_FINAL__) return;
    window.__AFRN_KNOCKOUT_CENTER_FINAL__=true;
    var old=document.querySelectorAll('[id*="knockout" i],[class*="knockout" i]');
    old.forEach(function(el){
      if(el.id==='afrn-knockout-final-center') return;
      if(el.closest('#afrn-knockout-final-center')) return;
      if(/AFRN KNOCKOUT|HATUA YA 16|ROBO FAINALI|NUSU FAINALI|MSHINDI WA TATU|FAINALI|BEST LOSERS/i.test(el.textContent||'')) el.classList.add('afrn-kold-hidden');
    });
    var style=document.createElement('style');
    style.textContent='.afrn-kold-hidden{display:none!important}.afrn-kcenter{background:#fff;border:1px solid #dfe6ef;border-radius:20px;box-shadow:0 8px 30px #071a3314;margin:18px 0;padding:18px}.afrn-khero{background:linear-gradient(135deg,#071a33,#0d47a1);color:#fff;border-radius:16px;padding:20px}.afrn-khero h2{margin:0;font-size:22px}.afrn-khero p{margin:6px 0 0;opacity:.82;font-size:12px}.afrn-ktabs{display:flex;gap:7px;overflow:auto;padding:12px 0}.afrn-ktabs button{white-space:nowrap;border:1px solid #d8e0eb;background:#f5f7fb;color:#172033;border-radius:999px;padding:9px 13px;font-weight:800}.afrn-ktabs button.active{background:#0d47a1;color:#fff}.afrn-kstage{border:1px solid #e3e8ef;border-radius:16px;margin-top:8px;overflow:hidden}.afrn-kstage h3{margin:0;padding:13px 15px;background:#f5f8fc;color:#071a33;font-size:15px}.afrn-kmatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px;padding:12px}.afrn-kmatch{border:1px solid #e1e7ef;border-radius:14px;padding:13px;background:#fff}.afrn-knum{font-size:10px;font-weight:900;color:#0d47a1}.afrn-kteams{font-size:14px;font-weight:900;margin:8px 0}.afrn-kmeta{display:grid;grid-template-columns:1fr 1fr;gap:6px;color:#5d6979;font-size:11px}.afrn-kmeta div{background:#f6f8fb;border-radius:8px;padding:7px}.afrn-kempty{padding:20px;text-align:center;color:#6b7685;font-size:12px}.afrn-kadmin{margin-top:12px;padding:11px;border-radius:10px;background:#fff8df;border-left:4px solid #f5b400;font-size:11px}@media(max-width:520px){.afrn-kcenter{padding:11px}.afrn-khero h2{font-size:18px}.afrn-kmatches{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    var main=document.querySelector('main')||document.body;
    var box=document.createElement('section'); box.id='afrn-knockout-final-center'; box.className='afrn-kcenter';
    box.innerHTML='<div class="afrn-khero"><h2>🏆 AFRN KNOCKOUT CENTER</h2><p>DROO • QUALIFICATION • HATUA YA 16 • ROBO • NUSU • MSHINDI WA 3 • FAINALI</p></div><div class="afrn-ktabs"><button class="active">BEST LOSERS</button><button>HATUA YA 16</button><button>ROBO FAINALI</button><button>NUSU FAINALI</button><button>MSHINDI WA 3</button><button>FAINALI</button></div><div class="afrn-kstage"><h3>📅 RATIBA YA KNOCKOUT</h3><div class="afrn-kmatches" id="afrn-kfinal-matches"><div class="afrn-kempty">Mfumo unakusoma mechi za knockout...</div></div></div><div class="afrn-kadmin">⚙️ <b>Admin control:</b> 1H, 2H, G1 na G2 zinaendelea kudhibitiwa na Admin. Namba ya mechi, tarehe, muda na uwanja vinaweza kuhifadhiwa kwenye rekodi ya mechi.</div>';
    main.appendChild(box);
    loadMatches(box.querySelector('#afrn-kfinal-matches'));
  }
  async function loadMatches(target){
    try{
      var sb=window.supabaseClient||window.supabase||window._supabase;
      if(!sb||!sb.from){target.innerHTML='<div class="afrn-kempty">Mfumo wa mechi utaonekana baada ya Supabase kuunganishwa.</div>';return;}
      var r=await sb.from('matches').select('id,home_team,away_team,home_score,away_score,match_date,match_time,venue,match_number,stage,round').order('match_number',{ascending:true,nullsFirst:false}).limit(32);
      if(r.error) throw r.error;
      var rows=r.data||[]; rows=rows.filter(function(m){return /R16|16|QUARTER|ROBO|SEMI|NUSU|FINAL|KNOCKOUT|THIRD|3RD/i.test((m.stage||'')+' '+(m.round||''));});
      if(!rows.length){target.innerHTML='<div class="afrn-kempty">Hakuna mechi za knockout zilizohifadhiwa bado.</div>';return;}
      target.innerHTML=rows.map(function(m){
        var score=(m.home_score==null&&m.away_score==null)?'—':String(m.home_score??0)+' : '+String(m.away_score??0);
        return '<article class="afrn-kmatch"><div class="afrn-knum">MECHI #'+(m.match_number||'—')+'</div><div class="afrn-kteams">'+esc(m.home_team||'Timu ya kwanza')+' <span style="font-weight:600;color:#687386">vs</span> '+esc(m.away_team||'Timu ya pili')+'<br><span style="font-size:18px">'+score+'</span></div><div class="afrn-kmeta"><div>📅 '+esc(m.match_date||'Haijawekwa')+'</div><div>🕐 '+esc(m.match_time||'Haijawekwa')+'</div><div style="grid-column:1/-1">🏟️ '+esc(m.venue||'Uwanja haujawekwa')+'</div></div></article>';
      }).join('');
    }catch(e){target.innerHTML='<div class="afrn-kempty">Imeshindikana kusoma ratiba kwa sasa.</div>';}
  }
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

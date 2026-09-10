(() => {
  const sb = () => window.db || window.supabaseClient || null;
  let me = null;
  let role = '';
  let otherPlayers = [];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const isClubAdmin = () => ['club_admin','club','club_account'].includes(role);
  const isAfrnAdmin = () => ['super_admin','superadmin','admin','administrator','afrn_admin','secretary_general'].includes(role);
  const fullName = p => [p?.first_name,p?.middle_name,p?.last_name].filter(Boolean).join(' ') || 'Unknown Player';

  function photoUrl(p){
    const raw = String(p?.photo_url || p?.photo || p?.photograph || '').trim();
    if(!raw) return '';
    if(/^https?:\/\//i.test(raw)) return raw;
    const client = sb();
    try { return client.storage.from('AFRN PLAYER PHOTOS').getPublicUrl(raw).data.publicUrl; } catch(e) { return raw; }
  }

  function ensureStyles(){
    if(document.getElementById('afrn-registration-style')) return;
    const s=document.createElement('style'); s.id='afrn-registration-style';
    s.textContent=`
      .afrn-reg-panel{background:#fff;border:1px solid #dce2ea;border-radius:14px;padding:14px;margin:0 0 16px;box-shadow:0 3px 12px #14213d10}
      .afrn-reg-panel h3{margin:0 0 8px;font-size:16px}
      .afrn-reg-note{font-size:12px;color:#687386;margin:5px 0 10px;line-height:1.45}
      .afrn-reg-row{display:flex;gap:8px;align-items:center;justify-content:space-between;border-top:1px solid #edf0f4;padding:10px 0;flex-wrap:wrap}
      .afrn-reg-info{font-size:12px;flex:1;min-width:180px}
      .afrn-reg-actions{display:flex;gap:7px;flex-wrap:wrap}
      .afrn-reg-actions button{padding:8px 10px;font-size:12px}
      .afrn-reg-badge{display:inline-block;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:700;background:#eef4ff;color:#174ea6;margin-left:5px}
      .afrn-reg-badge.pending{background:#fff5df;color:#9a6100}.afrn-reg-badge.ok{background:#eaf8f0;color:#16834b}.afrn-reg-badge.bad{background:#fee;color:#c62828}
      .afrn-request-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:12px}
      .afrn-player-request-card{border:1px solid #e2e7ef;border-radius:14px;padding:12px;background:#fbfcfe}
      .afrn-player-request-top{display:flex;gap:11px;align-items:center}
      .afrn-player-request-photo{width:68px;height:68px;border-radius:13px;object-fit:cover;background:#eef2f7;border:1px solid #dce2ea;flex-shrink:0}
      .afrn-player-request-placeholder{width:68px;height:68px;border-radius:13px;background:#eef2f7;border:1px solid #dce2ea;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
      .afrn-player-request-name{font-weight:800;font-size:15px;line-height:1.2}
      .afrn-player-request-team{font-size:12px;color:#174ea6;font-weight:700;margin-top:5px}
      .afrn-player-request-id{font-size:10px;color:#687386;margin-top:4px}
      .afrn-player-request-btn{width:100%;margin-top:11px;background:#0d47a1;color:#fff;padding:10px;border-radius:9px}
      .afrn-player-request-btn.pending{background:#fff5df;color:#9a6100}
      .afrn-player-search{width:100%;padding:10px;border:1px solid #d6dce5;border-radius:9px;margin:7px 0 4px;box-sizing:border-box}
    `; document.head.appendChild(s);
  }

  async function loadMe(){
    const client=sb(); if(!client) return false;
    const {data:{user}}=await client.auth.getUser();
    if(!user) return false;
    const {data,error}=await client.from('profiles').select('id,role,club_id').eq('id',user.id).maybeSingle();
    if(error){console.warn('AFRN registration profile:',error);return false;}
    me=data; role=(data?.role||'').toLowerCase(); return true;
  }

  function panelShell(title,note,id){
    const p=document.createElement('section'); p.className='afrn-reg-panel'; p.id=id;
    p.innerHTML=`<h3>${title}</h3><div class="afrn-reg-note">${note}</div><div class="afrn-reg-list">⏳ Inapakia...</div>`;
    return p;
  }

  function insertPanels(){
    const main=document.querySelector('main'); if(!main) return;
    const anchor=document.getElementById('status') || main.firstElementChild;
    if(isClubAdmin()){
      if(!document.getElementById('afrn-destination-requests')){
        const p=panelShell('📝 Usajili wa Mchezaji kutoka Klabu Nyingine','Chagua mchezaji hapa chini. Utaona picha, jina na klabu yake. Bonyeza <b>Tuma Ombi la Usajili</b>. Ombi litaenda kwanza kwa Admin wa klabu inayomiliki mchezaji, kisha AFRN Admin.','afrn-destination-requests');
        anchor?.insertAdjacentElement('afterend',p);
      }
      if(!document.getElementById('afrn-source-approvals')){
        const p=panelShell('⚽ Maombi kutoka Klabu Nyingine','Hapa utaona maombi ya wachezaji wanaotoka kwenye klabu yako. Kubali au kataa kabla ya kwenda AFRN.','afrn-source-approvals');
        const dest=document.getElementById('afrn-destination-requests'); (dest||anchor)?.insertAdjacentElement('afterend',p);
      }
    }
    if(isAfrnAdmin() && !document.getElementById('afrn-final-approvals')){
      const p=panelShell('🏛️ AFRN — Approval ya Mwisho','Maombi yaliyokwishaidhinishwa na klabu inayomiliki mchezaji. AFRN Admin ndiye mwenye uamuzi wa mwisho.','afrn-final-approvals');
      const last=document.getElementById('afrn-source-approvals') || document.getElementById('afrn-destination-requests') || anchor;
      last?.insertAdjacentElement('afterend',p);
    }
  }

  async function requestPlayer(playerId){
    const client=sb();
    if(!me?.club_id) return alert('❌ Akaunti hii haina klabu iliyounganishwa.');
    const {error}=await client.rpc('afrn_request_player_registration',{p_player_id:playerId,p_club_id:me.club_id});
    if(error) return alert('❌ Ombi halikutumwa: '+error.message);
    alert('✅ Ombi limetumwa. Sasa linasubiri idhini ya klabu inayomiliki mchezaji, kisha AFRN Admin.');
    await refresh();
  }

  async function decideClub(playerId,approve){
    let reason=null;
    if(!approve){ reason=prompt('Andika sababu ya kukataa ombi:'); if(!reason?.trim()) return; }
    const {error}=await sb().rpc('afrn_decide_player_club_registration',{p_player_id:playerId,p_approve:approve,p_reason:reason});
    if(error) return alert('❌ '+error.message);
    alert(approve?'✅ Klabu imeidhinisha. Ombi limepelekwa kwa AFRN Admin.':'❌ Ombi limekataliwa.');
    await refresh();
  }

  async function decideAfrn(playerId,approve){
    let reason=null;
    if(!approve){ reason=prompt('Andika sababu ya kukataa ombi:'); if(!reason?.trim()) return; }
    const {error}=await sb().rpc('afrn_decide_player_registration',{p_player_id:playerId,p_approve:approve,p_reason:reason});
    if(error) return alert('❌ '+error.message);
    alert(approve?'✅ AFRN imeidhinisha. Mchezaji sasa ni wa klabu mpya.':'❌ AFRN imekataa ombi.');
    await refresh();
  }

  async function loadOtherPlayers(){
    if(!isClubAdmin()) return;
    const client=sb();
    const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,photo_url,photo,club_id,registration_approval_status,clubs:club_id(name)').neq('club_id',me.club_id).not('club_id','is',null).order('first_name',{ascending:true});
    if(error){
      const box=document.querySelector('#afrn-destination-requests .afrn-reg-list');
      if(box) box.innerHTML='<div class="afrn-reg-note">❌ Imeshindikana kupata wachezaji wa klabu nyingine: '+esc(error.message)+'</div>';
      return;
    }
    otherPlayers=data||[];
    renderOtherPlayers('');
  }

  function renderOtherPlayers(search=''){
    const box=document.querySelector('#afrn-destination-requests .afrn-reg-list'); if(!box) return;
    const q=String(search||'').trim().toLowerCase();
    const list=otherPlayers.filter(p=>{
      const name=fullName(p).toLowerCase();
      const team=String(p?.clubs?.name||'').toLowerCase();
      const pid=String(p?.player_id_number||'').toLowerCase();
      return !q || name.includes(q) || team.includes(q) || pid.includes(q);
    });
    if(!list.length){box.innerHTML='<div class="afrn-reg-note">Hakuna mchezaji wa klabu nyingine anayepatikana.</div>';return;}
    box.innerHTML=`<input id="afrnOtherPlayerSearch" class="afrn-player-search" type="search" placeholder="🔎 Tafuta mchezaji au klabu..." value="${esc(search)}"><div class="afrn-player-request-grid">${list.map(p=>{
      const url=photoUrl(p);
      const status=String(p.registration_approval_status||'');
      const pending=['PENDING_CLUB_APPROVAL','PENDING_AFRN_APPROVAL'].includes(status);
      return `<article class="afrn-player-request-card">
        <div class="afrn-player-request-top">
          ${url?`<img class="afrn-player-request-photo" src="${esc(url)}" alt="${esc(fullName(p))}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}
          <div class="afrn-player-request-placeholder" style="display:${url?'none':'flex'}">👤</div>
          <div><div class="afrn-player-request-name">${esc(fullName(p))}</div><div class="afrn-player-request-team">⚽ ${esc(p?.clubs?.name||'Klabu haijulikani')}</div><div class="afrn-player-request-id">AFRN Player ID: ${esc(p.player_id_number||'—')}</div></div>
        </div>
        <button type="button" class="afrn-player-request-btn ${pending?'pending':''}" data-request-player="${esc(p.id)}" ${pending?'disabled':''}>${pending?'🟡 Ombi tayari lipo':'📝 Tuma Ombi la Usajili'}</button>
      </article>`;
    }).join('')}</div>`;
    const input=document.getElementById('afrnOtherPlayerSearch');
    input?.addEventListener('input',e=>renderOtherPlayers(e.target.value));
    box.querySelectorAll('[data-request-player]').forEach(b=>b.onclick=()=>requestPlayer(b.dataset.requestPlayer));
  }

  async function loadRequests(){
    const client=sb(); if(!client) return;
    if(isClubAdmin()){
      const source=document.querySelector('#afrn-source-approvals .afrn-reg-list');
      const dest=document.querySelector('#afrn-destination-requests .afrn-reg-list');
      if(source){
        const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status,registration_rejection_reason,registration_club_rejection_reason,photo_url,photo,clubs:registration_requested_club_id(name)').eq('club_id',me.club_id).eq('registration_approval_status','PENDING_CLUB_APPROVAL').order('registration_requested_at',{ascending:false});
        if(error) source.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>'; else source.innerHTML=data?.length?data.map(p=>`<div class="afrn-reg-row"><div class="afrn-reg-info"><b>${esc(fullName(p))}</b><br>Player ID: ${esc(p.player_id_number)}<br>Inaombwa kwenda: <b>${esc(p?.clubs?.name||'Klabu nyingine')}</b><span class="afrn-reg-badge pending">INASUBIRI KLUBU</span></div><div class="afrn-reg-actions"><button class="primary" data-club-approve="${p.id}">✅ Approve</button><button class="danger" data-club-reject="${p.id}">❌ Reject</button></div></div>`).join(''):'<div class="afrn-reg-note">Hakuna ombi linalosubiri idhini ya klabu.</div>';
      }
      if(dest){
        const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status,registration_rejection_reason').eq('registration_requested_club_id',me.club_id).not('registration_approval_status','is',null).order('registration_requested_at',{ascending:false}).limit(20);
        if(error) dest.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>';
        else if(!otherPlayers.length) await loadOtherPlayers();
      }
    }
    if(isAfrnAdmin()){
      const out=document.querySelector('#afrn-final-approvals .afrn-reg-list'); if(!out) return;
      const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status').eq('registration_approval_status','PENDING_AFRN_APPROVAL').order('registration_requested_at',{ascending:false});
      if(error) out.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>'; else out.innerHTML=data?.length?data.map(p=>`<div class="afrn-reg-row"><div class="afrn-reg-info"><b>${esc(fullName(p))}</b><br>Player ID: ${esc(p.player_id_number)}<span class="afrn-reg-badge pending">PENDING AFRN</span></div><div class="afrn-reg-actions"><button class="primary" data-afrn-approve="${p.id}">✅ Approve</button><button class="danger" data-afrn-reject="${p.id}">❌ Reject</button></div></div>`).join(''):'<div class="afrn-reg-note">Hakuna ombi linalosubiri AFRN approval.</div>';
    }
  }

  function bindActions(){
    document.querySelectorAll('[data-club-approve]').forEach(b=>b.onclick=()=>decideClub(b.dataset.clubApprove,true));
    document.querySelectorAll('[data-club-reject]').forEach(b=>b.onclick=()=>decideClub(b.dataset.clubReject,false));
    document.querySelectorAll('[data-afrn-approve]').forEach(b=>b.onclick=()=>decideAfrn(b.dataset.afrnApprove,true));
    document.querySelectorAll('[data-afrn-reject]').forEach(b=>b.onclick=()=>decideAfrn(b.dataset.afrnReject,false));
  }

  async function refresh(){
    insertPanels();
    await loadRequests();
    if(isClubAdmin() && !otherPlayers.length) await loadOtherPlayers();
    bindActions();
  }

  async function init(){
    ensureStyles();
    const ok=await loadMe(); if(!ok) return;
    insertPanels();
    setTimeout(refresh,700);
    setTimeout(refresh,1800);
    setInterval(refresh,10000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

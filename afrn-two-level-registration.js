(() => {
  const sb = () => window.db || window.supabaseClient || null;
  let me = null;
  let role = '';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const isClubAdmin = () => ['club_admin','club','club_account'].includes(role);
  const isAfrnAdmin = () => ['super_admin','superadmin','admin','administrator','afrn_admin','secretary_general'].includes(role);

  function ensureStyles(){
    if(document.getElementById('afrn-registration-style')) return;
    const s=document.createElement('style'); s.id='afrn-registration-style';
    s.textContent=`
      .afrn-reg-panel{background:#fff;border:1px solid #dce2ea;border-radius:14px;padding:14px;margin:0 0 16px;box-shadow:0 3px 12px #14213d10}
      .afrn-reg-panel h3{margin:0 0 8px;font-size:16px}
      .afrn-reg-note{font-size:12px;color:#687386;margin:5px 0 10px;line-height:1.45}
      .afrn-reg-row{display:flex;gap:8px;align-items:center;justify-content:space-between;border-top:1px solid #edf0f4;padding:10px 0;flex-wrap:wrap}
      .afrn-reg-row:first-child{border-top:0}
      .afrn-reg-info{font-size:12px;flex:1;min-width:180px}
      .afrn-reg-actions{display:flex;gap:7px;flex-wrap:wrap}
      .afrn-reg-actions button{padding:8px 10px;font-size:12px}
      .afrn-reg-badge{display:inline-block;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:700;background:#eef4ff;color:#174ea6;margin-left:5px}
      .afrn-reg-badge.pending{background:#fff5df;color:#9a6100}.afrn-reg-badge.ok{background:#eaf8f0;color:#16834b}.afrn-reg-badge.bad{background:#fee;color:#c62828}
      .afrn-request-btn{width:100%;margin-top:10px;background:#0d47a1;color:#fff;padding:9px;border-radius:9px}
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
        const p=panelShell('📝 Maombi ya Usajili','Tuma ombi la kumsajili mchezaji kutoka klabu nyingine. Ombi lazima liidhinishwe kwanza na klabu inayomiliki mchezaji, kisha AFRN Admin.','afrn-destination-requests');
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
    const {data,error}=await client.rpc('afrn_request_player_registration',{p_player_id:playerId,p_club_id:me.club_id});
    if(error) return alert('❌ Ombi halikutumwa: '+error.message);
    alert('✅ Ombi limetumwa. Sasa linasubiri idhini ya klabu inayomiliki mchezaji, kisha AFRN Admin.');
    await refresh();
  }

  async function decideClub(playerId,approve){
    let reason=null;
    if(!approve){ reason=prompt('Andika sababu ya kukataa ombi:'); if(!reason?.trim()) return; }
    const {data,error}=await sb().rpc('afrn_decide_player_club_registration',{p_player_id:playerId,p_approve:approve,p_reason:reason});
    if(error) return alert('❌ '+error.message);
    alert(approve?'✅ Klabu imeidhinisha. Ombi limepelekwa kwa AFRN Admin.':'❌ Ombi limekataliwa.');
    await refresh();
  }

  async function decideAfrn(playerId,approve){
    let reason=null;
    if(!approve){ reason=prompt('Andika sababu ya kukataa ombi:'); if(!reason?.trim()) return; }
    const {data,error}=await sb().rpc('afrn_decide_player_registration',{p_player_id:playerId,p_approve:approve,p_reason:reason});
    if(error) return alert('❌ '+error.message);
    alert(approve?'✅ AFRN imeidhinisha. Mchezaji sasa ni wa klabu mpya.':'❌ AFRN imekataa ombi.');
    await refresh();
  }

  async function loadRequests(){
    const client=sb(); if(!client) return;
    if(isClubAdmin()){
      const source=document.querySelector('#afrn-source-approvals .afrn-reg-list');
      const dest=document.querySelector('#afrn-destination-requests .afrn-reg-list');
      if(source){
        const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status,registration_rejection_reason,registration_club_rejection_reason').eq('club_id',me.club_id).eq('registration_approval_status','PENDING_CLUB_APPROVAL').order('registration_requested_at',{ascending:false});
        if(error) source.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>'; else source.innerHTML=data?.length?data.map(p=>`<div class="afrn-reg-row"><div class="afrn-reg-info"><b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(' '))}</b><br>Player ID: ${esc(p.player_id_number)}<span class="afrn-reg-badge pending">INASUBIRI KLUBU</span></div><div class="afrn-reg-actions"><button class="primary" data-club-approve="${p.id}">✅ Approve</button><button class="danger" data-club-reject="${p.id}">❌ Reject</button></div></div>`).join(''):'<div class="afrn-reg-note">Hakuna ombi linalosubiri idhini ya klabu.</div>';
      }
      if(dest){
        const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status,registration_rejection_reason').eq('registration_requested_club_id',me.club_id).not('registration_approval_status','is',null).order('registration_requested_at',{ascending:false}).limit(20);
        if(error) dest.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>'; else dest.innerHTML=data?.length?data.map(p=>{const st=p.registration_approval_status||'';const cls=st==='APPROVED'?'ok':st==='REJECTED'?'bad':'pending';return `<div class="afrn-reg-row"><div class="afrn-reg-info"><b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(' '))}</b><br>Player ID: ${esc(p.player_id_number)}<span class="afrn-reg-badge ${cls}">${esc(st)}</span></div></div>`}).join(''):'<div class="afrn-reg-note">Bado hujatuma maombi.</div>';
      }
    }
    if(isAfrnAdmin()){
      const out=document.querySelector('#afrn-final-approvals .afrn-reg-list'); if(!out) return;
      const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,registration_requested_club_id,registration_requested_at,registration_approval_status').eq('registration_approval_status','PENDING_AFRN_APPROVAL').order('registration_requested_at',{ascending:false});
      if(error) out.innerHTML='<div class="afrn-reg-note">❌ '+esc(error.message)+'</div>'; else out.innerHTML=data?.length?data.map(p=>`<div class="afrn-reg-row"><div class="afrn-reg-info"><b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(' '))}</b><br>Player ID: ${esc(p.player_id_number)}<span class="afrn-reg-badge pending">PENDING AFRN</span></div><div class="afrn-reg-actions"><button class="primary" data-afrn-approve="${p.id}">✅ Approve</button><button class="danger" data-afrn-reject="${p.id}">❌ Reject</button></div></div>`).join(''):'<div class="afrn-reg-note">Hakuna ombi linalosubiri AFRN approval.</div>';
    }
  }

  async function addRequestButtons(){
    if(!isClubAdmin()) return;
    const client=sb();
    const {data,error}=await client.from('players').select('id,player_id_number,club_id,registration_approval_status').neq('club_id',me.club_id);
    if(error||!data) return;
    const byId=new Map(data.map(p=>[String(p.player_id_number),p]));
    document.querySelectorAll('#playersContainer .card').forEach(card=>{
      if(card.querySelector('.afrn-request-btn')) return;
      const pid=card.querySelector('.player-id b')?.textContent?.trim();
      const p=byId.get(pid); if(!p || !p.club_id) return;
      const action=card.querySelector('.actions'); if(!action) return;
      const b=document.createElement('button'); b.type='button'; b.className='afrn-request-btn';
      b.textContent = p.registration_approval_status==='PENDING_CLUB_APPROVAL' || p.registration_approval_status==='PENDING_AFRN_APPROVAL' ? '🟡 Ombi tayari lipo' : '📝 Tuma Ombi la Usajili';
      b.disabled = b.textContent.includes('tayari');
      b.onclick=()=>requestPlayer(p.id);
      action.insertAdjacentElement('afterend',b);
    });
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
    await addRequestButtons();
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

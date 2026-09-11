(()=>{
'use strict';
if(window.__AFRN_FREE_AGENT_PLAYER_APPROVAL__) return;
window.__AFRN_FREE_AGENT_PLAYER_APPROVAL__=true;

const db=()=>window.supabaseClient||window.db||null;
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const name=p=>[p?.first_name,p?.middle_name,p?.last_name].filter(Boolean).join(' ')||'Mchezaji';

function styles(){
 if(document.getElementById('afrn-fa-player-css'))return;
 const s=document.createElement('style');s.id='afrn-fa-player-css';s.textContent=`
 .afrn-fa-player-panel{background:#fff;border:1px solid #dce2ea;border-radius:14px;padding:14px;margin:0 0 16px;box-shadow:0 3px 12px #14213d10}
 .afrn-fa-player-panel h3{margin:0 0 7px;font-size:16px}.afrn-fa-player-note{font-size:12px;color:#687386;line-height:1.45;margin-bottom:10px}
 .afrn-fa-player-card{border:1px solid #e2e7ef;border-radius:12px;padding:12px;margin-top:9px;background:#fbfcfe}
 .afrn-fa-player-row{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}.afrn-fa-player-info{font-size:12px;flex:1;min-width:190px}.afrn-fa-player-club{font-weight:800;font-size:14px}.afrn-fa-player-status{display:inline-block;margin-top:5px;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:800;background:#fff5df;color:#9a6100}
 .afrn-fa-player-actions{display:flex;gap:7px;flex-wrap:wrap}.afrn-fa-player-actions button{padding:9px 11px}.afrn-fa-accept{background:#16834b;color:#fff}.afrn-fa-reject{background:#fee;color:#c62828}.afrn-fa-doc{background:#eef4ff;color:#174ea6;text-decoration:none;padding:9px 11px;border-radius:9px;font-size:12px;font-weight:700}
 .afrn-fa-player-empty{padding:13px;background:#f7f9fc;border-radius:10px;color:#687386;font-size:12px;text-align:center}
 `;document.head.appendChild(s);
}

async function currentPlayer(){
 const client=db();if(!client?.auth?.getUser)return null;
 const {data:{user}}=await client.auth.getUser();if(!user)return null;
 const {data,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,user_id').eq('user_id',user.id).maybeSingle();
 if(error||!data)return null;
 return data;
}

async function clubName(id){
 const {data}=await db().from('clubs').select('id,name,short_name').eq('id',id).maybeSingle();
 return data?.name||data?.short_name||'Klabu';
}

async function loadRequests(player){
 const client=db();
 const {data,error}=await client.from('free_agent_registration_requests')
   .select('id,club_id,agreement_document_url,status,submitted_at,player_responded_at,player_rejection_reason,notes')
   .eq('player_id',player.id)
   .order('submitted_at',{ascending:false}).limit(20);
 if(error) throw error;
 const rows=data||[];
 const clubs={};for(const r of rows){if(!clubs[r.club_id])clubs[r.club_id]=await clubName(r.club_id)}
 return rows.map(r=>({...r,club_name:clubs[r.club_id]||'Klabu'}));
}

function statusLabel(s){return ({REQUESTED:'⏳ Inasubiri ridhaa ya mchezaji',PLAYER_ACCEPTED:'✅ Umeikubali — inapelekwa AFRN',PENDING_AFRN:'🏛️ Inasubiri AFRN',APPROVED:'✅ Imeidhinishwa',PLAYER_REJECTED:'❌ Umekataa',REJECTED:'❌ Imekataliwa na AFRN',CANCELLED:'🚫 Imeghairiwa'}[s]||s)}

async function render(){
 if(!/players\\.html$/i.test(location.pathname))return;
 const player=await currentPlayer();if(!player)return;
 styles();
 let panel=document.getElementById('afrn-fa-player-panel');
 if(!panel){
  panel=document.createElement('section');panel.id='afrn-fa-player-panel';panel.className='afrn-fa-player-panel';
  panel.innerHTML='<h3>👤 Maombi ya Free Agent</h3><div class="afrn-fa-player-note">Klabu inayokutaka lazima ikutumie ombi. <b>Wewe ndiye unayeamua kwanza.</b> Ukikubali, ombi linaenda moja kwa moja AFRN kwa ukaguzi na idhini ya mwisho.</div><div id="afrn-fa-player-list">⏳ Inapakia...</div>';
  const main=document.querySelector('main');const status=document.getElementById('status');(status||main?.firstElementChild)?.insertAdjacentElement('afterend',panel);
 }
 const list=panel.querySelector('#afrn-fa-player-list');
 try{
  const rows=await loadRequests(player);
  if(!rows.length){list.innerHTML='<div class="afrn-fa-player-empty">Hakuna ombi la Free Agent linalokusubiri.</div>';return;}
  list.innerHTML=rows.map(r=>`<div class="afrn-fa-player-card" data-request-id="${esc(r.id)}"><div class="afrn-fa-player-row"><div class="afrn-fa-player-info"><div class="afrn-fa-player-club">⚽ ${esc(r.club_name)}</div><div>Ombi lilitumwa: ${r.submitted_at?new Date(r.submitted_at).toLocaleString():'—'}</div><span class="afrn-fa-player-status">${esc(statusLabel(r.status))}</span></div><div class="afrn-fa-player-actions">${r.agreement_document_url?`<a class="afrn-fa-doc" href="${esc(r.agreement_document_url)}" target="_blank" rel="noopener">📄 Fungua mkataba</a>`:''}${r.status==='REQUESTED'?`<button type="button" class="afrn-fa-accept" data-action="accept">✅ KUBALI</button><button type="button" class="afrn-fa-reject" data-action="reject">❌ KATAA</button>`:''}</div></div></div>`).join('');
  list.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',async()=>{
   const card=btn.closest('[data-request-id]'),id=card?.dataset.requestId,accept=btn.dataset.action==='accept';
   let reason=null;if(!accept){reason=prompt('Andika sababu ya kukataa ombi (si lazima):');}
   if(!accept && reason===null)return;
   btn.disabled=true;
   const {error}=await client.rpc('afrn_player_respond_free_agent_request',{p_request_id:id,p_accept:accept,p_reason:reason||null});
   if(error){btn.disabled=false;alert('❌ '+error.message);return;}
   alert(accept?'✅ Umekubali ombi. Sasa limepelekwa AFRN kwa ukaguzi na idhini.':'❌ Umekataa ombi la klabu.');
   await render();
  }));
 }catch(e){list.innerHTML='<div class="afrn-fa-player-empty">❌ '+esc(e?.message||e)+'</div>';}
}

// Replace the old generic registration action for Free Agents with a player-consent-first flow.
window.AFRNRequestRegistration=async function(playerId){
 const client=db();
 try{
  const {data:p,error}=await client.from('players').select('id,player_id_number,first_name,middle_name,last_name,club_id,status').eq('id',playerId).maybeSingle();
  if(error||!p)throw error||new Error('Mchezaji hakupatikana');
  if(p.club_id===null){
   alert('📨 Kwa Free Agent, klabu haiwezi kujithibitishia ridhaa ya mchezaji. Ombi lazima litumwe kwenye akaunti ya mchezaji kwanza; mchezaji akubali ndipo liende AFRN.');
   // The club-side dialog is intentionally kept in the existing registration script; it must submit player_consent=false.
   if(typeof window.AFRNOpenFreeAgentRequest==='function')return window.AFRNOpenFreeAgentRequest(p);
   return;
  }
  if(typeof window.__AFRN_OLD_REQUEST_REGISTRATION__==='function')return window.__AFRN_OLD_REQUEST_REGISTRATION__(playerId);
  throw new Error('Tafadhali tumia sehemu ya Tuma Ombi la Usajili kwa mchezaji wa klabu nyingine.');
 }catch(e){alert('❌ '+(e?.message||e));}
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(render,900));else setTimeout(render,900);
})();
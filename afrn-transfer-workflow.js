(function(){
  'use strict';
  if(!/transfers\.html$/i.test(location.pathname)) return;
  const db=window.supabaseClient;
  if(!db) return;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const statusBadge=s=>{const x=String(s||'DRAFT').toUpperCase();const cls=x==='COMPLETED'?'background:#d1e7dd;color:#0f5132':x==='APPROVED'?'background:#dbeafe;color:#1e40af':x==='PENDING'?'background:#fff3cd;color:#664d03':x==='REJECTED'?'background:#f8d7da;color:#842029':'background:#e9eef5;color:#344054';return `<span style="display:inline-block;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:800;${cls}">${esc(x)}</span>`};
  const notice=(ok,msg)=>`<div style="margin-top:10px;padding:10px;border-radius:9px;background:${ok?'#e9f7ef':'#fdecec'};color:${ok?'#0f5132':'#842029'}">${esc(msg)}</div>`;
  async function identity(){const {data:{user}}=await db.auth.getUser();if(!user)return null;const {data}=await db.from('profiles').select('id,role,club_id,full_name').eq('id',user.id).maybeSingle();return data||null;}
  async function load(){
    const me=await identity(); if(!me)return;
    const role=String(me.role||'').toLowerCase();
    const admin=['super_admin','superadmin','admin','administrator','afrn_admin','secretary_general'].includes(role);
    const panel=document.getElementById('afrnTransferWorkflow'); if(!panel)return;
    const {data:rows,error}=await db.from('transfers').select('id,transfer_number,status,transfer_type,transfer_date,player_id,from_club_id,to_club_id,contract_start_date,contract_end_date,created_at').order('created_at',{ascending:false}).limit(100);
    if(error){panel.innerHTML=notice(false,error.message);return;}
    const ids=[...new Set((rows||[]).flatMap(r=>[r.player_id,r.from_club_id,r.to_club_id].filter(Boolean)))];
    const [{data:players},{data:clubs}]=await Promise.all([db.from('players').select('id,first_name,middle_name,last_name,player_id_number').in('id',(rows||[]).map(r=>r.player_id).filter(Boolean)),db.from('clubs').select('id,name,afrn_club_id').in('id',ids)]);
    const pm=Object.fromEntries((players||[]).map(p=>[p.id,p])); const cm=Object.fromEntries((clubs||[]).map(c=>[c.id,c]));
    const visible=admin?(rows||[]):(rows||[]).filter(r=>String(r.from_club_id)===String(me.club_id)||String(r.to_club_id)===String(me.club_id));
    const pending=visible.filter(r=>['PENDING','APPROVED'].includes(String(r.status||'').toUpperCase()));
    if(!pending.length){panel.innerHTML='<div style="padding:4px 0;color:#667085;font-size:12px">Hakuna Transfer Request inayosubiri hatua.</div>';return;}
    panel.innerHTML=pending.map(r=>{const p=pm[r.player_id]||{};const name=[p.first_name,p.middle_name,p.last_name].filter(Boolean).join(' ')||'Mchezaji';const from=cm[r.from_club_id]?.name||'—';const to=cm[r.to_club_id]?.name||'—';let actions='';if(admin){if(String(r.status).toUpperCase()==='PENDING')actions+=`<button type="button" data-action="approve" data-id="${esc(r.id)}" style="border:0;border-radius:8px;padding:9px 12px;background:#0d47a1;color:#fff;font-weight:800">✅ Approve</button><button type="button" data-action="reject" data-id="${esc(r.id)}" style="border:0;border-radius:8px;padding:9px 12px;background:#dc3545;color:#fff;font-weight:800">❌ Reject</button>`;if(String(r.status).toUpperCase()==='APPROVED')actions+=`<button type="button" data-action="complete" data-id="${esc(r.id)}" style="border:0;border-radius:8px;padding:9px 12px;background:#198754;color:#fff;font-weight:800">🏁 Complete Transfer</button>`;}return `<article style="border:1px solid #dfe6ef;border-radius:12px;padding:12px;margin:8px 0;background:#fff"><div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div><b>${esc(name)}</b><div style="font-size:11px;color:#667085;margin-top:3px">AFRN ID: ${esc(p.player_id_number||'—')} · ${esc(r.transfer_number||'—')}</div></div>${statusBadge(r.status)}</div><div style="font-size:12px;margin-top:8px">${esc(from)} → <b>${esc(to)}</b><br>Aina: ${esc(r.transfer_type||'Transfer')} · Tarehe: ${esc(r.transfer_date||'—')}</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">${actions}</div></article>`}).join('');
    panel.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',async()=>{const action=btn.dataset.action;let status=action==='approve'?'APPROVED':action==='complete'?'COMPLETED':'REJECTED';let reason=null;if(action==='reject'){reason=prompt('Sababu ya kukataa Transfer Request:');if(!reason||!reason.trim())return;}btn.disabled=true;const patch={status};if(reason)patch.notes=reason.trim();const {error:e}=await db.from('transfers').update(patch).eq('id',btn.dataset.id);btn.disabled=false;if(e){alert('❌ '+e.message);return;}if(action==='complete'){alert('✅ Transfer imekamilika. Contract na klabu ya mchezaji vimesawazishwa na mfumo.');}load();try{window.loadHistory&&window.loadHistory();}catch(_){} });
  }
  async function init(){
    const host=document.createElement('section');host.id='afrnTransferWorkflow';host.style.cssText='background:#fff;border:1px solid #dfe6ef;border-radius:14px;padding:14px;margin:0 0 15px;box-shadow:0 3px 12px #0000000b';
    host.innerHTML='<h3 style="margin:0 0 5px;color:#071a33">🔄 AFRN Transfer Workflow</h3><div style="font-size:12px;color:#667085;margin-bottom:8px">Request → Approval → Completion → Contract → Player Club Update → History</div><div id="afrnTransferWorkflowBody">⏳ Inapakia...</div>';
    const main=document.querySelector('main');if(!main||document.getElementById('afrnTransferWorkflow'))return;main.insertBefore(host,main.firstChild);await load();
  }
  setTimeout(init,700);setTimeout(load,2500);setTimeout(load,5000);
})();

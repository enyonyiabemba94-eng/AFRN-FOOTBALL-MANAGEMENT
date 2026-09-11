(() => {
  const BUCKET = 'AFRN FILES';
  const MAX = 10 * 1024 * 1024;
  const TYPES = ['application/pdf','image/jpeg','image/png','image/webp'];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const db = () => window.supabaseClient || window.supabase;

  async function identity() {
    const sb = db();
    const u = await sb.auth.getUser();
    if (!u.data?.user) return null;
    const { data } = await sb.from('profiles').select('id,role,club_id,full_name').eq('id', u.data.user.id).maybeSingle();
    return data || null;
  }

  function notice(text, bad=false) {
    return `<div style="padding:10px;border-radius:9px;margin-top:8px;background:${bad?'#fff0f0':'#eef8f1'};color:${bad?'#b42318':'#137333'};font-size:12px">${text}</div>`;
  }

  async function uploadEvidence(file, playerId) {
    if (!file) throw new Error('Chagua ushahidi wa makubaliano.');
    if (!TYPES.includes(file.type)) throw new Error('Ushahidi lazima uwe PDF, JPG, PNG au WEBP.');
    if (file.size > MAX) throw new Error('Ushahidi umefika zaidi ya 10MB.');
    const sb = db();
    if (!sb?.storage) throw new Error('Supabase Storage haijapatikana.');
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const safePlayer = String(playerId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `free-agent-consents/${safePlayer}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type });
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('URL ya ushahidi haikupatikana.');
    return { path, url:data.publicUrl };
  }

  async function request(playerId, clubId, file, playerConsent, clubDeclaration, notes) {
    const sb = db();
    const uploaded = await uploadEvidence(file, playerId);
    const { data, error } = await sb.rpc('afrn_request_free_agent_registration', {
      p_player_id: playerId,
      p_club_id: clubId,
      p_agreement_document_url: uploaded.url,
      p_player_consent: playerConsent,
      p_club_declaration: clubDeclaration,
      p_notes: notes || null
    });
    if (error) {
      try { await sb.storage.from(BUCKET).remove([uploaded.path]); } catch (_) {}
      throw error;
    }
    return data;
  }

  function installPanel() {
    const old = document.getElementById('afrnFreeAgentPanel');
    if (!old) return;
    if (old.dataset.consentWorkflow === '1') return;
    old.dataset.consentWorkflow = '1';
    old.innerHTML = `
      <h3 style="margin:0 0 6px">🟢 Free Agent — Ombi la Usajili kwa AFRN</h3>
      <div style="font-size:12px;color:#687386;margin-bottom:10px;line-height:1.5">
        <b>Muhimu:</b> Free Agent hawezi kutumwa AFRN kwa kubofya tu. Klabu lazima iwe na <b>ushahidi wa makubaliano na mchezaji</b>, kwa mfano mkataba mpya au barua ya makubaliano iliyosainiwa na mchezaji na klabu. Ushahidi huo utaenda pamoja na ombi kwa AFRN.
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="afrnFreeSearch" style="flex:1;min-width:180px;padding:11px;border:1px solid #d4dbe6;border-radius:9px" placeholder="AFRN Player ID au jina">
        <button id="afrnFreeSearchBtn" class="primary" type="button">🔎 Tafuta Free Agent</button>
      </div>
      <div id="afrnFreeResults" style="margin-top:10px"></div>`;

    const search = async () => {
      const out = document.getElementById('afrnFreeResults');
      if (!out) return;
      out.innerHTML = '⏳ Inatafuta...';
      const sb = db();
      const { data, error } = await sb.rpc('afrn_search_free_agents', { p_search: document.getElementById('afrnFreeSearch')?.value?.trim() || null });
      if (error) { out.innerHTML = notice('❌ ' + esc(error.message), true); return; }
      if (!data?.length) { out.innerHTML = notice('ℹ️ Hakuna Free Agent aliyepatikana.'); return; }
      out.innerHTML = data.map(p => `
        <div style="border:1px solid #e4e9f0;border-radius:12px;padding:11px;margin-top:8px">
          <b>${esc(p.full_name)}</b>
          <div style="font-size:11px;color:#687386;margin:4px 0">${esc(p.player_id_number||'—')} · ${esc(p.nationality||'—')} · ${esc(p.player_position||'—')}</div>
          <button type="button" class="primary afrnConsentRequest" data-player="${esc(p.id)}">📨 Omba Usajili kwa AFRN</button>
        </div>`).join('');
      out.querySelectorAll('.afrnConsentRequest').forEach(btn => btn.addEventListener('click', () => openRequest(btn.dataset.player)));
    };

    document.getElementById('afrnFreeSearchBtn')?.addEventListener('click', search);
    document.getElementById('afrnFreeSearch')?.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
  }

  async function openRequest(playerId) {
    const me = await identity();
    if (!me?.club_id) return alert('❌ Akaunti hii haijaunganishwa na klabu.');
    const sb = db();
    const { data:p, error } = await sb.from('players').select('id,player_id_number,first_name,middle_name,last_name').eq('id',playerId).maybeSingle();
    if (error || !p) return alert('❌ Mchezaji hakupatikana.');
    const name = [p.first_name,p.middle_name,p.last_name].filter(Boolean).join(' ');
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'width:min(620px,94vw);border:0;border-radius:16px;padding:0;box-shadow:0 20px 60px #0005;';
    dialog.innerHTML = `<div style="padding:18px;font-family:Arial,sans-serif">
      <h2 style="margin:0 0 8px">📄 Ushahidi wa Makubaliano</h2>
      <p style="font-size:13px;line-height:1.5"><b>${esc(name)}</b> · ${esc(p.player_id_number||'—')}</p>
      <div style="background:#fff8e1;padding:11px;border-radius:10px;font-size:12px;line-height:1.5;margin-bottom:12px">Pakia <b>mkataba mpya uliosainiwa</b> au <b>barua ya makubaliano</b> inayoonyesha kuwa mchezaji na klabu wamekubaliana. AFRN itakagua ushahidi kabla ya kumhamisha mchezaji kwenye klabu.</div>
      <label style="font-size:12px;font-weight:700">Ushahidi wa makubaliano * </label>
      <input id="afrnConsentFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style="width:100%;margin-top:6px;padding:10px;border:1px solid #d4dbe6;border-radius:9px;box-sizing:border-box">
      <div style="font-size:11px;color:#687386;margin-top:5px">PDF/JPG/PNG/WEBP · kiwango cha juu 10MB.</div>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:14px;font-size:12px"><input id="afrnPlayerConsent" type="checkbox"> Ninathibitisha kuwa <b>mchezaji amekubali</b> kujiunga na klabu hii na ushahidi uliopakiwa ni wa kweli.</label>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:12px"><input id="afrnClubDeclaration" type="checkbox"> Ninathibitisha kwa niaba ya klabu kuwa <b>klabu imekubaliana na mchezaji</b> na iko tayari kumsajili chini ya masharti yaliyowasilishwa.</label>
      <label style="display:block;margin-top:12px;font-size:12px;font-weight:700">Maelezo ya ziada (hiari)</label>
      <textarea id="afrnConsentNotes" style="width:100%;min-height:70px;margin-top:5px;padding:9px;border:1px solid #d4dbe6;border-radius:9px;box-sizing:border-box" placeholder="Mfano: Mkataba umeanza tarehe..."></textarea>
      <div id="afrnConsentMsg"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button type="button" class="secondary" id="afrnConsentCancel">Ghairi</button><button type="button" class="primary" id="afrnConsentSubmit">📨 Tuma Ombi AFRN</button></div>
    </div>`;
    document.body.appendChild(dialog);
    dialog.showModal();
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.querySelector('#afrnConsentCancel').onclick = close;
    dialog.querySelector('#afrnConsentSubmit').onclick = async () => {
      const btn = dialog.querySelector('#afrnConsentSubmit');
      const file = dialog.querySelector('#afrnConsentFile').files?.[0];
      const pc = dialog.querySelector('#afrnPlayerConsent').checked;
      const cd = dialog.querySelector('#afrnClubDeclaration').checked;
      const msg = dialog.querySelector('#afrnConsentMsg');
      if (!file) { msg.innerHTML = notice('❌ Lazima upakie ushahidi wa makubaliano.', true); return; }
      if (!pc || !cd) { msg.innerHTML = notice('❌ Thibitisha makubaliano ya mchezaji na tamko la klabu.', true); return; }
      btn.disabled = true; msg.innerHTML = notice('⏳ Inapakia ushahidi na kutuma ombi AFRN...');
      try {
        await request(playerId, me.club_id, file, pc, cd, dialog.querySelector('#afrnConsentNotes').value.trim());
        msg.innerHTML = notice('✅ Ombi limetumwa AFRN pamoja na ushahidi. Mchezaji hataingia kwenye klabu mpaka AFRN iidhinishe.');
        setTimeout(close, 1200);
      } catch (e) {
        btn.disabled = false;
        msg.innerHTML = notice('❌ ' + esc(e?.message || e), true);
      }
    };
  }

  const start = () => {
    installPanel();
    const observer = new MutationObserver(installPanel);
    observer.observe(document.documentElement, {childList:true,subtree:true});
    [500,1500,3000,6000].forEach(ms => setTimeout(installPanel, ms));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
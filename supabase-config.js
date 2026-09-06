/* AFRN secure compatibility loader + role controls + same-club renewal + player approval workflow */
const AFRN_SUPABASE_URL="https://jjqhvruppafpumcthmwe.supabase.co";
const AFRN_SUPABASE_KEY="sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G";
if(window.supabase && typeof window.supabase.createClient==="function" && !window.supabaseClient){window.supabaseClient=window.supabase.createClient(AFRN_SUPABASE_URL,AFRN_SUPABASE_KEY);}
(function(){
  const s=document.createElement("script");
  s.src="supabase-config-original.js";
  s.onload=function(){
    setTimeout(async function(){
      const client=window.supabaseClient;if(!client)return;
      const esc=v=>String(v??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
      const notice=(kind,title,body)=>`<div class="${kind==="ok"?"successNotice":kind==="bad"?"error":"notice"}" style="margin:10px 0;padding:12px;border-radius:10px"><b>${title}</b><br>${body}</div>`;
      async function identity(){const u=await client.auth.getUser();if(!u.data?.user)return null;const p=await client.from("profiles").select("id,role,club_id,full_name").eq("id",u.data.user.id).maybeSingle();return p.data||null;}
      const me=await identity();
      const role=String(me?.role||"").toLowerCase();
      const clubAdmin=["club_admin","club","club_account"].includes(role);
      const afrnAdmin=["super_admin","superadmin","admin","administrator","afrn_admin","secretary_general"].includes(role);

      /* ---------- GLOBAL CLUB-ADMIN UI LOCK ---------- */
      function lockClubAdminUI(){
        if(!clubAdmin)return;
        const path=location.pathname.toLowerCase();
        const page=path.split("/").pop()||"";
        const blockAll=page==="clubs.html"||page==="competitions.html"||page==="matches.html"||page==="reports.html";
        const blocked=/^(hariri|edit|futa|delete|ongeza klabu|add club|ongeza timu|add team|weka matokeo|hifadhi matokeo|save result|add match|ongeza mechi|ongeza mashindano|add competition)$/i;
        const scan=()=>{
          document.querySelectorAll("button,a").forEach(el=>{
            const text=(el.textContent||"").trim().replace(/\s+/g," ");
            if(!text)return;
            if(blockAll && blocked.test(text)){
              el.style.display="none";
              el.setAttribute("aria-hidden","true");
              el.dataset.afrnLocked="1";
            }
            if(page==="players.html" && /^(hariri|edit|futa|delete)$/i.test(text)){
              el.style.display="none";el.dataset.afrnLocked="1";
            }
          });
        };
        scan();
        new MutationObserver(scan).observe(document.body,{subtree:true,childList:true});
      }
      lockClubAdminUI();

      /* ---------- SAME-CLUB CONTRACT RENEWAL ---------- */
      if(/transfers\.html$/i.test(location.pathname)){
        const box=()=>document.getElementById("afrnEligibilityBox");
        async function sameClubRenew(playerId){
          const b=box();if(!b)return;
          const currentMe=await identity();
          const {data:p,error:pe}=await client.from("players").select("id,player_id_number,first_name,middle_name,last_name,club_id,status").eq("id",playerId).maybeSingle();
          if(pe||!p){b.innerHTML=notice("bad","❌ Mchezaji hakupatikana",esc(pe?.message||"Player not found"));return;}
          if(!currentMe?.club_id || String(p.club_id)!==String(currentMe.club_id)) return;
          const [{data:club},{data:contracts,error:ce}]=await Promise.all([
            client.from("clubs").select("id,name,afrn_club_id").eq("id",p.club_id).maybeSingle(),
            client.from("player_contracts").select("id,start_date,end_date,status,contract_number,club_id").eq("player_id",p.id).eq("club_id",p.club_id).order("end_date",{ascending:false})
          ]);
          if(ce){b.innerHTML=notice("bad","❌ Imeshindikana kusoma mikataba",esc(ce.message));return;}
          const today=new Date().toISOString().slice(0,10);
          const active=(contracts||[]).find(c=>["ACTIVE","EXPIRING","EXPIRING SOON"].includes(String(c.status||"").toUpperCase())&&(!c.end_date||c.end_date>=today));
          if(!active)return;
          const suggestedStart=active.end_date?new Date(new Date(active.end_date+"T00:00:00").getTime()+86400000).toISOString().slice(0,10):today;
          b.innerHTML=notice("ok","🟢 Mchezaji wa Klabu Yako — RENEW/ONGEZA MKATABA",`Mchezaji <b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" "))}</b> yupo <b>${esc(club?.name||"Klabu yako")}</b>.<br>Mkataba wa sasa: <b>${esc(active.contract_number||"—")}</b> · Unaisha: <b>${esc(active.end_date||"—")}</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div><label>Kuanzia mkataba mpya *</label><input id="afrnRenewStart" type="date" value="${esc(suggestedStart)}"></div><div><label>Kuishia *</label><input id="afrnRenewEnd" type="date"></div><div style="grid-column:1/-1"><label>Maelezo ya mkataba mpya</label><textarea id="afrnRenewNotes" placeholder="Masharti au maelezo ya renewal..."></textarea></div></div><div style="margin-top:10px"><button type="button" class="btn success" id="afrnRenewBtn">📝 Ongeza/Renew Mkataba</button></div><div id="afrnRenewMsg"></div>`);
          document.getElementById("afrnRenewBtn")?.addEventListener("click",async()=>{
            const start=document.getElementById("afrnRenewStart")?.value;const end=document.getElementById("afrnRenewEnd")?.value;const notes=document.getElementById("afrnRenewNotes")?.value?.trim()||null;const msg=document.getElementById("afrnRenewMsg");
            if(!start||!end)return alert("⚠️ Weka tarehe ya kuanza na kumalizika kwa mkataba mpya.");
            if(end<start)return alert("⚠️ Tarehe ya mwisho haiwezi kuwa kabla ya tarehe ya kuanza.");
            const btn=document.getElementById("afrnRenewBtn");if(btn)btn.disabled=true;
            const {data,error}=await client.rpc("afrn_renew_player_contract",{p_player_id:p.id,p_club_id:p.club_id,p_start_date:start,p_end_date:end,p_contract_number:null,p_salary:null,p_contract_file_url:null,p_notes:notes,p_league_name:null});
            if(btn)btn.disabled=false;
            if(error){if(msg)msg.innerHTML=notice("bad","❌ Renewal haikukamilika",esc(error.message));return;}
            if(msg)msg.innerHTML=notice("ok","✅ Mkataba umeongezwa",`Mkataba mpya wa <b>${esc(data?.contract_number||"—")}</b> umehifadhiwa. Hakuna Transfer Request iliyotengenezwa. AFRN Player ID bado ni <b>${esc(p.player_id_number||"—")}</b>.`);
          });
        }
        const bind=()=>{const sel=document.getElementById("playerId");if(!sel)return;if(sel.dataset.afrnRenewBound)return;sel.dataset.afrnRenewBound="1";sel.addEventListener("change",()=>sameClubRenew(sel.value));if(sel.value)sameClubRenew(sel.value);};
        [3500,4500,6000].forEach(ms=>setTimeout(bind,ms));
      }

      /* ---------- CLUB ADMIN: FREE-AGENT SEARCH + REGISTRATION REQUEST ---------- */
      if(clubAdmin && /players\.html$/i.test(location.pathname)){
        const main=document.querySelector("main");
        if(main && !document.getElementById("afrnFreeAgentPanel")){
          const panel=document.createElement("section");panel.id="afrnFreeAgentPanel";panel.style.cssText="background:#fff;border:1px solid #dfe6ef;border-radius:16px;padding:15px;margin:0 0 16px;box-shadow:0 3px 12px #14213d10";
          panel.innerHTML=`<h3 style="margin:0 0 6px">🟢 Free Agent — Omba Usajili</h3><div style="font-size:12px;color:#687386;margin-bottom:10px">Club Admin hawezi kumsajili Free Agent moja kwa moja. Tafuta mchezaji kwa AFRN Player ID/jina, tuma ombi, kisha AFRN ita-approve kabla hajaingia kwenye klabu yako.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="afrnFreeSearch" style="flex:1;min-width:180px;padding:11px;border:1px solid #d4dbe6;border-radius:9px" placeholder="AFRN Player ID au jina"><button id="afrnFreeSearchBtn" class="primary" type="button">🔎 Tafuta Free Agent</button></div><div id="afrnFreeResults" style="margin-top:10px"></div>`;
          main.insertBefore(panel,document.getElementById("playersContainer")||null);
          const search=async()=>{
            const q=document.getElementById("afrnFreeSearch")?.value?.trim()||null;const out=document.getElementById("afrnFreeResults");if(!out)return;out.innerHTML="⏳ Inatafuta...";
            const {data,error}=await client.rpc("afrn_search_free_agents",{p_search:q});
            if(error){out.innerHTML=notice("bad","❌ Utafutaji umeshindikana",esc(error.message));return;}
            if(!data?.length){out.innerHTML=notice("","ℹ️ Hakuna Free Agent","Hakuna mchezaji huru aliyepatikana kwa utafutaji huo.");return;}
            out.innerHTML=data.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid #e4e9f0;border-radius:10px;margin-top:7px"><div><b>${esc(p.full_name)}</b><div style="font-size:11px;color:#687386">${esc(p.player_id_number||"—")} · ${esc(p.nationality||"—")} · ${esc(p.player_position||"—")}</div></div><button type="button" class="primary afrnFreeRequest" data-player="${esc(p.id)}">📨 Omba Usajili</button></div>`).join("");
            out.querySelectorAll(".afrnFreeRequest").forEach(btn=>btn.addEventListener("click",async()=>{
              btn.disabled=true;
              const {data:r,error:e}=await client.rpc("afrn_request_free_agent_registration",{p_player_id:btn.dataset.player,p_club_id:me.club_id});
              btn.disabled=false;
              if(e){alert("❌ " + e.message);return;}
              alert("✅ Ombi limetumwa AFRN kwa ajili ya approval. Mchezaji hataingia kwenye klabu mpaka AFRN i-approve.");
              search();
            }));
          };
          document.getElementById("afrnFreeSearchBtn")?.addEventListener("click",search);
          document.getElementById("afrnFreeSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter")search();});
        }
        const add=document.getElementById("addBtn");if(add){add.textContent="＋ Omba Usajili wa Mchezaji";add.title="Mchezaji mpya ataenda kwa AFRN kwa approval kabla ya kuingia klabuni";}
      }

      /* ---------- AFRN ADMIN: PLAYER REGISTRATION APPROVALS ---------- */
      if(afrnAdmin && /players\.html$/i.test(location.pathname)){
        const main=document.querySelector("main");
        if(main && !document.getElementById("afrnPlayerApprovals")){
          const panel=document.createElement("section");panel.id="afrnPlayerApprovals";panel.style.cssText="background:#fff;border:1px solid #dfe6ef;border-radius:16px;padding:15px;margin:0 0 16px;box-shadow:0 3px 12px #14213d10";
          panel.innerHTML=`<h3 style="margin:0 0 6px">🛡️ AFRN — Player Registration Approvals</h3><div id="afrnApprovalList">⏳ Inapakia maombi...</div>`;
          main.insertBefore(panel,document.getElementById("playersContainer")||null);
          const loadApprovals=async()=>{
            const out=document.getElementById("afrnApprovalList");if(!out)return;
            const [{data:rows,error},{data:clubs}]=await Promise.all([
              client.from("players").select("id,player_id_number,first_name,middle_name,last_name,nationality,position,status,registration_requested_club_id,registration_requested_at,registration_rejection_reason").eq("registration_approval_status","PENDING").order("registration_requested_at",{ascending:false}),
              client.from("clubs").select("id,name,afrn_club_id")
            ]);
            if(error){out.innerHTML=notice("bad","❌ Imeshindikana kusoma maombi",esc(error.message));return;}
            const cmap=Object.fromEntries((clubs||[]).map(c=>[c.id,c]));
            if(!rows?.length){out.innerHTML=notice("","✅ Hakuna maombi mapya","Kwa sasa hakuna Player Registration Request inayosubiri approval.");return;}
            out.innerHTML=rows.map(p=>{const c=cmap[p.registration_requested_club_id]||{};return `<div style="border:1px solid #e4e9f0;border-radius:12px;padding:11px;margin-top:8px"><b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" "))}</b><div style="font-size:11px;color:#687386;margin:4px 0">${esc(p.player_id_number||"—")} · ${esc(p.nationality||"—")} · ${esc(p.position||"—")}<br>Ombi la klabu: <b>${esc(c.name||"—")}</b> · ${esc(p.registration_requested_at||"")}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="primary afrnApprovePlayer" data-player="${esc(p.id)}">✅ Approve</button><button type="button" class="danger afrnRejectPlayer" data-player="${esc(p.id)}">❌ Reject</button></div></div>`;}).join("");
            out.querySelectorAll(".afrnApprovePlayer").forEach(btn=>btn.addEventListener("click",async()=>{btn.disabled=true;const {error:e}=await client.rpc("afrn_decide_player_registration",{p_player_id:btn.dataset.player,p_approve:true,p_reason:null});btn.disabled=false;if(e){alert("❌ "+e.message);return;}loadApprovals();if(window.loadPlayers)window.loadPlayers();}));
            out.querySelectorAll(".afrnRejectPlayer").forEach(btn=>btn.addEventListener("click",async()=>{const reason=prompt("Sababu ya kukataa ombi hili:");if(!reason?.trim())return;btn.disabled=true;const {error:e}=await client.rpc("afrn_decide_player_registration",{p_player_id:btn.dataset.player,p_approve:false,p_reason:reason.trim()});btn.disabled=false;if(e){alert("❌ "+e.message);return;}loadApprovals();if(window.loadPlayers)window.loadPlayers();}));
          };
          loadApprovals();
        }
      }
    },700);
  };
  s.onerror=function(){console.error("AFRN original supabase-config haijapakiwa.");};
  document.head.appendChild(s);
})();

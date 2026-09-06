/* AFRN secure compatibility loader + same-club contract renewal UI */
const AFRN_SUPABASE_URL="https://jjqhvruppafpumcthmwe.supabase.co";
const AFRN_SUPABASE_KEY="sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G";
if(window.supabase && typeof window.supabase.createClient==="function" && !window.supabaseClient){window.supabaseClient=window.supabase.createClient(AFRN_SUPABASE_URL,AFRN_SUPABASE_KEY);}
(function(){
  const s=document.createElement("script");
  s.src="supabase-config-original.js";
  s.onload=function(){
    setTimeout(function(){
      if(!/transfers\.html$/i.test(location.pathname)) return;
      const client=window.supabaseClient;if(!client)return;
      const esc=v=>String(v??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
      const notice=(kind,title,body)=>`<div class="${kind==="ok"?"successNotice":kind==="bad"?"error":"notice"}" style="margin-top:10px"><b>${title}</b><br>${body}</div>`;
      const box=()=>document.getElementById("afrnEligibilityBox");
      async function identity(){const u=await client.auth.getUser();if(!u.data?.user)return null;const p=await client.from("profiles").select("id,role,club_id").eq("id",u.data.user.id).maybeSingle();return p.data||null;}
      async function sameClubRenew(playerId){
        const b=box();if(!b)return;
        const me=await identity();
        const {data:p,error:pe}=await client.from("players").select("id,player_id_number,first_name,middle_name,last_name,club_id,status").eq("id",playerId).maybeSingle();
        if(pe||!p){b.innerHTML=notice("bad","❌ Mchezaji hakupatikana",esc(pe?.message||"Player not found"));return;}
        if(!me?.club_id || String(p.club_id)!==String(me.club_id)) return;
        const [{data:club},{data:contracts,error:ce}]=await Promise.all([
          client.from("clubs").select("id,name,afrn_club_id").eq("id",p.club_id).maybeSingle(),
          client.from("player_contracts").select("id,start_date,end_date,status,contract_number,club_id").eq("player_id",p.id).eq("club_id",p.club_id).order("end_date",{ascending:false})
        ]);
        if(ce){b.innerHTML=notice("bad","❌ Imeshindikana kusoma mikataba",esc(ce.message));return;}
        const today=new Date().toISOString().slice(0,10);
        const active=(contracts||[]).find(c=>["ACTIVE","EXPIRING","EXPIRING SOON"].includes(String(c.status||"").toUpperCase())&&(!c.end_date||c.end_date>=today));
        if(!active){return;}
        const suggestedStart=active.end_date?new Date(new Date(active.end_date+"T00:00:00").getTime()+86400000).toISOString().slice(0,10):today;
        b.innerHTML=notice("ok","🟢 MZEE CHEZA WA KLABU YAKO — RENEW/ONGEZA MKATABA",`Mchezaji <b>${esc([p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" "))}</b> yupo <b>${esc(club?.name||"Klabu yako")}</b>.<br>Mkataba wa sasa: <b>${esc(active.contract_number||"—")}</b> · Unaisha: <b>${esc(active.end_date||"—")}</b><div class="grid" style="margin-top:10px"><div><label>Kuanzia mkataba mpya *</label><input id="afrnRenewStart" type="date" value="${esc(suggestedStart)}"></div><div><label>Kuishia *</label><input id="afrnRenewEnd" type="date"></div><div class="full"><label>Maelezo ya mkataba mpya</label><textarea id="afrnRenewNotes" placeholder="Masharti au maelezo ya renewal..."></textarea></div></div><div class="actions"><button type="button" class="btn success" id="afrnRenewBtn">📝 Ongeza/Renew Mkataba</button></div><div id="afrnRenewMsg"></div>`);
        document.getElementById("afrnRenewBtn")?.addEventListener("click",async()=>{
          const start=document.getElementById("afrnRenewStart")?.value;
          const end=document.getElementById("afrnRenewEnd")?.value;
          const notes=document.getElementById("afrnRenewNotes")?.value?.trim()||null;
          const msg=document.getElementById("afrnRenewMsg");
          if(!start||!end)return alert("⚠️ Weka tarehe ya kuanza na kumalizika kwa mkataba mpya.");
          if(end<start)return alert("⚠️ Tarehe ya mwisho haiwezi kuwa kabla ya tarehe ya kuanza.");
          const btn=document.getElementById("afrnRenewBtn");if(btn)btn.disabled=true;
          const {data,error}=await client.rpc("afrn_renew_player_contract",{p_player_id:p.id,p_club_id:p.club_id,p_start_date:start,p_end_date:end,p_contract_number:null,p_salary:null,p_contract_file_url:null,p_notes:notes,p_league_name:null});
          if(btn)btn.disabled=false;
          if(error){if(msg)msg.innerHTML=notice("bad","❌ Renewal haikukamilika",esc(error.message));return;}
          if(msg)msg.innerHTML=notice("ok","✅ Mkataba umeongezwa",`Mkataba mpya wa <b>${esc(data?.contract_number||"—")}</b> umehifadhiwa kwa ${esc(club?.name||"klabu hii")}. Hakuna Transfer Request iliyotengenezwa. AFRN Player ID bado ni <b>${esc(p.player_id_number||"—")}</b>.`);
        });
      }
      const bind=()=>{const sel=document.getElementById("playerId");if(!sel)return;if(sel.dataset.afrnRenewBound)return;sel.dataset.afrnRenewBound="1";sel.addEventListener("change",()=>sameClubRenew(sel.value));if(sel.value)sameClubRenew(sel.value);};
      [3500,4500,6000].forEach(ms=>setTimeout(bind,ms));
    },700);
  };
  s.onerror=function(){console.error("AFRN original supabase-config haijapakiwa.");};
  document.head.appendChild(s);
})();

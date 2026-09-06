/* =========================================================
   AFRN FOOTBALL MANAGEMENT - SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = "https://jjqhvruppafpumcthmwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("AFRN: Supabase library haijapakiwa.");
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  if (!Object.prototype.hasOwnProperty.call(Object.prototype, "afrn_player_id")) {
    Object.defineProperty(Object.prototype, "afrn_player_id", {
      configurable:true,
      enumerable:false,
      get(){ return this && Object.prototype.hasOwnProperty.call(this,"player_id_number") ? (this.player_id_number || null) : undefined; },
      set(value){ Object.defineProperty(this,"afrn_player_id",{value,writable:true,configurable:true,enumerable:true}); }
    });
  }
}

/* =========================================================
   OFFICIAL PLAYER LICENCE
========================================================= */
window.addEventListener("load", function(){
  setTimeout(function(){
    window.afrnGenerateLicenseById = async function(id){
      try{
        const client=window.supabaseClient;
        const {data:t,error}=await client.from("transfers").select("*").eq("id",id).maybeSingle();
        if(error) return alert("❌ Imeshindikana kusoma Transfer: "+error.message);
        if(!t) return alert("❌ Transfer haijapatikana.");

        const [pr,fr,tr]=await Promise.all([
          client.from("players").select("*").eq("id",t.player_id).maybeSingle(),
          client.from("clubs").select("*").eq("id",t.from_club_id).maybeSingle(),
          client.from("clubs").select("*").eq("id",t.to_club_id).maybeSingle()
        ]);
        const p=pr.data, from=fr.data, to=tr.data;
        if(!to) return alert("❌ Klabu ya sasa haijapatikana.");

        const meta=typeof window.readNotes==="function" ? window.readNotes(t.notes) : {};
        const registrationDate=t.transfer_date || new Date().toISOString().slice(0,10);
        const year=String(registrationDate).slice(0,4) || String(new Date().getFullYear());
        function teamCode(club){
          const explicit=String(club?.club_code||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
          if(explicit) return explicit.slice(0,8);
          const parts=String(club?.name||"TEAM").toUpperCase().trim().replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").split(" ").filter(Boolean);
          if(parts.length>1 && /^(D|AB|AEF|CD|GHI)\d+$/.test(parts[0])) parts.shift();
          if(!parts.length) return "TEAM";
          if(parts.length===1) return parts[0].slice(0,6);
          return parts.map(x=>x[0]).join("").slice(0,6);
        }
        const code=teamCode(to);
        const lr=await client.from("player_licenses").select("id,player_id,license_number,issue_date").eq("club_id",t.to_club_id).eq("season",year);
        let existing=null;
        if(!lr.error) existing=(lr.data||[]).find(x=>String(x.player_id)===String(t.player_id))||null;
        let registrationNo,licenseNumber;
        if(existing?.license_number){
          licenseNumber=existing.license_number;
          const m=String(licenseNumber).match(/^AFRN-\d{4}-[^-]+-(\d+)$/);
          registrationNo=m?String(m[1]).padStart(5,"0"):"";
        }else{
          let count=!lr.error?(lr.data||[]).length:0;
          if(lr.error){
            const fb=await client.from("transfers").select("id").eq("to_club_id",t.to_club_id).gte("transfer_date",`${year}-01-01`).lt("transfer_date",`${Number(year)+1}-01-01`).neq("status","CANCELLED");
            if(fb.error) return alert("❌ Imeshindikana kuhesabu usajili wa timu: "+fb.error.message);
            count=(fb.data||[]).length;
          }
          registrationNo=String(count+1).padStart(5,"0");
          licenseNumber=`AFRN-${year}-${code}-${registrationNo}`;
        }
        const licenseData={player_id:t.player_id,club_id:t.to_club_id,from_club_id:t.from_club_id,license_number:licenseNumber,season:year,registration_date:registrationDate,registration_type:t.transfer_type,loan_type:meta.loan_type||null,status:"ACTIVE",issue_date:existing?.issue_date||new Date().toISOString().slice(0,10),expiry_date:meta.contract_end||null,photo_url:p?.photo_url||p?.photo||null,notes:JSON.stringify({league:meta.league_name||null,loan_months:meta.loan_months||null,team_code:code,team_registration_no:registrationNo,generated_by:"AFRN Official Licence Numbering"})};
        if(!existing){
          const save=await client.from("player_licenses").insert(licenseData);
          if(save.error) console.warn("Licence haijahifadhiwa:",save.error.message);
        }
        if(typeof window.openLicense==="function") window.openLicense(licenseData,p,from,to,meta);
      }catch(e){ console.error(e); alert("❌ Hitilafu wakati wa kutengeneza Licence: "+e.message); }
    };

    document.querySelectorAll('button[onclick*="generateLicenseById"]').forEach(function(button){
      const m=button.getAttribute("onclick")?.match(/generateLicenseById\('([^']+)'\)/);
      if(!m) return;
      const id=m[1];
      button.onclick=function(e){e.preventDefault();window.afrnGenerateLicenseById(id);};
      button.removeAttribute("onclick");
    });
  },0);
});

/* =========================================================
   OFFICIAL CLUB ID DISPLAY
========================================================= */
window.addEventListener("load", function(){
  const client=window.supabaseClient;
  if(!client) return;
  let clubMap=new Map();
  async function loadIds(){
    const {data,error}=await client.from("clubs").select("id,afrn_club_id");
    if(error) return console.warn("AFRN Club ID:",error.message);
    clubMap=new Map((data||[]).filter(x=>x?.id).map(x=>[String(x.id),String(x.afrn_club_id||"").trim()]));
    replaceIds();
  }
  function replaceIds(){
    if(!clubMap.size) return;
    document.querySelectorAll(".team-id").forEach(el=>{
      const raw=String(el.textContent||"").replace(/^\s*(?:Club ID|ID)\s*:\s*/i,"").trim();
      const official=clubMap.get(raw);
      if(official) el.textContent="Club ID: "+official;
    });
  }
  loadIds();
  const observer=new MutationObserver(replaceIds);
  if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  [250,750,1500,3000,5000].forEach(d=>setTimeout(replaceIds,d));
});

/* =========================================================
   TRANSFER REQUEST + REJECTION + APPEAL WORKFLOW
   Uses existing public.transfers table. No new table.
========================================================= */
window.addEventListener("load", function(){
  if(!/transfers\.html$/i.test(location.pathname)) return;
  const client=window.supabaseClient;
  if(!client) return;

  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  let transferCache=[];
  let playerMap=new Map(), clubMap=new Map();

  function injectPanel(){
    if(document.getElementById("afrnTransferRequestsPanel")) return;
    const dashboard=document.getElementById("dashboard");
    if(!dashboard) return;
    const panel=document.createElement("div");
    panel.id="afrnTransferRequestsPanel";
    panel.className="panel";
    panel.innerHTML=`<h3>🔄 Transfer Requests & Appeals</h3>
      <div class="notice">Ombi jipya la uhamisho huenda kwenye klabu ambayo mchezaji anatoka. Klabu ya zamani ikikataa, <b>sababu ya kukataa ni lazima</b>. Klabu mpya inaweza kuomba mapitio (Appeal).</div>
      <div id="afrnTransferRequestsBody"><div class="empty">Inapakia...</div></div>`;
    const firstPanel=dashboard.querySelector(".panel");
    dashboard.insertBefore(panel,firstPanel||null);
  }

  async function loadData(){
    injectPanel();
    const [tr,pr,cr]=await Promise.all([
      client.from("transfers").select("*").order("created_at",{ascending:false}).limit(200),
      client.from("players").select("id,player_id_number,first_name,middle_name,last_name"),
      client.from("clubs").select("id,name,afrn_club_id")
    ]);
    if(tr.error){
      const box=document.getElementById("afrnTransferRequestsBody");
      if(box) box.innerHTML=`<div class="notice error">${esc(tr.error.message)}</div>`;
      return;
    }
    transferCache=tr.data||[];
    playerMap=new Map((pr.data||[]).map(p=>[String(p.id),p]));
    clubMap=new Map((cr.data||[]).map(c=>[String(c.id),c]));
    renderRequests();
    setDefaultPending();
  }

  function clubName(id){ const c=clubMap.get(String(id)); return c?.name || "—"; }
  function clubLabel(id){ const c=clubMap.get(String(id)); return c ? `${c.name}${c.afrn_club_id?` (${c.afrn_club_id})`:""}` : "—"; }
  function playerName(id){ const p=playerMap.get(String(id)); return p ? [p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" ") : "—"; }
  function playerId(id){ return playerMap.get(String(id))?.player_id_number || "—"; }
  function badge(status){
    const s=String(status||"PENDING").toUpperCase();
    const cls=s==="COMPLETED"?"badgeCompleted":s==="APPROVED"?"badgeApproved":s==="REJECTED"?"badgeCancelled":s==="CANCELLED"?"badgeCancelled":"badgePending";
    return `<span class="badge ${cls}">${esc(s)}</span>`;
  }

  function renderRequests(){
    const box=document.getElementById("afrnTransferRequestsBody");
    if(!box) return;
    const rows=transferCache.filter(t=>{
      const s=String(t.status||"").toUpperCase();
      return ["PENDING","REJECTED","APPROVED"].includes(s) || t.appeal_status;
    });
    if(!rows.length){ box.innerHTML='<div class="empty">Hakuna Transfer Request au Appeal kwa sasa.</div>'; return; }
    box.innerHTML=`<div class="wrap"><table><thead><tr><th>Mchezaji</th><th>Klabu Anayotoka</th><th>Klabu Mpya</th><th>Status</th><th>Sababu ya Kukataa</th><th>Appeal</th><th>Action</th></tr></thead><tbody>${rows.map(t=>{
      const s=String(t.status||"").toUpperCase();
      let action="";
      if(s==="PENDING") action=`<button class="btn success" onclick="window.afrnApproveTransfer('${t.id}')">✓ Kubali</button><button class="btn danger" onclick="window.afrnRejectTransfer('${t.id}')">✕ Kataa</button>`;
      if(s==="REJECTED" && !t.appeal_status) action=`<button class="btn warning" onclick="window.afrnAppealTransfer('${t.id}')">⚖ Omba Mapitio</button>`;
      if(s==="REJECTED" && t.appeal_status==="PENDING") action='<span class="muted">Appeal iko kwa AFRN Admin</span>';
      if(s==="REJECTED" && t.appeal_status==="APPROVED") action=`<button class="btn success" onclick="window.afrnCompleteAppeal('${t.id}')">✓ Kamilisha Transfer</button>`;
      return `<tr><td><b>${esc(playerName(t.player_id))}</b><br><small>${esc(playerId(t.player_id))}</small></td><td>${esc(clubLabel(t.from_club_id))}</td><td>${esc(clubLabel(t.to_club_id))}</td><td>${badge(s)}${t.appeal_status?`<br>${badge('APPEAL '+t.appeal_status)}`:""}</td><td>${esc(t.rejection_reason||"—")}</td><td>${esc(t.appeal_reason||"—")}${t.appeal_decision_reason?`<br><small><b>Uamuzi:</b> ${esc(t.appeal_decision_reason)}</small>`:""}</td><td>${action||"—"}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function setDefaultPending(){
    const status=document.getElementById("transferStatus");
    if(status && !status.value) status.value="PENDING";
  }

  async function refresh(){
    const {data,error}=await client.from("transfers").select("*").order("created_at",{ascending:false}).limit(200);
    if(!error){transferCache=data||[];renderRequests();}
  }

  window.afrnApproveTransfer=async function(id){
    if(!confirm("Unathibitisha kukubali ombi hili la uhamisho?")) return;
    const {error}=await client.from("transfers").update({status:"APPROVED",rejection_reason:null,rejected_at:null,rejected_by:null}).eq("id",id);
    if(error) return alert("❌ Imeshindikana kukubali: "+error.message);
    alert("✅ Transfer request imekubaliwa."); await refresh();
  };

  window.afrnRejectTransfer=async function(id){
    const reason=prompt("Andika sababu ya kukataa ombi la uhamisho. Hii ni lazima:");
    if(reason===null) return;
    const clean=reason.trim();
    if(!clean) return alert("⚠️ Lazima uandike sababu ya kukataa.");
    const {error}=await client.from("transfers").update({status:"REJECTED",rejection_reason:clean,rejected_at:new Date().toISOString()}).eq("id",id);
    if(error) return alert("❌ Imeshindikana kukataa: "+error.message);
    alert("🔴 Ombi limekataliwa na sababu imehifadhiwa."); await refresh();
  };

  window.afrnAppealTransfer=async function(id){
    const reason=prompt("Andika sababu ya kuomba mapitio (Appeal):");
    if(reason===null) return;
    const clean=reason.trim();
    if(!clean) return alert("⚠️ Lazima uandike sababu ya Appeal.");
    const {error}=await client.from("transfers").update({appeal_reason:clean,appeal_status:"PENDING",appeal_submitted_at:new Date().toISOString()}).eq("id",id);
    if(error) return alert("❌ Imeshindikana kutuma Appeal: "+error.message);
    alert("⚖ Appeal imetumwa kwa AFRN Admin."); await refresh();
  };

  window.afrnCompleteAppeal=async function(id){
    if(!confirm("AFRN Admin ameruhusu Appeal. Kamilisha uhamisho sasa?")) return;
    const {error}=await client.from("transfers").update({status:"APPROVED",appeal_decided_at:new Date().toISOString()}).eq("id",id);
    if(error) return alert("❌ Imeshindikana: "+error.message);
    alert("✅ Transfer imewekwa APPROVED baada ya Appeal."); await refresh();
  };

  injectPanel();
  setTimeout(loadData,250);
  [1500,4000,8000].forEach(d=>setTimeout(refresh,d));
});
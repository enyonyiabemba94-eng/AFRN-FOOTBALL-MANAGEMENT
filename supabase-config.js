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
      configurable:true, enumerable:false,
      get(){ return this && Object.prototype.hasOwnProperty.call(this,"player_id_number") ? (this.player_id_number || null) : undefined; },
      set(value){ Object.defineProperty(this,"afrn_player_id",{value,writable:true,configurable:true,enumerable:true}); }
    });
  }
}

/* Existing AFRN licence, club-ID and transfer/eligibility logic remains active below. */
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
        const p=pr.data,from=fr.data,to=tr.data;
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
        if(!existing){ const save=await client.from("player_licenses").insert(licenseData); if(save.error) console.warn("Licence haijahifadhiwa:",save.error.message); }
        if(typeof window.openLicense==="function") window.openLicense(licenseData,p,from,to,meta);
      }catch(e){ console.error(e); alert("❌ Hitilafu wakati wa kutengeneza Licence: "+e.message); }
    };
    document.querySelectorAll('button[onclick*="generateLicenseById"]').forEach(function(button){
      const m=button.getAttribute("onclick")?.match(/generateLicenseById\('([^']+)'\)/);
      if(!m) return;
      const id=m[1]; button.onclick=function(e){e.preventDefault();window.afrnGenerateLicenseById(id);}; button.removeAttribute("onclick");
    });
  },0);
});

window.addEventListener("load", function(){
  const client=window.supabaseClient; if(!client) return;
  let clubMap=new Map();
  async function loadIds(){
    const {data,error}=await client.from("clubs").select("id,afrn_club_id");
    if(error) return;
    clubMap=new Map((data||[]).filter(x=>x?.id).map(x=>[String(x.id),String(x.afrn_club_id||"").trim()])); replaceIds();
  }
  function replaceIds(){
    if(!clubMap.size) return;
    document.querySelectorAll(".team-id").forEach(el=>{
      const raw=String(el.textContent||"").replace(/^\s*(?:Club ID|ID)\s*:\s*/i,"").trim();
      const official=clubMap.get(raw); if(official) el.textContent="Club ID: "+official;
    });
  }
  loadIds();
  const observer=new MutationObserver(replaceIds);
  if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  [250,750,1500,3000,5000].forEach(d=>setTimeout(replaceIds,d));
});

/* =========================================================
   TRANSFER WORKFLOW
   Club-specific request inbox + mandatory rejection + appeal + AFRN admin decision.
   No new table. Uses existing public.transfers columns.
========================================================= */
window.addEventListener("load", function(){
  if(!/transfers\.html$/i.test(location.pathname)) return;
  const client=window.supabaseClient; if(!client) return;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  let rows=[], players=new Map(), clubs=new Map(), me=null, profile=null;

  const adminRole=r=>["admin","administrator","afrn_admin","super_admin","superadmin","secretary_general"].includes(String(r||"").toLowerCase().replace(/[ -]/g,"_"));
  const roleOf=p=>p?.role||p?.user_role||p?.account_role||p?.type||"";
  const profileClub=p=>p?.club_id||p?.clubId||p?.club_id_uuid||null;
  const cname=id=>{const c=clubs.get(String(id));return c?`${c.name}${c.afrn_club_id?` (${c.afrn_club_id})`:""}`:"—"};
  const pname=id=>{const p=players.get(String(id));return p?[p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" "):"—"};
  const pid=id=>players.get(String(id))?.player_id_number||"—";
  const statusBadge=s=>{s=String(s||"PENDING").toUpperCase();return `<span class="badge ${s==="COMPLETED"?"badgeCompleted":s==="APPROVED"?"badgeApproved":s==="REJECTED"?"badgeCancelled":"badgePending"}">${esc(s)}</span>`};

  async function getIdentity(){
    const auth=await client.auth.getUser();
    me=auth?.data?.user||null;
    profile=null;
    if(me){
      const r=await client.from("profiles").select("*").eq("id",me.id).maybeSingle();
      profile=r.data||null;
    }
  }

  function scope(){
    const role=roleOf(profile), pc=profileClub(profile);
    if(adminRole(role)) return rows;
    if(!pc) return [];
    return rows.filter(t=>String(t.from_club_id)===String(pc)||String(t.to_club_id)===String(pc));
  }

  function canOldClub(t){ return !adminRole(roleOf(profile)) && profileClub(profile) && String(profileClub(profile))===String(t.from_club_id); }
  function canNewClub(t){ return !adminRole(roleOf(profile)) && profileClub(profile) && String(profileClub(profile))===String(t.to_club_id); }
  function isAdmin(){ return adminRole(roleOf(profile)); }

  function inject(){
    if(document.getElementById("afrnTransferRequestsPanelSecure")) return;
    const dashboard=document.getElementById("dashboard"); if(!dashboard) return;
    const panel=document.createElement("div"); panel.id="afrnTransferRequestsPanelSecure"; panel.className="panel";
    panel.innerHTML=`<h3>🔄 Transfer Requests & Appeals</h3><div id="afrnTransferIdentity" class="notice">Inapakia akaunti na ruhusa...</div><div id="afrnTransferRequestsSecureBody"><div class="empty">Inapakia...</div></div>`;
    dashboard.insertBefore(panel,dashboard.querySelector(".panel")||null);
  }

  function render(){
    const ib=document.getElementById("afrnTransferIdentity"),box=document.getElementById("afrnTransferRequestsSecureBody"); if(!box)return;
    const role=roleOf(profile),pc=profileClub(profile);
    if(!me){ib.innerHTML="🔴 Hujalogin. Transfer requests haziwezi kusimamiwa.";box.innerHTML="";return;}
    if(!isAdmin()&&!pc){ib.innerHTML="🟠 Akaunti yako haijaunganishwa na klabu. Admin pekee ndiye anaweza kuona maombi yote hadi club_id ya akaunti iwekwe.";box.innerHTML='<div class="empty">Hakuna maombi yanayoonyeshwa kwa akaunti hii.</div>';return;}
    ib.innerHTML=isAdmin()?"🛡️ AFRN ADMIN — Unaona Transfer Requests na Appeals zote.":`🏟️ ${esc(cname(pc))} — Unaona maombi yanayohusu klabu yako.`;
    const list=scope().filter(t=>{
      const s=String(t.status||"").toUpperCase();
      return ["PENDING","REJECTED","APPROVED","COMPLETED"].includes(s)||!!t.appeal_status;
    });
    if(!list.length){box.innerHTML='<div class="empty">Hakuna Transfer Request/Appeal kwa sasa.</div>';return;}
    box.innerHTML=`<div class="wrap"><table><thead><tr><th>Mchezaji</th><th>Anatoka</th><th>Anakwenda</th><th>Status</th><th>Sababu / Appeal</th><th>Hatua</th></tr></thead><tbody>${list.map(t=>{
      const s=String(t.status||"PENDING").toUpperCase(), a=String(t.appeal_status||"").toUpperCase(); let actions=[];
      if(s==="PENDING"&&canOldClub(t)) actions.push(`<button class="btn success" onclick="window.afrnSecureApprove('${t.id}')">✓ Kubali</button>`,`<button class="btn danger" onclick="window.afrnSecureReject('${t.id}')">✕ Kataa</button>`);
      if(s==="REJECTED"&&canNewClub(t)&&!a) actions.push(`<button class="btn warning" onclick="window.afrnSecureAppeal('${t.id}')">⚖ Appeal</button>`);
      if(s==="REJECTED"&&a==="PENDING"&&isAdmin()) actions.push(`<button class="btn primary" onclick="window.afrnSecureDecideAppeal('${t.id}','APPROVED')">✓ Kubali Appeal</button>`,`<button class="btn danger" onclick="window.afrnSecureDecideAppeal('${t.id}','REJECTED')">✕ Kataa Appeal</button>`);
      if((s==="APPROVED"||s==="REJECTED"&&a==="APPROVED")&&isAdmin()) actions.push(`<button class="btn success" onclick="window.afrnSecureComplete('${t.id}')">✓ Kamilisha Transfer</button>`);
      const reason=[t.rejection_reason?`<b>Kukataa:</b> ${esc(t.rejection_reason)}`:"",t.appeal_reason?`<b>Appeal:</b> ${esc(t.appeal_reason)}`:"",t.appeal_decision_reason?`<b>Uamuzi:</b> ${esc(t.appeal_decision_reason)}`:""].filter(Boolean).join("<br>")||"—";
      return `<tr><td><b>${esc(pname(t.player_id))}</b><br><small>${esc(pid(t.player_id))}</small></td><td>${esc(cname(t.from_club_id))}</td><td>${esc(cname(t.to_club_id))}</td><td>${statusBadge(s)}${a?`<br>${statusBadge("APPEAL "+a)}`:""}</td><td>${reason}</td><td>${actions.join(" ")||"—"}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  async function reload(){
    const [tr,pr,cr]=await Promise.all([
      client.from("transfers").select("*").order("created_at",{ascending:false}).limit(300),
      client.from("players").select("id,player_id_number,first_name,middle_name,last_name"),
      client.from("clubs").select("id,name,afrn_club_id")
    ]);
    if(tr.error){const b=document.getElementById("afrnTransferRequestsSecureBody");if(b)b.innerHTML=`<div class="notice error">${esc(tr.error.message)}</div>`;return;}
    rows=tr.data||[];players=new Map((pr.data||[]).map(x=>[String(x.id),x]));clubs=new Map((cr.data||[]).map(x=>[String(x.id),x]));render();
  }

  window.afrnSecureApprove=async function(id){
    const t=rows.find(x=>String(x.id)===String(id)); if(!t)return;
    if(!canOldClub(t)) return alert("⛔ Ni klabu ya zamani pekee inayoruhusiwa kukubali ombi hili.");
    if(!confirm(`Kubali Transfer Request ya ${pname(t.player_id)}?`))return;
    const {error}=await client.from("transfers").update({status:"APPROVED",rejection_reason:null,rejected_at:null,rejected_by:null}).eq("id",id).eq("status","PENDING");
    if(error)return alert("❌ "+error.message);alert("✅ Transfer Request imekubaliwa. Hatua inayofuata ni AFRN Admin kukamilisha transfer.");await reload();
  };

  window.afrnSecureReject=async function(id){
    const t=rows.find(x=>String(x.id)===String(id));if(!t)return;
    if(!canOldClub(t))return alert("⛔ Ni klabu ya zamani pekee inayoruhusiwa kukataa ombi hili.");
    const reason=prompt("Sababu ya kukataa Transfer Request (LAZIMA):");if(reason===null)return;
    const clean=reason.trim();if(!clean)return alert("⚠️ Sababu ya kukataa haiwezi kuwa tupu.");
    const {error}=await client.from("transfers").update({status:"REJECTED",rejection_reason:clean,rejected_at:new Date().toISOString()}).eq("id",id).eq("status","PENDING");
    if(error)return alert("❌ "+error.message);alert("🔴 Ombi limekataliwa na sababu imehifadhiwa.");await reload();
  };

  window.afrnSecureAppeal=async function(id){
    const t=rows.find(x=>String(x.id)===String(id));if(!t)return;
    if(!canNewClub(t))return alert("⛔ Appeal inaweza kutumwa na klabu mpya pekee.");
    if(String(t.status).toUpperCase()!=="REJECTED")return alert("⚠️ Appeal inaruhusiwa baada ya kukataliwa.");
    const reason=prompt("Sababu ya Appeal (LAZIMA):");if(reason===null)return;
    const clean=reason.trim();if(!clean)return alert("⚠️ Sababu ya Appeal haiwezi kuwa tupu.");
    const {error}=await client.from("transfers").update({appeal_reason:clean,appeal_status:"PENDING",appeal_submitted_at:new Date().toISOString(),appeal_decided_at:null,appeal_decision_reason:null}).eq("id",id).eq("status","REJECTED");
    if(error)return alert("❌ "+error.message);alert("⚖️ Appeal imetumwa kwa AFRN Admin.");await reload();
  };

  window.afrnSecureDecideAppeal=async function(id,decision){
    const t=rows.find(x=>String(x.id)===String(id));if(!t)return;
    if(!isAdmin())return alert("⛔ AFRN Admin pekee ndiye anaweza kuamua Appeal.");
    if(String(t.appeal_status).toUpperCase()!=="PENDING")return alert("⚠️ Appeal hii si PENDING.");
    const promptText=decision==="REJECTED"?"Sababu ya AFRN Admin kukataa Appeal (LAZIMA):":"Maelezo ya uamuzi wa AFRN Admin (andika sababu/maelezo):";
    const reason=prompt(promptText);if(reason===null)return;const clean=reason.trim();if(!clean)return alert("⚠️ Lazima uandike maelezo ya uamuzi.");
    const {error}=await client.from("transfers").update({appeal_status:decision,appeal_decided_at:new Date().toISOString(),appeal_decision_reason:clean}).eq("id",id).eq("appeal_status","PENDING");
    if(error)return alert("❌ "+error.message);alert(decision==="APPROVED"?"✅ Appeal imekubaliwa. Transfer iko tayari kukamilishwa na AFRN Admin.":"🔴 Appeal imekataliwa.");await reload();
  };

  window.afrnSecureComplete=async function(id){
    const t=rows.find(x=>String(x.id)===String(id));if(!t)return;
    if(!isAdmin())return alert("⛔ AFRN Admin pekee ndiye anaweza kukamilisha Transfer.");
    const s=String(t.status||"").toUpperCase(),a=String(t.appeal_status||"").toUpperCase();
    if(s!=="APPROVED"&&!(s==="REJECTED"&&a==="APPROVED"))return alert("⚠️ Transfer haijawa tayari kukamilishwa.");
    if(!confirm(`Kamilisha Transfer ya ${pname(t.player_id)}? Hii itawasha mkataba mpya kupitia mfumo uliopo na kuhamisha mchezaji kwenye klabu mpya.`))return;
    const {error}=await client.from("transfers").update({status:"COMPLETED"}).eq("id",id).in("status",["APPROVED","REJECTED"]);
    if(error)return alert("❌ Imeshindikana kukamilisha: "+error.message);
    alert("✅ Transfer imekamilika. Mkataba mpya utaunganishwa na Transfer na Player ID ya kudumu itaendelea kutumika. Sasa unaweza kutengeneza Licence rasmi.");await reload();
  };

  inject();
  (async()=>{await getIdentity();await reload();})();
  setInterval(reload,15000);
});

/* =========================================================
   PLAYER ELIGIBILITY + AUTOMATIC TRANSFER REQUEST
========================================================= */
window.addEventListener("load", function(){
  if(!/transfers\.html$/i.test(location.pathname)) return;
  const client=window.supabaseClient;if(!client)return;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  function noticeHtml(kind,title,body){const cls=kind==="ok"?"successNotice":kind==="bad"?"error":"notice";return `<div class="${cls}" style="margin-top:10px"><b>${title}</b><br>${body}</div>`;}
  function injectEligibilityBox(){if(document.getElementById("afrnEligibilityBox"))return;const select=document.getElementById("playerId");if(!select)return;const box=document.createElement("div");box.id="afrnEligibilityBox";select.parentNode.appendChild(box);}
  async function verifyPlayer(playerId){
    injectEligibilityBox();const box=document.getElementById("afrnEligibilityBox");if(!box)return;if(!playerId){box.innerHTML="";return;}
    box.innerHTML=noticeHtml("info","⏳ Inathibitisha hali ya mchezaji...","Inakagua klabu, mkataba na historia ya transfer.");
    const {data:p,error:pe}=await client.from("players").select("id,player_id_number,first_name,middle_name,last_name,club_id,status").eq("id",playerId).maybeSingle();
    if(pe||!p){box.innerHTML=noticeHtml("bad","❌ Mchezaji hakupatikana",esc(pe?.message||"Player not found"));return;}
    const {data:contracts,error:ce}=await client.from("player_contracts").select("id,club_id,start_date,end_date,status,contract_number,transfer_id").eq("player_id",playerId).order("end_date",{ascending:false});
    if(ce){box.innerHTML=noticeHtml("bad","❌ Imeshindikana kukagua mikataba",esc(ce.message));return;}
    const today=new Date().toISOString().slice(0,10);
    const active=(contracts||[]).find(c=>["ACTIVE","EXPIRING","EXPIRING SOON"].includes(String(c.status||"").toUpperCase())&&(!c.end_date||c.end_date>=today))||(contracts||[]).find(c=>c.start_date&&c.start_date<=today&&c.end_date&&c.end_date>=today);
    const {data:club}=p.club_id?await client.from("clubs").select("id,name,afrn_club_id").eq("id",p.club_id).maybeSingle():{data:null};
    const currentClub=club?`${club.name}${club.afrn_club_id?` (${club.afrn_club_id})`:""}`:null;
    const {data:pendingTransfers}=await client.from("transfers").select("id,status,from_club_id,to_club_id,appeal_status").eq("player_id",playerId).in("status",["PENDING","APPROVED"]);
    if(active){
      box.innerHTML=noticeHtml("bad","🔴 HAFAI KUSAJILIWA MOJA KWA MOJA",`Mchezaji ana mkataba unaoendelea${active.end_date?` hadi <b>${esc(active.end_date)}</b>`:""}. Klabu: <b>${esc(currentClub||"haijulikani")}</b>.<br><small>Hatua inayofuata: omba Transfer kwa klabu hiyo.</small><div class="actions"><button type="button" class="btn primary" id="afrnSendRequestBtn">🔄 Tuma Transfer Request</button></div>`);
      document.getElementById("afrnSendRequestBtn")?.addEventListener("click",()=>sendRequest(p,club,active));return;
    }
    if((pendingTransfers||[]).length){box.innerHTML=noticeHtml("info","🟡 OMBI LA TRANSFER LIPO","Mchezaji tayari ana Transfer Request inayosubiri uamuzi. Usitume ombi jingine.");return;}
    if(!p.club_id){box.innerHTML=noticeHtml("ok","🟢 FREE AGENT — ANARUHUSIWA KUSAJILIWA","Hakuna klabu ya sasa na hakuna mkataba unaoendelea. Unaweza kuendelea na usajili mpya.");return;}
    box.innerHTML=noticeHtml("info","🟠 INAHITAJI UTHIBITISHO",`Mchezaji ana klabu ya sasa (<b>${esc(currentClub||"haijulikani")}</b>) lakini hakuna mkataba unaoendelea uliothibitishwa. AFRN Admin akague historia kabla ya usajili.`);
  }
  async function sendRequest(p,fromClub,activeContract){
    const toClubId=document.getElementById("toClub")?.value;if(!toClubId)return alert("⚠️ Kwanza chagua Klabu Mpya.");
    if(!fromClub?.id)return alert("❌ Klabu ya mchezaji haijapatikana kwenye database.");
    if(String(fromClub.id)===String(toClubId))return alert("⚠️ Klabu mpya ni sawa na klabu ya sasa.");
    const {data:existing}=await client.from("transfers").select("id,status").eq("player_id",p.id).eq("to_club_id",toClubId).in("status",["PENDING","APPROVED"]).limit(1);
    if(existing?.length)return alert("⚠️ Transfer Request ya mchezaji huyu kwenda klabu hiyo tayari ipo.");
    const transferDate=new Date().toISOString().slice(0,10);
    const payload={player_id:p.id,from_club_id:fromClub.id,to_club_id:toClubId,transfer_date:transferDate,transfer_type:"TRANSFER",status:"PENDING",contract_start_date:document.getElementById("contractStart")?.value||transferDate,contract_end_date:document.getElementById("contractEnd")?.value||null,notes:JSON.stringify({workflow:"TRANSFER_REQUEST",previous_contract_id:activeContract?.id||null,requested_by_club:toClubId})};
    const {error}=await client.from("transfers").insert(payload);if(error)return alert("❌ Transfer Request haikutumwa: "+error.message);
    alert("✅ Transfer Request imetumwa kwa klabu ambayo mchezaji anatoka. Klabu hiyo lazima ikubali au ikatae kwa sababu.");
  }
  function bind(){injectEligibilityBox();const select=document.getElementById("playerId");if(select){select.addEventListener("change",function(){verifyPlayer(this.value);});if(select.value)verifyPlayer(select.value);}}
  setTimeout(bind,300);setTimeout(bind,1200);setTimeout(bind,2500);
});

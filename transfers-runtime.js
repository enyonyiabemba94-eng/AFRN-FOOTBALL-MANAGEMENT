/* =========================================================
   AFRN FOOTBALL MANAGEMENT
   TRANSFER + CONTRACT + PLAYER LICENCE
========================================================= */

const db = window.supabaseClient;

const TRANSFER_TABLE = "transfers";
const LICENSE_TABLE = "player_licenses";

const LOGO = "IMG-20260319-WA0093.jpg";

let players = [];
let clubs = [];
let transfers = [];

let currentTransfer = null;
let editingId = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);

function escapeHTML(value){

    return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}

function today(){

    return new Date()
    .toISOString()
    .slice(0,10);

}

function playerName(p){

    if(!p) return "Mchezaji";

    return [
        p.first_name,
        p.middle_name,
        p.last_name
    ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Mchezaji";

}

function clubName(id){

    const c =
        clubs.find(
            x => String(x.id) === String(id)
        );

    return c?.name || "Klabu haijawekwa";

}

function getPlayer(id){

    return players.find(
        p => String(p.id) === String(id)
    );

}

function getClub(id){

    return clubs.find(
        c => String(c.id) === String(id)
    );

}

function statusBadge(status){

    const s =
        String(status || "DRAFT").toUpperCase();

    let cls = "badgeDraft";

    if(s === "PENDING")
        cls = "badgePending";

    if(s === "APPROVED")
        cls = "badgeApproved";

    if(s === "COMPLETED")
        cls = "badgeCompleted";

    if(s === "CANCELLED")
        cls = "badgeCancelled";

    return `
        <span class="badge ${cls}">
            ${escapeHTML(s)}
        </span>
    `;

}


/* =========================================================
   TAB
========================================================= */

function showTab(id,button){

    document
    .querySelectorAll(".tab")
    .forEach(
        x => x.classList.remove("active")
    );

    $(id).classList.add("active");

    document
    .querySelectorAll("nav button")
    .forEach(
        x => x.classList.remove("active")
    );

    if(button)
        button.classList.add("active");

    renderAll();

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text,type="notice"){

    const box = $("formMessage");

    box.className =
        type === "error"
        ? "notice error"
        : type === "success"
        ? "notice successNotice"
        : "notice";

    box.textContent = text;

}


/* =========================================================
   LOAD PLAYERS
========================================================= */

async function loadPlayers(){

    const {data,error} =
        await db
        .from("players")
        .select("*")
        .order("first_name",{ascending:true});

    if(error){

        console.error(error);

        showMessage(
            "❌ Imeshindikana kusoma Players: " +
            error.message,
            "error"
        );

        return;

    }

    players = data || [];

    const select = $("playerId");

    select.innerHTML = `
        <option value="">
            Chagua Mchezaji
        </option>
    `;

    players.forEach(p => {

        const option =
            document.createElement("option");

        option.value = p.id;

        option.textContent =
            `${playerName(p)}${
                p.afrn_player_id
                ? " — " + p.afrn_player_id
                : ""
            }`;

        select.appendChild(option);

    });

}


/* =========================================================
   LOAD CLUBS
========================================================= */

async function loadClubs(){

    const {data,error} =
        await db
        .from("clubs")
        .select("*")
        .order("name",{ascending:true});

    if(error){

        console.error(error);

        showMessage(
            "❌ Imeshindikana kusoma Clubs: " +
            error.message,
            "error"
        );

        return;

    }

    clubs = data || [];

    const select = $("toClub");

    select.innerHTML = `
        <option value="">
            Chagua Klabu Mpya
        </option>
    `;

    clubs.forEach(c => {

        const option =
            document.createElement("option");

        option.value = c.id;
        option.textContent = c.name;

        select.appendChild(option);

    });

}


/* =========================================================
   LOAD TRANSFERS
========================================================= */

async function loadTransfers(){

    const {data,error} =
        await db
        .from(TRANSFER_TABLE)
        .select("*")
        .order("created_at",{ascending:false});

    if(error){

        console.error(error);

        showMessage(
            "❌ Imeshindikana kusoma Transfers: " +
            error.message,
            "error"
        );

        return;

    }

    transfers = data || [];

    renderAll();

}


/* =========================================================
   PLAYER SELECTED
========================================================= */

function playerSelected(){

    const id = $("playerId").value;

    const p = getPlayer(id);

    if(!p){

        clearPlayerPreview();

        return;

    }

    const currentClub =
        getClub(p.club_id);

    $("playerIdText").value =
        p.afrn_player_id ||
        p.player_id ||
        p.id ||
        "";

    $("playerName").value =
        playerName(p);

    $("dob").value =
        p.date_of_birth || "";

    $("nationality").value =
        p.nationality || "";

    $("position").value =
        p.position || "";

    $("fromClub").value =
        currentClub?.name ||
        "Klabu haijawekwa";

    $("previewName").textContent =
        playerName(p);

    $("previewId").textContent =
        "AFRN Player ID: " +
        (
            p.afrn_player_id ||
            p.player_id ||
            p.id ||
            "-"
        );

    $("previewPosition").textContent =
        "Nafasi: " +
        (p.position || "-");

    $("previewCurrentClub").textContent =
        "⚽ Klabu ya sasa: " +
        (currentClub?.name || "Haijawekwa");

    const photo =
        p.photo_url ||
        p.photo ||
        "";

    $("playerPhoto").src =
        photo || placeholderPhoto();

    $("playerPreview").style.display =
        "block";

    [...$("toClub").options].forEach(option => {

        if(!option.value){

            option.disabled = false;

            return;

        }

        option.disabled =
            String(option.value) ===
            String(p.club_id);

    });

    validateTransfer();

}


/* =========================================================
   PLACEHOLDER
========================================================= */

function placeholderPhoto(){

    return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="200"
             height="240">

            <rect
                width="100%"
                height="100%"
                fill="#edf1f5"/>

            <text
                x="50%"
                y="52%"
                text-anchor="middle"
                font-size="70">
                👤
            </text>

        </svg>
    `);

}


/* =========================================================
   CLEAR PLAYER
========================================================= */

function clearPlayerPreview(){

    $("playerPreview").style.display =
        "none";

    $("playerIdText").value = "";
    $("playerName").value = "";
    $("dob").value = "";
    $("nationality").value = "";
    $("position").value = "";
    $("fromClub").value = "";

}


/* =========================================================
   VALIDATION
========================================================= */

function validateTransfer(){

    const playerId =
        $("playerId").value;

    const toClub =
        $("toClub").value;

    const p =
        getPlayer(playerId);

    if(!p || !toClub)
        return true;

    if(
        String(p.club_id) ===
        String(toClub)
    ){

        showMessage(
            "❌ Klabu ya sasa haiwezi kuwa sawa na klabu mpya.",
            "error"
        );

        return false;

    }

    return true;

}


/* =========================================================
   TRANSFER TYPE
========================================================= */

function updateTransferTypeUI(){

    const type =
        $("transferType").value;

    const isLoan =
        type === "Loan Transfer";

    $("permanentContractBox")
    .classList.toggle(
        "hidden",
        isLoan
    );

    $("permanentContractEndBox")
    .classList.toggle(
        "hidden",
        isLoan
    );

    $("contractYearsBox")
    .classList.toggle(
        "hidden",
        isLoan
    );

    $("loanTypeBox")
    .classList.toggle(
        "hidden",
        !isLoan
    );

    if(!isLoan){

        $("loanMonthsBox")
        .classList.add("hidden");

        $("leagueNameBox")
        .classList.add("hidden");

        $("leagueReturnBox")
        .classList.add("hidden");

        return;

    }

    updateLoanTypeUI();

}


/* =========================================================
   LOAN TYPE
========================================================= */

function updateLoanTypeUI(){

    const type =
        $("loanType").value;

    const monthly =
        type === "MONTHLY";

    const league =
        type === "LEAGUE";

    $("loanMonthsBox")
    .classList.toggle(
        "hidden",
        !monthly
    );

    $("leagueNameBox")
    .classList.toggle(
        "hidden",
        !league
    );

    $("leagueReturnBox")
    .classList.toggle(
        "hidden",
        !league
    );

}


/* =========================================================
   CONTRACT YEARS
========================================================= */

function calculateYears(){

    const start =
        $("contractStart").value;

    const end =
        $("contractEnd").value;

    if(!start || !end)
        return;

    const s = new Date(start);
    const e = new Date(end);

    if(e <= s){

        $("contractYears").value = "";

        return;

    }

    const diff =
        e.getTime() -
        s.getTime();

    const years =
        diff /
        (
            365.25 *
            24 *
            60 *
            60 *
            1000
        );

    $("contractYears").value =
        years.toFixed(1);

}


/* =========================================================
   NOTES / METADATA
========================================================= */

function buildNotes(){

    const metadata = {

        agreement_notes:
            $("notes").value.trim(),

        contract_start:
            $("contractStart").value || null,

        contract_end:
            $("contractEnd").value || null,

        contract_years:
            $("contractYears").value || null,

        loan_type:
            $("loanType").value || null,

        loan_months:
            $("loanMonths").value || null,

        league_name:
            $("leagueName").value.trim() || null,

        leaders:{

            from_chairman:
                $("fromChairman").value.trim(),

            from_secretary:
                $("fromSecretary").value.trim(),

            to_chairman:
                $("toChairman").value.trim(),

            to_secretary:
                $("toSecretary").value.trim(),

            player_representative:
                $("playerRepresentative").value.trim(),

            federation_chairman:
                $("fedChairman").value.trim(),

            federation_secretary:
                $("fedSecretary").value.trim()

        }

    };

    return JSON.stringify(metadata);

}


function readNotes(raw){

    if(!raw){

        return {

            agreement_notes:"",
            leaders:{},
            loan_type:"",
            loan_months:"",
            league_name:"",
            contract_start:"",
            contract_end:"",
            contract_years:""

        };

    }

    try{

        const obj =
            JSON.parse(raw);

        return {

            agreement_notes:
                obj.agreement_notes || "",

            leaders:
                obj.leaders || {},

            loan_type:
                obj.loan_type || "",

            loan_months:
                obj.loan_months || "",

            league_name:
                obj.league_name || "",

            contract_start:
                obj.contract_start || "",

            contract_end:
                obj.contract_end || "",

            contract_years:
                obj.contract_years || ""

        };

    }catch(e){

        return {

            agreement_notes:String(raw),

            leaders:{},

            loan_type:"",

            loan_months:"",

            league_name:"",

            contract_start:"",

            contract_end:"",

            contract_years:""

        };

    }

}


/* =========================================================
   TRANSFER ID
========================================================= */

function generateTransferId(){

    const year =
        new Date().getFullYear();

    let max = 0;

    transfers.forEach(t => {

        const id =
            String(t.transfer_number || "");

        const match =
            id.match(/TR-(\d{4})-(\d+)/);

        if(
            match &&
            Number(match[1]) === year
        ){

            max =
                Math.max(
                    max,
                    Number(match[2])
                );

        }

    });

    return `TR-${year}-${String(max + 1).padStart(6,"0")}`;

}


/* =========================================================
   SAVE TRANSFER
========================================================= */

async function saveTransfer(){

    if(!db){

        showMessage(
            "❌ Supabase haijaunganishwa.",
            "error"
        );

        return;

    }

    const playerId =
        $("playerId").value;

    const toClub =
        $("toClub").value;

    const transferDate =
        $("transferDate").value;

    const transferType =
        $("transferType").value;

    const status =
        $("transferStatus").value;

    const p =
        getPlayer(playerId);

    if(!playerId){

        showMessage(
            "❌ Chagua mchezaji.",
            "error"
        );

        return;

    }

    if(!p){

        showMessage(
            "❌ Mchezaji hajapatikana.",
            "error"
        );

        return;

    }

    if(!p.club_id){

        showMessage(
            "❌ Mchezaji hana klabu ya sasa.",
            "error"
        );

        return;

    }

    if(!toClub){

        showMessage(
            "❌ Chagua Klabu ya Sasa.",
            "error"
        );

        return;

    }

    if(!transferDate){

        showMessage(
            "❌ Weka tarehe ya uhamisho.",
            "error"
        );

        return;

    }

    if(
        String(p.club_id) ===
        String(toClub)
    ){

        showMessage(
            "❌ Klabu Anayotoka na Klabu ya Sasa haziwezi kuwa sawa.",
            "error"
        );

        return;

    }

    if(!validateTransfer())
        return;


    /* LOAN */

    if(transferType === "Loan Transfer"){

        const loanType =
            $("loanType").value;

        if(!loanType){

            showMessage(
                "❌ Chagua aina ya mkopo.",
                "error"
            );

            return;

        }

        if(
            loanType === "MONTHLY" &&
            !$("loanMonths").value
        ){

            showMessage(
                "❌ Weka idadi ya miezi ya mkopo.",
                "error"
            );

            return;

        }

        if(
            loanType === "LEAGUE" &&
            !$("leagueName").value.trim()
        ){

            showMessage(
                "❌ Weka jina la ligi.",
                "error"
            );

            return;

        }

    }


    /* CONTRACT */

    if(transferType !== "Loan Transfer"){

        if(!$("contractStart").value){

            showMessage(
                "❌ Weka Contract Start.",
                "error"
            );

            return;

        }

        if(!$("contractEnd").value){

            showMessage(
                "❌ Weka Contract End.",
                "error"
            );

            return;

        }

        if(
            $("contractEnd").value <
            $("contractStart").value
        ){

            showMessage(
                "❌ Contract End haiwezi kuwa kabla ya Contract Start.",
                "error"
            );

            return;

        }

    }


    /* LEADERS */

    const requiredLeaders = [

        $("fromChairman").value.trim(),
        $("fromSecretary").value.trim(),
        $("toChairman").value.trim(),
        $("toSecretary").value.trim(),
        $("playerRepresentative").value.trim(),
        $("fedChairman").value.trim(),
        $("fedSecretary").value.trim()

    ];

    if(requiredLeaders.some(x => !x)){

        showMessage(
            "❌ Jaza majina yote ya viongozi.",
            "error"
        );

        return;

    }


    let transferNumber =
        editingId
        ?
        transfers.find(
            t =>
            String(t.id) ===
            String(editingId)
        )?.transfer_number
        :
        generateTransferId();


    const payload = {

        player_id:
            playerId,

        from_club_id:
            p.club_id,

        to_club_id:
            toClub,

        transfer_date:
            transferDate,

        transfer_number:
            transferNumber,

        status:
            status,

        document_url:
            null,

        notes:
            buildNotes(),

        transfer_type:
            transferType,

        loan_end_date:
            null

    };


    showMessage(
        editingId
        ? "⏳ Inasasisha Transfer..."
        : "⏳ Inahifadhi Transfer...",
        "notice"
    );


    let result;


    if(editingId){

        result =
            await db
            .from(TRANSFER_TABLE)
            .update(payload)
            .eq("id",editingId)
            .select()
            .single();

    }else{

        result =
            await db
            .from(TRANSFER_TABLE)
            .insert(payload)
            .select()
            .single();

    }


    if(result.error){

        console.error(result.error);

        showMessage(
            "❌ Imeshindikana kuhifadhi: " +
            result.error.message,
            "error"
        );

        return;

    }


    currentTransfer =
        result.data;

    editingId =
        result.data.id;


    await loadTransfers();


    /* UPDATE PLAYER WHEN COMPLETED */

    if(
        String(status).toUpperCase() ===
        "COMPLETED"
    ){

        const updatePlayer =
            await db
            .from("players")
            .update({
                club_id:toClub
            })
            .eq("id",playerId);

        if(updatePlayer.error){

            console.warn(
                "Transfer saved but player club was not updated:",
                updatePlayer.error
            );

        }else{

            await loadPlayers();

        }

    }


    showMessage(
        "✅ Transfer imehifadhiwa kikamilifu.",
        "success"
    );

    openContract(result.data);

}


/* =========================================================
   CONTRACT
========================================================= */

function openContract(t){

    currentTransfer = t;

    const p =
        getPlayer(t.player_id);

    const from =
        getClub(t.from_club_id);

    const to =
        getClub(t.to_club_id);

    const meta =
        readNotes(t.notes);

    $("contractPaper").innerHTML =
        agreementHTML(
            t,
            p,
            from,
            to,
            meta
        );

    $("contractModal")
    .classList.add("show");

}


/* =========================================================
   CONTRACT PAPER
========================================================= */

function agreementHTML(
    t,
    p,
    from,
    to,
    meta
){

    const v =
        value =>
        escapeHTML(
            value ||
            "________________"
        );


    const photo =
        p?.photo_url ||
        p?.photo ||
        "";


    const leaders =
        meta.leaders || {};


    const playerId =
        p?.afrn_player_id ||
        p?.player_id ||
        p?.id ||
        "";


    const isLoan =
        t.transfer_type ===
        "Loan Transfer";


    let transferDescription =
        "Uhamisho wa Kudumu";


    if(t.transfer_type === "Free Transfer")
        transferDescription =
            "Uhamisho wa Bure";


    if(t.transfer_type === "Return from Loan")
        transferDescription =
            "Kurudi kutoka Mkopo";


    if(isLoan)
        transferDescription =
            "Uhamisho wa Mkopo";


    let loanDescription = "";


    if(isLoan){

        if(meta.loan_type === "LEAGUE"){

            loanDescription =
                `Mkopo wa Ligi: ${v(meta.league_name)}.
                 Mchezaji atarejea mwisho wa ligi.`;

        }else if(meta.loan_type === "MONTHLY"){

            loanDescription =
                `Mkopo wa ${v(meta.loan_months)} miezi.
                 Mchezaji atarejea baada ya kumalizika kwa kipindi cha mkopo.`;

        }

    }


    const contractStart =
        meta.contract_start ||
        t.transfer_date ||
        "";

    const contractEnd =
        meta.contract_end ||
        "";

    const contractYears =
        meta.contract_years ||
        "";


    return `

<div class="a4">

<!-- HEADER -->

<div class="a4head">

<img
    src="${LOGO}"
    alt="AFRN Logo"
>

<strong>
AFRN FOOTBALL MANAGEMENT
</strong>

<span>
SHIRIKISHO LA MPIRA WA MIGUU KAMBINI NYARUGUSU
</span>

<span>
Association / Football Federation for Refugees in Nyarugusu
</span>

</div>


<!-- TITLE -->

<div class="a4Title">

<h2>
MAKUBALIANO YA UHAMISHO WA MCHEZAJI
</h2>

<p>
PLAYER TRANSFER AGREEMENT
</p>

</div>


<div class="a4TransferId">

TRANSFER ID:
<strong>${v(t.transfer_number)}</strong>

&nbsp; | &nbsp;

TAREHE:
<strong>${v(t.transfer_date)}</strong>

</div>


<!-- 01 PLAYER -->

<div class="sec">

<div class="secTitle">
01 — TAARIFA ZA MCHEZAJI
</div>

<div class="playerGrid">

<img
    class="pimg"
    src="${escapeHTML(photo || placeholderPhoto())}"
    alt="Picha ya Mchezaji"
>

<div class="playerInfo">

<b>AFRN PLAYER ID:</b>
${v(playerId)}
<br>

<b>JINA KAMILI:</b>
${v(playerName(p))}
<br>

<b>TAREHE YA KUZALIWA:</b>
${v(p?.date_of_birth)}
<br>

<b>NATIONALITY:</b>
${v(p?.nationality)}
<br>

<b>NAFASI:</b>
${v(p?.position)}
<br>

<b>KLABU ANAYOTOKA:</b>
${v(from?.name)}
<br>

<b>KLABU YA SASA:</b>
${v(to?.name)}

</div>

</div>

</div>


<!-- 02 TRANSFER -->

<div class="sec">

<div class="secTitle">
02 — AINA YA UHAMISHO NA MKATABA
</div>

<table class="a4Table">

<tr>

<th style="width:28%">
Aina ya Uhamisho
</th>

<th style="width:20%">
Tarehe
</th>

<th>
Muda / Masharti
</th>

</tr>

<tr>

<td>
${v(transferDescription)}
</td>

<td>
${v(t.transfer_date)}
</td>

<td>

${
isLoan
?
v(loanDescription)
:
`
<b>Contract Start:</b>
${v(contractStart)}
<br>

<b>Contract End:</b>
${v(contractEnd)}
<br>

<b>Muda wa Mkataba:</b>
${v(contractYears)} Miaka
`
}

</td>

</tr>

</table>

</div>


<!-- 03 AGREEMENT -->

<div class="sec">

<div class="secTitle">
03 — MAKUBALIANO YA PANDE ZOTE
</div>

<div class="agreement">

Mchezaji
<b>${v(playerName(p))}</b>
anakubali kujiunga na klabu ya
<b>${v(to?.name)}</b>
kutoka klabu ya
<b>${v(from?.name)}</b>.

<br><br>

Pande zote zinathibitisha kuwa uhamisho huu ni:
<b>${v(transferDescription)}</b>.

${
isLoan
?
`
<br><br>
${v(loanDescription)}
`
:
`
<br><br>
Mkataba wa mchezaji unaanza tarehe
<b>${v(contractStart)}</b>
na unaisha tarehe
<b>${v(contractEnd)}</b>.
Muda wa mkataba ni
<b>${v(contractYears)}</b> Miaka.
`
}

<br><br>

Pande zote zinakubaliana kuheshimu kanuni,
taratibu na maamuzi rasmi ya
<b>AFRN Football Management</b>
kuhusu usajili, uhamisho na usimamizi wa wachezaji.

${
meta.agreement_notes
?
`
<br><br>
<b>Maelezo / Masharti Maalum:</b>
${escapeHTML(meta.agreement_notes)}
`
:
""

}

</div>

</div>


<!-- 04 SIGNATURES -->

<div class="sec">

<div class="secTitle">
04 — SAINI ZA PANDE ZOTE
</div>

<div class="signGrid">

<!-- FROM CLUB -->

<div class="signBox">

<h4>
KLABU ANAYOTOKA
</h4>

<b>Mwenyekiti:</b>
${v(leaders.from_chairman)}

<div class="signatureLine"></div>

<span class="signLabel">Saini</span>

<br>

<b>Katibu:</b>
${v(leaders.from_secretary)}

<div class="signatureLine"></div>

<span class="signLabel">Saini</span>

</div>


<!-- TO CLUB -->

<div class="signBox">

<h4>
KLABU YA SASA
</h4>

<b>Mwenyekiti:</b>
${v(leaders.to_chairman)}

<div class="signatureLine"></div>

<span class="signLabel">Saini</span>

<br>

<b>Katibu:</b>
${v(leaders.to_secretary)}

<div class="signatureLine"></div>

<span class="signLabel">Saini</span>

</div>


<!-- PLAYER -->

<div class="signBox">

<h4>
MCHEZAJI
</h4>

<b>Jina:</b>
${v(
    leaders.player_representative ||
    playerName(p)
)}

<div class="signatureLine"></div>

<span class="signLabel">Saini ya Mchezaji</span>

<br>

<b>Tarehe:</b>

<div class="signatureLine"></div>

</div>

</div>

</div>


<!-- 05 FEDERATION -->

<div class="sec">

<div class="secTitle">
05 — UTHIBITISHO WA SHIRIKISHO
</div>

<div class="federationBox">

<div class="fedSign">

<h4>
Mwenyekiti wa Shirikisho
</h4>

<b>
${v(leaders.federation_chairman)}
</b>

<div class="fedSignature"></div>

Saini

</div>


<div class="fedSign">

<h4>
Katibu / Mjumbe wa Shirikisho
</h4>

<b>
${v(leaders.federation_secretary)}
</b>

<div class="fedSignature"></div>

Saini

<br>

<div class="fedStamp">
MUHURI WA<br>
SHIRIKISHO
</div>

</div>

</div>

</div>


<div class="footer">

AFRN FOOTBALL MANAGEMENT
&nbsp;•&nbsp;
OFFICIAL PLAYER TRANSFER DOCUMENT
&nbsp;•&nbsp;
TRANSFER ID:
${v(t.transfer_number)}

</div>

</div>

`;

}


/* =========================================================
   PREVIEW
========================================================= */

function previewCurrent(){

    const playerId =
        $("playerId").value;

    if(!playerId){

        alert(
            "Chagua mchezaji kwanza."
        );

        return;

    }

    const p =
        getPlayer(playerId);

    const fake = {

        id:"PREVIEW",

        player_id:
            playerId,

        from_club_id:
            p.club_id,

        to_club_id:
            $("toClub").value,

        transfer_date:
            $("transferDate").value,

        transfer_number:
            editingId
            ?
            (
                transfers.find(
                    t =>
                    String(t.id) ===
                    String(editingId)
                )?.transfer_number
            )
            :
            "TR-PREVIEW",

        status:
            $("transferStatus").value,

        transfer_type:
            $("transferType").value,

        notes:
            buildNotes()

    };

    openContract(fake);

}


/* =========================================================
   CLOSE CONTRACT
========================================================= */

function closeContract(){

    $("contractModal")
    .classList.remove("show");

}


/* =========================================================
   EDIT
========================================================= */

async function editTransfer(id){

    const t =
        transfers.find(
            x =>
            String(x.id) ===
            String(id)
        );

    if(!t){

        alert(
            "Transfer haijapatikana."
        );

        return;

    }

    editingId =
        t.id;

    currentTransfer =
        t;

    showTab(
        "newTransfer",
        document.querySelectorAll("nav button")[1]
    );

    $("playerId").value =
        t.player_id;

    playerSelected();

    $("toClub").value =
        t.to_club_id || "";

    $("transferType").value =
        t.transfer_type ||
        "Permanent Transfer";

    $("transferDate").value =
        t.transfer_date || "";

    $("transferStatus").value =
        t.status || "DRAFT";

    const meta =
        readNotes(t.notes);

    $("contractStart").value =
        meta.contract_start || "";

    $("contractEnd").value =
        meta.contract_end || "";

    $("contractYears").value =
        meta.contract_years || "";

    $("loanType").value =
        meta.loan_type || "";

    $("loanMonths").value =
        meta.loan_months || "";

    $("leagueName").value =
        meta.league_name || "";

    $("notes").value =
        meta.agreement_notes || "";

    const leaders =
        meta.leaders || {};

    $("fromChairman").value =
        leaders.from_chairman || "";

    $("fromSecretary").value =
        leaders.from_secretary || "";

    $("toChairman").value =
        leaders.to_chairman || "";

    $("toSecretary").value =
        leaders.to_secretary || "";

    $("playerRepresentative").value =
        leaders.player_representative || "";

    $("fedChairman").value =
        leaders.federation_chairman || "";

    $("fedSecretary").value =
        leaders.federation_secretary || "";

    updateTransferTypeUI();

    $("transferIdDisplay").textContent =
        t.transfer_number ||
        "Existing Transfer";

    showMessage(
        "✏️ Unahariri Transfer " +
        (t.transfer_number || ""),
        "notice"
    );

}


/* =========================================================
   DELETE
========================================================= */

async function deleteTransfer(id){

    if(!id){

        alert(
            "❌ Transfer ID haijapatikana."
        );

        return;

    }

    const t =
        transfers.find(
            x =>
            String(x.id) ===
            String(id)
        );

    if(!t){

        alert(
            "❌ Transfer haijapatikana."
        );

        return;

    }

    const p =
        getPlayer(t.player_id);

    const yes =
        confirm(
            "⚠️ UNATAKA KUFUTA TRANSFER HII?\n\n" +

            "Mchezaji: " +
            playerName(p) +

            "\nTransfer ID: " +
            (
                t.transfer_number ||
                t.id
            ) +

            "\n\nTransfer itaondolewa kabisa kwenye database.\n\n" +

            "Endelea?"
        );

    if(!yes)
        return;


    const {error} =
        await db
        .from(TRANSFER_TABLE)
        .delete()
        .eq("id",id);


    if(error){

        console.error(error);

        alert(
            "❌ Imeshindikana kufuta Transfer:\n\n" +
            error.message
        );

        return;

    }


    transfers =
        transfers.filter(
            x =>
            String(x.id) !==
            String(id)
        );


    currentTransfer = null;
    editingId = null;

    renderAll();

    closeContract();

    alert(
        "✅ Transfer imefutwa kabisa kwenye database."
    );

}


/* =========================================================
   RENDER
========================================================= */

function renderAll(){

    renderDashboard();

    renderHistory();

    renderReport();

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard(){

    $("totalTransfers").textContent =
        transfers.length;


    $("pendingTransfers").textContent =
        transfers.filter(t => {

            const s =
                String(t.status || "")
                .toUpperCase();

            return [
                "DRAFT",
                "PENDING"
            ].includes(s);

        }).length;


    $("approvedTransfers").textContent =
        transfers.filter(t =>
            String(t.status || "")
            .toUpperCase() ===
            "APPROVED"
        ).length;


    $("completedTransfers").textContent =
        transfers.filter(t =>
            String(t.status || "")
            .toUpperCase() ===
            "COMPLETED"
        ).length;


    $("dashboardTable").innerHTML =
        buildTable(
            transfers.slice(0,10)
        );

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory(){

    const q =
        (
            $("search")?.value ||
            ""
        )
        .toLowerCase()
        .trim();


    const filtered =
        transfers.filter(t => {

            const p =
                getPlayer(t.player_id);

            const from =
                clubName(t.from_club_id);

            const to =
                clubName(t.to_club_id);

            const text = [

                playerName(p),

                p?.afrn_player_id,

                t.transfer_number,

                from,

                to,

                t.transfer_type,

                t.status

            ]
            .join(" ")
            .toLowerCase();

            return text.includes(q);

        });


    $("historyTable").innerHTML =
        buildTable(filtered);

}


/* =========================================================
   TABLE
========================================================= */

function buildTable(list){

    if(!list.length){

        return `
            <div class="empty">
                Hakuna Transfer zilizopatikana.
            </div>
        `;

    }


    const rows =
        list.map(t => {

            const p =
                getPlayer(t.player_id);

            const from =
                clubName(t.from_club_id);

            const to =
                clubName(t.to_club_id);


            const meta =
                readNotes(t.notes);


            let contractInfo = "—";

            if(
                t.transfer_type ===
                "Loan Transfer"
            ){

                if(meta.loan_type === "MONTHLY"){

                    contractInfo =
                        `Loan: ${meta.loan_months || "—"} miezi`;

                }else if(meta.loan_type === "LEAGUE"){

                    contractInfo =
                        `League: ${meta.league_name || "—"}`;

                }else{

                    contractInfo = "Loan";

                }

            }else{

                contractInfo =
                    `Contract: ${
                        meta.contract_start || "—"
                    } → ${
                        meta.contract_end || "—"
                    }`;

            }


            return `

<tr>

<td>
${escapeHTML(
    t.transfer_number ||
    t.id
)}
</td>


<td>

<b>
${escapeHTML(playerName(p))}
</b>

<br>

<small>
${escapeHTML(
    p?.afrn_player_id ||
    ""
)}
</small>

</td>


<td>
${escapeHTML(from)}
</td>


<td>
${escapeHTML(to)}
</td>


<td>
${escapeHTML(
    t.transfer_type ===
    "Permanent Transfer"
    ?
    "Uhamisho wa Kudumu"
    :
    t.transfer_type ===
    "Loan Transfer"
    ?
    "Uhamisho wa Mkopo"
    :
    t.transfer_type
)}
</td>


<td>
${escapeHTML(t.transfer_date)}
</td>


<td>
${escapeHTML(contractInfo)}
</td>


<td>
${statusBadge(t.status)}
</td>


<td>

<button
    class="btn primary"
    onclick="openContractById('${String(t.id)}')"
>
👁️ A4
</button>


<button
    class="btn warning"
    onclick="editTransfer('${String(t.id)}')"
>
✏️ Edit
</button>


<button
    class="btn success"
    onclick="generateLicenseById('${String(t.id)}')"
>
🎫 Licence
</button>


<button
    class="btn danger"
    onclick="deleteTransfer('${String(t.id)}')"
>
🗑️ Futa
</button>

</td>

</tr>

`;

        })
        .join("");


    return `

<table>

<thead>

<tr>

<th>Transfer ID</th>

<th>Mchezaji</th>

<th>Klabu Anayotoka</th>

<th>Klabu Mpya</th>

<th>Aina</th>

<th>Tarehe</th>

<th>Contract / Loan</th>

<th>Status</th>

<th>Vitendo</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

`;

}


/* =========================================================
   OPEN CONTRACT BY ID
========================================================= */

function openContractById(id){

    const t =
        transfers.find(
            x =>
            String(x.id) ===
            String(id)
        );

    if(!t){

        alert(
            "Transfer haijapatikana."
        );

        return;

    }

    openContract(t);

}


/* =========================================================
   LICENSE
========================================================= */

async function generateLicenseById(id){

    const t =
        transfers.find(
            x =>
            String(x.id) ===
            String(id)
        );

    if(!t){

        alert(
            "Transfer haijapatikana."
        );

        return;

    }


    const p =
        getPlayer(t.player_id);

    const from =
        getClub(t.from_club_id);

    const to =
        getClub(t.to_club_id);

    const meta =
        readNotes(t.notes);


    const licenseNumber =
        "AFRN-L-" +
        new Date().getFullYear() +
        "-" +
        String(t.id).padStart(6,"0");


    const licenseData = {

        player_id:
            t.player_id,

        club_id:
            t.to_club_id,

        from_club_id:
            t.from_club_id,

        license_number:
            licenseNumber,

        season:
            String(new Date().getFullYear()),

        registration_date:
            t.transfer_date || today(),

        registration_type:
            t.transfer_type,

        loan_type:
            meta.loan_type || null,

        status:
            "ACTIVE",

        issue_date:
            today(),

        expiry_date:
            meta.contract_end || null,

        photo_url:
            p?.photo_url ||
            p?.photo ||
            null,

        notes:
            JSON.stringify({

                league:
                    meta.league_name || null,

                loan_months:
                    meta.loan_months || null

            })

    };


    try{

        const {error} =
            await db
            .from(LICENSE_TABLE)
            .upsert(
                licenseData,
                {
                    onConflict:"license_number"
                }
            );

        if(error){

            console.warn(
                "Licence haijahifadhiwa:",
                error.message
            );

        }

    }catch(e){

        console.warn(e);

    }


    openLicense(
        licenseData,
        p,
        from,
        to,
        meta
    );

}


/* =========================================================
   LICENSE PAPER
========================================================= */

function openLicense(
    license,
    p,
    from,
    to,
    meta
){

    const photo =
        p?.photo_url ||
        p?.photo ||
        "";


    let type =
        "Uhamisho wa Kudumu";


    if(
        license.registration_type ===
        "Loan Transfer"
    ){

        type =
            "Uhamisho wa Mkopo";

    }else if(
        license.registration_type ===
        "Free Transfer"
    ){

        type =
            "Uhamisho wa Bure";

    }else if(
        license.registration_type ===
        "Return from Loan"
    ){

        type =
            "Kurudi kutoka Mkopo";

    }


    let duration =
        "Kudumu";


    if(
        license.loan_type ===
        "LEAGUE"
    ){

        duration =
            "Mkopo wa Ligi";

    }else if(
        license.loan_type ===
        "MONTHLY"
    ){

        duration =
            "Mkopo wa " +
            (
                meta.loan_months ||
                "—"
            ) +
            " Miezi";

    }


    $("licensePaper").innerHTML = `

<div class="licenseCard">

<div class="licenseHead">

<img
    src="${LOGO}"
    alt="AFRN Logo"
>

<strong>
AFRN PLAYER LICENCE
</strong>

<div>
SHIRIKISHO LA MPIRA WA MIGUU KAMBINI NYARUGUSU
</div>

</div>


<div class="licenseBody">

<img
    class="licensePhoto"
    src="${escapeHTML(
        photo ||
        placeholderPhoto()
    )}"
>


<div class="licenseInfo">

<b>Licence No:</b>
${escapeHTML(
    license.license_number
)}
<br>

<b>AFRN Player ID:</b>
${escapeHTML(
    p?.afrn_player_id ||
    p?.player_id ||
    p?.id ||
    ""
)}
<br>

<b>Jina:</b>
${escapeHTML(
    playerName(p)
)}
<br>

<b>Klabu Anayotoka:</b>
${escapeHTML(
    from?.name
)}
<br>

<b>Klabu ya Sasa:</b>
${escapeHTML(
    to?.name
)}
<br>

<b>Aina:</b>
${escapeHTML(type)}
<br>

<b>Muda:</b>
${escapeHTML(duration)}
<br>

<b>Tarehe ya Usajili:</b>
${escapeHTML(
    license.registration_date
)}

</div>

</div>


<!-- LICENSE SIGNATURES -->

<div class="licenseSignatures">

<div class="licenseSignBox">

<strong>
SAINI YA MCHEZAJI
</strong>

<div class="licenseSignatureLine"></div>

<div class="licenseSignDate">
Jina: ${escapeHTML(playerName(p))}
</div>

<div class="licenseSignDate">
Tarehe: __________________
</div>

</div>


<div class="licenseSignBox">

<strong>
SAINI YA MJUMBE WA SHIRIKISHO
</strong>

<div class="licenseSignatureLine"></div>

<div class="licenseSignDate">
Jina: __________________
</div>

<div class="licenseSignDate">
Tarehe: __________________
</div>

</div>

</div>


<div class="licenseFooter">

<span>
Issue:
${escapeHTML(license.issue_date)}
</span>

<span>
AFRN OFFICIAL
</span>

</div>

</div>

`;

    $("licenseModal")
    .classList.add("show");

}


/* =========================================================
   CLOSE LICENSE
========================================================= */

function closeLicense(){

    $("licenseModal")
    .classList.remove("show");

}


/* =========================================================
   RESET
========================================================= */

function resetForm(){

    editingId = null;

    currentTransfer = null;

    $("playerId").value = "";

    clearPlayerPreview();

    $("toClub").value = "";

    $("transferType").value =
        "Permanent Transfer";

    $("transferDate").value =
        today();

    $("contractStart").value =
        today();

    $("contractEnd").value =
        "";

    $("contractYears").value =
        "";

    $("loanType").value =
        "";

    $("loanMonths").value =
        "";

    $("leagueName").value =
        "";

    $("transferStatus").value =
        "DRAFT";

    $("notes").value =
        "";

    $("fromChairman").value =
        "";

    $("fromSecretary").value =
        "";

    $("toChairman").value =
        "";

    $("toSecretary").value =
        "";

    $("playerRepresentative").value =
        "";

    $("fedChairman").value =
        "";

    $("fedSecretary").value =
        "";

    updateTransferTypeUI();

    $("transferIdDisplay").textContent =
        generateTransferId();

    showMessage(
        "Fomu imesafishwa. Tayari kwa Transfer mpya.",
        "notice"
    );

}


/* =========================================================
   REPORT
========================================================= */

function filterReport(){

    renderReport();

}


function clearReportFilter(){

    $("reportStart").value = "";

    $("reportEnd").value = "";

    renderReport();

}


function renderReport(){

    const start =
        $("reportStart")?.value || "";

    const end =
        $("reportEnd")?.value || "";


    let list =
        [...transfers];


    if(start){

        list =
            list.filter(
                t =>
                String(
                    t.transfer_date || ""
                ) >= start
            );

    }


    if(end){

        list =
            list.filter(
                t =>
                String(
                    t.transfer_date || ""
                ) <= end
            );

    }


    const box =
        $("reportResult");

    if(!box)
        return;


    if(!list.length){

        box.innerHTML =
            `
            <div class="empty">
                Hakuna Transfer katika kipindi hiki.
            </div>
            `;

        return;

    }


    box.innerHTML =
        buildTable(list);

}


/* =========================================================
   CSV
========================================================= */

function csvEscape(v){

    return `"${String(v ?? "")
        .replace(/"/g,'""')}"`;

}


function downloadCSV(){

    const start =
        $("reportStart")?.value || "";

    const end =
        $("reportEnd")?.value || "";


    let list =
        [...transfers];


    if(start){

        list =
            list.filter(
                t =>
                String(
                    t.transfer_date || ""
                ) >= start
            );

    }


    if(end){

        list =
            list.filter(
                t =>
                String(
                    t.transfer_date || ""
                ) <= end
            );

    }


    let csv =
        "Transfer ID,Player ID,Player Name,Klabu Anayotoka,Klabu ya Sasa,Aina,Tarehe,Contract Start,Contract End,Status\n";


    list.forEach(t => {

        const p =
            getPlayer(t.player_id);

        const meta =
            readNotes(t.notes);


        csv += [

            t.transfer_number ||
            t.id,

            p?.afrn_player_id ||
            p?.id ||
            "",

            playerName(p),

            clubName(t.from_club_id),

            clubName(t.to_club_id),

            t.transfer_type,

            t.transfer_date,

            meta.contract_start,

            meta.contract_end,

            t.status

        ]
        .map(csvEscape)
        .join(",");


        csv += "\n";

    });


    const blob =
        new Blob(
            [csv],
            {
                type:
                "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const a =
        document.createElement("a");


    a.href = url;

    a.download =
        "AFRN-Transfer-Report.csv";


    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
        () =>
        URL.revokeObjectURL(url),
        1000
    );

}


/* =========================================================
   DOWNLOAD CONTRACT
========================================================= */

function downloadContract(){

    if(!currentTransfer){

        alert(
            "Hakuna mkataba wa kupakua."
        );

        return;

    }


    const t =
        currentTransfer;

    const p =
        getPlayer(t.player_id);

    const from =
        getClub(t.from_club_id);

    const to =
        getClub(t.to_club_id);

    const meta =
        readNotes(t.notes);


    const html = `

<!DOCTYPE html>

<html lang="sw">

<head>

<meta charset="UTF-8">

<title>
AFRN-${escapeHTML(
    t.transfer_number ||
    t.id
)}
</title>

<style>

${document.querySelector("style").textContent}

</style>

</head>

<body>

${agreementHTML(
    t,
    p,
    from,
    to,
    meta
)}

</body>

</html>

`;


    const blob =
        new Blob(
            [html],
            {
                type:
                "text/html;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const a =
        document.createElement("a");


    a.href =
        url;


    a.download =
        "AFRN-Transfer-Agreement-" +
        (
            t.transfer_number ||
            t.id
        ) +
        ".html";


    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
        () =>
        URL.revokeObjectURL(url),
        1000
    );

}


/* =========================================================
   EVENTS
========================================================= */

$("playerId")
.addEventListener(
    "change",
    playerSelected
);


$("contractStart")
.addEventListener(
    "change",
    calculateYears
);


$("contractEnd")
.addEventListener(
    "change",
    calculateYears
);


$("toClub")
.addEventListener(
    "change",
    validateTransfer
);


$("transferType")
.addEventListener(
    "change",
    updateTransferTypeUI
);


$("loanType")
.addEventListener(
    "change",
    updateLoanTypeUI
);


$("search")
.addEventListener(
    "input",
    renderHistory
);


/* =========================================================
   INITIALIZE
========================================================= */

async function init(){

    if(!db){

        showMessage(
            "❌ Supabase haijaunganishwa. Hakikisha supabase-config.js iko sawa.",
            "error"
        );

        return;

    }


    $("transferDate").value =
        today();


    $("contractStart").value =
        today();


    updateTransferTypeUI();


    $("transferIdDisplay").textContent =
        "⏳ Inatengeneza...";


    await loadPlayers();

    await loadClubs();

    await loadTransfers();


    $("transferIdDisplay").textContent =
        generateTransferId();


    console.log(
        "AFRN Transfer + Contract Management initialized."
    );

}


init();



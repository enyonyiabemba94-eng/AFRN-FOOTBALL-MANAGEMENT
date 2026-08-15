/* =========================================================
   AFRN FOOTBALL MANAGEMENT
   MAIN APP
   KIPANDE CHA 1/10
   ========================================================= */

let db = null;

let allClubs = [];
let allPlayers = [];


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}


function normalize(value) {

  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


function playerName(player) {

  return [
    player.first_name,
    player.middle_name,
    player.last_name
  ]
    .filter(Boolean)
    .join(" ") || "Bila jina";
}


function showStatus(id, message, type = "") {

  const box = $(id);

  if (!box) return;

  box.textContent = message;

  box.className = "status";

  if (type) {
    box.classList.add(type);
  }
}
/* =========================================================
   SUPABASE
   KIPANDE CHA 2/10
   ========================================================= */

function getDatabase() {

  if (window.supabaseClient) {

  db = window.supabaseClient;

  console.log("AFRN: Supabase client FOUND.");

  return true;
  }

  console.error(
    "Supabase client haijapatikana."
  );

  return false;
}


async function testConnection() {

  if (!db) {

    showStatus(
      "connectionStatus",
      "Supabase haijaunganishwa.",
      "error"
    );

    return false;
  }

  try {

    const result =
      await db
        .from("clubs")
        .select("id")
        .limit(1);

    if (result.error) {
      throw result.error;
    }

    showStatus(
      "connectionStatus",
      "Supabase imeunganishwa tayari.",
      "success"
    );

    console.log(
      "AFRN: Supabase connection OK."
    );

    return true;

  } catch (error) {

    showStatus(
      "connectionStatus",
      "Tatizo la Supabase: " +
      error.message,
      "error"
    );

    console.error(
      "AFRN Supabase Error:",
      error
    );

    return false;
  }
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "AFRN Football Management inaanza..."
    );

    getDatabase();

    await testConnection();

  }
);
/* =========================================================
   PAGE NAVIGATION
   KIPANDE CHA 3/10
   ========================================================= */

function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });


  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );

    });


  const page = $(pageName);

  if (page) {

    page.classList.add("active");

  }
}


/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const pageName =
            button.dataset.page;

          showPage(pageName);

          if (pageName === "dashboard") {
            await loadDashboard();
          }

          if (pageName === "clubs") {
            await loadClubs();
          }

          if (pageName === "players") {
            await loadPlayerClubs();
            await loadPlayers();
          }

          if (pageName === "contracts") {
            await initContractsPage();
          }

        }
      );

    });

}
/* =========================================================
   DASHBOARD
   KIPANDE CHA 4/10
   ========================================================= */

async function loadDashboard() {

  if (!db) return;

  const [
    clubs,
    players,
    contracts,
    transfers,
    competitions,
    matches
  ] = await Promise.all([

    db
      .from("clubs")
      .select("id", {
        count: "exact",
        head: true
      }),

    db
      .from("players")
      .select("id", {
        count: "exact",
        head: true
      }),

    db
      .from("player_contracts")
      .select("id", {
        count: "exact",
        head: true
      }),

    db
      .from("player_transfers")
      .select("id", {
        count: "exact",
        head: true
      }),

    db
      .from("competitions")
      .select("id", {
        count: "exact",
        head: true
      }),

    db
      .from("matches")
      .select("id", {
        count: "exact",
        head: true
      })

  ]);

  if ($("dashClubs")) {

    $("dashClubs").textContent =
      clubs.count ?? 0;

  }

  if ($("dashPlayers")) {

    $("dashPlayers").textContent =
      players.count ?? 0;

  }

  if ($("dashContracts")) {

    $("dashContracts").textContent =
      contracts.count ?? 0;

  }

  if ($("dashTransfers")) {

    $("dashTransfers").textContent =
      transfers.count ?? 0;

  }

  if ($("dashCompetitions")) {

    $("dashCompetitions").textContent =
      competitions.count ?? 0;

  }

  if ($("dashMatches")) {

    $("dashMatches").textContent =
      matches.count ?? 0;

  }

  console.log(
    "AFRN Dashboard imepakiwa."
  );
}
/* =========================================================
   CLUBS
   KIPANDE CHA 5/10
   ========================================================= */

async function loadClubs() {

  if (!db) return;

  showStatus(
    "clubStatus",
    "Inapakia vilabu..."
  );

  const result =
    await db
      .from("clubs")
      .select("*")
      .order("name");

  if (result.error) {

    showStatus(
      "clubStatus",
      "Imeshindikana: " +
      result.error.message,
      "error"
    );

    console.error(
      "Clubs Error:",
      result.error
    );

    return;
  }

  allClubs =
    result.data || [];

  renderClubs();

  showStatus(
    "clubStatus",
    allClubs.length +
    " klabu zimepatikana.",
    "success"
  );
}


function renderClubs() {

  const table =
    $("clubsTable");

  if (!table) return;

  if (!allClubs.length) {

    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          Hakuna vilabu.
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML =
    allClubs.map(
      (club, index) => {

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(
                club.name || "Bila jina"
              )}
            </td>

            <td>
              ${escapeHTML(
                club.zone || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                club.status || "active"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editClub('${club.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deleteClub('${club.id}')">
                🗑️
              </button>

            </td>

          </tr>
        `;

      }
    ).join("");


  if ($("clubCount")) {

    $("clubCount").textContent =
      allClubs.length;

  }


  if ($("visibleClubCount")) {

    $("visibleClubCount").textContent =
      allClubs.length;

  }
}


window.loadClubs =
  loadClubs;
/* =========================================================
   CLUB MANAGEMENT
   KIPANDE CHA 6/10
   ========================================================= */

async function addClub() {

  if (!db) return;

  const name =
    $("clubName")?.value.trim();

  if (!name) {

    alert(
      "Tafadhali weka jina la klabu."
    );

    return;
  }

  const data = {

    name: name,

    short_name:
      $("clubShortName")?.value.trim() || null,

    zone:
      $("clubZone")?.value.trim() || null,

    address:
      $("clubAddress")?.value.trim() || null,

    phone:
      $("clubPhone")?.value.trim() || null,

    email:
      $("clubEmail")?.value.trim() || null,

    founded_year:
      $("clubFoundedYear")?.value || null,

    logo_url:
      $("clubLogoUrl")?.value.trim() || null,

    status:
      $("clubStatusSelect")?.value || "active"

  };

  const result =
    await db
      .from("clubs")
      .insert(data);

  if (result.error) {

    alert(
      "Imeshindikana kuongeza klabu: " +
      result.error.message
    );

    return;
  }

  alert(
    "Klabu imeongezwa kikamilifu."
  );

  $("clubForm")?.reset();

  await loadClubs();
  await loadDashboard();
}


const clubForm =
  $("clubForm");

if (clubForm) {

  clubForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await addClub();

    }
  );

}


window.addClub =
  addClub;


/* =========================================================
   DELETE CLUB
   ========================================================= */

async function deleteClub(id) {

  if (!db) return;

  const confirmDelete =
    confirm(
      "Una uhakika unataka kufuta klabu hii?"
    );

  if (!confirmDelete) return;

  const result =
    await db
      .from("clubs")
      .delete()
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kufuta klabu: " +
      result.error.message
    );

    return;
  }

  alert(
    "Klabu imefutwa."
  );

  await loadClubs();
  await loadDashboard();
}


window.deleteClub =
  deleteClub;


/* =========================================================
   EDIT CLUB
   ========================================================= */

async function editClub(id) {

  if (!db) return;

  const club =
    allClubs.find(
      item =>
        String(item.id) === String(id)
    );

  if (!club) {

    alert(
      "Klabu haijapatikana."
    );

    return;
  }

  const name =
    prompt(
      "Jina la klabu:",
      club.name || ""
    );

  if (name === null) return;

  if (!name.trim()) {

    alert(
      "Jina la klabu haliwezi kuwa tupu."
    );

    return;
  }

  const result =
    await db
      .from("clubs")
      .update({
        name: name.trim()
      })
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kuhariri klabu: " +
      result.error.message
    );

    return;
  }

  alert(
    "Klabu imehaririwa."
  );

  await loadClubs();
  await loadDashboard();
}


window.editClub =
  editClub;
/* =========================================================
   PLAYERS
   KIPANDE CHA 7/10
   ========================================================= */

async function loadPlayers() {

  if (!db) {

    alert(
      "Supabase haijaunganishwa."
    );

    return;
  }

  const result =
    await db
      .from("players")
      .select(`
        *,
        clubs:club_id (
          id,
          name
        )
      `)
      .order("first_name");

  if (result.error) {

    console.error(
      "Imeshindikana kupakia wachezaji:",
      result.error
    );

    alert(
      "Imeshindikana kupakia wachezaji: " +
      result.error.message
    );

    return;
  }

  allPlayers =
    result.data || [];

  renderPlayers();
}


function renderPlayers() {

  const table =
    $("playersTable");

  if (!table) return;

  if ($("playerCount")) {

    $("playerCount").textContent =
      allPlayers.length;

  }

  if ($("visiblePlayerCount")) {

    $("visiblePlayerCount").textContent =
      allPlayers.length;

  }

  if (!allPlayers.length) {

    table.innerHTML = `
      <tr>
        <td colspan="8" class="empty">
          Hakuna wachezaji.
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML =
    allPlayers.map(
      (player, index) => {

        const fullName =
          playerName(player);

        const club =
          player.clubs?.name || "—";

        const photo =
          player.photo_url
            ? `
              <img
                src="${escapeHTML(
                  player.photo_url
                )}"
                alt="${escapeHTML(
                  fullName
                )}"
                style="
                  width:45px;
                  height:45px;
                  object-fit:cover;
                  border-radius:50%;
                "
              >
            `
            : "—";

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${photo}
            </td>

            <td>
              ${escapeHTML(
                fullName
              )}
            </td>

            <td>
              ${escapeHTML(
                club
              )}
            </td>

            <td>
              ${escapeHTML(
                player.position || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                player.jersey_number || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                player.status || "—"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editPlayer('${player.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deletePlayer('${player.id}')">
                🗑️
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");
}
/* =========================================================
   PLAYER SEARCH
   Tafuta kwa Jina au Klabu
   ========================================================= */

function searchPlayers() {

  const input = $("playerSearch");

  if (!input) return;

  const search = normalize(input.value);

  if (!search) {
    renderPlayers();
    return;
  }

  const filteredPlayers =
    allPlayers.filter(player => {

      const name =
        normalize(playerName(player));

      const club =
        normalize(player.clubs?.name || "");

      return (
        name.includes(search) ||
        club.includes(search)
      );

    });

  renderFilteredPlayers(filteredPlayers);
}


function renderFilteredPlayers(players) {

  const table = $("playersTable");

  if (!table) return;

  if (!players.length) {

    table.innerHTML = `
      <tr>
        <td colspan="8" class="empty">
          Hakuna mchezaji aliyepatikana.
        </td>
      </tr>
    `;

    if ($("visiblePlayerCount")) {
      $("visiblePlayerCount").textContent = 0;
    }

    return;
  }

  table.innerHTML =
    players.map(
      (player, index) => {

        const fullName =
          playerName(player);

        const club =
          player.clubs?.name || "—";

        return `
          <tr>

            <td>${index + 1}</td>

            <td>
              ${
                player.photo_url
                  ? `
                    <img
                      src="${escapeHTML(player.photo_url)}"
                      alt="${escapeHTML(fullName)}"
                      style="
                        width:45px;
                        height:45px;
                        object-fit:cover;
                        border-radius:50%;
                      "
                    >
                  `
                  : "—"
              }
            </td>

            <td>
              ${escapeHTML(fullName)}
            </td>

            <td>
              ${escapeHTML(club)}
            </td>

            <td>
              ${escapeHTML(player.position || "—")}
            </td>

            <td>
              ${escapeHTML(player.jersey_number || "—")}
            </td>

            <td>
              ${escapeHTML(player.status || "—")}
            </td>

            <td>

              <button
                type="button"
                onclick="editPlayer('${player.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deletePlayer('${player.id}')">
                🗑️
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");

  if ($("visiblePlayerCount")) {
    $("visiblePlayerCount").textContent =
      players.length;
  }
}


/* =========================================================
   SEARCH EVENT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const searchInput =
      $("playerSearch");

    if (!searchInput) return;

    searchInput.addEventListener(
      "input",
      searchPlayers
    );

  }
);

window.loadPlayers =
  loadPlayers;
/* =========================================================
   PLAYER CLUBS + ADD PLAYER
   KIPANDE CHA 8/10
   ========================================================= */

async function loadPlayerClubs() {

  if (!db) return;

  const result =
    await db
      .from("clubs")
      .select("id, name")
      .order("name");

  if (result.error) {

    console.error(
      "Imeshindikana kupakia klabu:",
      result.error.message
    );

    return;
  }

  const select =
    $("playerClubId");

  const editSelect =
    $("editPlayerClubId");

  if (select) {

    select.innerHTML = `
      <option value="">
        Chagua Klabu
      </option>
    `;

  }

  if (editSelect) {

    editSelect.innerHTML = `
      <option value="">
        Chagua Klabu
      </option>
    `;

  }

  (result.data || []).forEach(
    club => {

      if (select) {

        const option =
          document.createElement("option");

        option.value =
          club.id;

        option.textContent =
          club.name;

        select.appendChild(option);

      }

      if (editSelect) {

        const option =
          document.createElement("option");

        option.value =
          club.id;

        option.textContent =
          club.name;

        editSelect.appendChild(option);

      }

    }
  );
}


window.loadPlayerClubs =
  loadPlayerClubs;


/* =========================================================
   ADD PLAYER
   ========================================================= */

async function addPlayer() {

  if (!db) return;

  const firstName =
    $("playerFirstName")?.value.trim();

  if (!firstName) {

    alert(
      "Tafadhali weka First Name."
    );

    return;
  }

  const data = {

    club_id:
      $("playerClubId")?.value || null,

    first_name:
      firstName,

    middle_name:
      $("playerMiddleName")?.value.trim() || null,

    last_name:
      $("playerLastName")?.value.trim() || null,

    date_of_birth:
      $("playerDateOfBirth")?.value || null,

    nationality:
      $("playerNationality")?.value.trim() || null,

    position:
      $("playerPosition")?.value.trim() || null,

    jersey_number:
      $("playerJerseyNumber")?.value || null,

    phone:
      $("playerPhone")?.value.trim() || null,

    address:
      $("playerAddress")?.value.trim() || null,

    status:
      $("playerStatus")?.value || "active",

    player_id_number:
      $("playerIdNumber")?.value.trim() || null,

    photo_url:
      $("playerPhotoUrl")?.value.trim() || null

  };

  const result =
    await db
      .from("players")
      .insert(data);

  if (result.error) {

    alert(
      "Imeshindikana kuongeza mchezaji: " +
      result.error.message
    );

    return;
  }

  alert(
    "Mchezaji ameongezwa kikamilifu."
  );

  $("playerForm")?.reset();

  await loadPlayers();
  await loadDashboard();
}


/* =========================================================
   PLAYER FORM
   ========================================================= */

const playerForm =
  $("playerForm");

if (playerForm) {

  playerForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await addPlayer();

    }
  );

}


window.addPlayer =
  addPlayer;
/* =========================================================
   PLAYER MANAGEMENT
   KIPANDE CHA 9/10
   ========================================================= */


/* =========================================================
   DELETE PLAYER
   ========================================================= */

async function deletePlayer(id) {

  if (!db) return;

  const confirmDelete =
    confirm(
      "Una uhakika unataka kufuta mchezaji huyu?"
    );

  if (!confirmDelete) return;

  const result =
    await db
      .from("players")
      .delete()
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kufuta mchezaji: " +
      result.error.message
    );

    return;
  }

  alert(
    "Mchezaji amefutwa."
  );

  await loadPlayers();
  await loadDashboard();
}


window.deletePlayer =
  deletePlayer;

/* =========================================================
   EDIT PLAYER
   UPDATED - CLUB INCLUDED
   ========================================================= */

async function editPlayer(id) {

  if (!db) return;

  const player =
    allPlayers.find(
      item =>
        String(item.id) === String(id)
    );

  if (!player) {

    alert("Mchezaji hajapatikana.");

    return;
  }


  /* =========================
     FIRST NAME
     ========================= */

  const firstName =
    prompt(
      "First Name:",
      player.first_name || ""
    );

  if (firstName === null) return;

  if (!firstName.trim()) {

    alert(
      "First Name haiwezi kuwa tupu."
    );

    return;
  }


  /* =========================
     MIDDLE NAME
     ========================= */

  const middleName =
    prompt(
      "Middle Name:",
      player.middle_name || ""
    );

  if (middleName === null) return;


  /* =========================
     LAST NAME
     ========================= */

  const lastName =
    prompt(
      "Last Name:",
      player.last_name || ""
    );

  if (lastName === null) return;


  /* =========================
     LOAD CLUBS
     ========================= */

  const clubsResult =
    await db
      .from("clubs")
      .select("id, name")
      .order("name");

  if (clubsResult.error) {

    alert(
      "Imeshindikana kupakia vilabu: " +
      clubsResult.error.message
    );

    return;
  }

  const clubs =
    clubsResult.data || [];


  /* =========================
     CLUB SELECTION
     ========================= */

  let clubMessage =
    "CHAGUA KLABU:\n\n";

  clubs.forEach(
    (club, index) => {

      clubMessage +=
        (index + 1) +
        ". " +
        club.name +
        "\n";

    }
  );


  const currentClub =
    clubs.find(
      club =>
        String(club.id) ===
        String(player.club_id)
    );


  if (currentClub) {

    clubMessage +=
      "\nKlabu ya sasa: " +
      currentClub.name;

  }


  const clubChoice =
    prompt(
      clubMessage +
      "\n\nWeka namba ya klabu:",
      currentClub
        ? String(
            clubs.indexOf(currentClub) + 1
          )
        : ""
    );


  if (clubChoice === null) return;


  const clubIndex =
    Number(clubChoice) - 1;


  if (
    !Number.isInteger(clubIndex) ||
    !clubs[clubIndex]
  ) {

    alert(
      "Namba ya klabu si sahihi."
    );

    return;
  }


  const newClubId =
    clubs[clubIndex].id;


  /* =========================
     POSITION
     ========================= */

  const position =
    prompt(
      "Position:",
      player.position || ""
    );

  if (position === null) return;


  /* =========================
     JERSEY NUMBER
     ========================= */

  const jersey =
    prompt(
      "Jersey Number:",
      player.jersey_number || ""
    );

  if (jersey === null) return;


  /* =========================
     UPDATE PLAYER
     ========================= */

  const result =
    await db
      .from("players")
      .update({

        first_name:
          firstName.trim(),

        middle_name:
          middleName.trim() || null,

        last_name:
          lastName.trim() || null,

        club_id:
          newClubId,

        position:
          position.trim() || null,

        jersey_number:
          jersey || null

      })
      .eq("id", id);


  if (result.error) {

    alert(
      "Imeshindikana kuhariri mchezaji: " +
      result.error.message
    );

    console.error(
      "Edit Player Error:",
      result.error
    );

    return;
  }


  alert(
    "Mchezaji amehaririwa kikamilifu."
  );


  await loadPlayers();

  await loadDashboard();
}


window.editPlayer =
  editPlayer;
  
/* =========================================================
   SEARCH + REFRESH + APP START
   KIPANDE CHA 10/10
   ========================================================= */


/* =========================================================
   CLUB SEARCH
   ========================================================= */

function searchClubs() {

  const input =
    $("clubSearch");

  if (!input) return;

  const query =
    normalize(input.value);

  const filtered =
    allClubs.filter(club => {

      const name =
        normalize(club.name);

      const zone =
        normalize(club.zone);

      return (
        name.includes(query) ||
        zone.includes(query)
      );

    });


  const table =
    $("clubsTable");

  if (!table) return;


  if (!filtered.length) {

    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          Hakuna klabu iliyopatikana.
        </td>
      </tr>
    `;

  } else {

    table.innerHTML =
      filtered.map(
        (club, index) => `

          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(
                club.name || "Bila jina"
              )}
            </td>

            <td>
              ${escapeHTML(
                club.zone || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                club.status || "active"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editClub('${club.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deleteClub('${club.id}')">
                🗑️
              </button>

            </td>

          </tr>

        `
      ).join("");

  }


  if ($("visibleClubCount")) {

    $("visibleClubCount").textContent =
      filtered.length;

  }
}


/* =========================================================
   SEARCH EVENT
   ========================================================= */

const clubSearch =
  $("clubSearch");

if (clubSearch) {

  clubSearch.addEventListener(
    "input",
    searchClubs
  );

}


/* =========================================================
   REFRESH CLUBS
   ========================================================= */

const refreshClubsBtn =
  $("refreshClubsBtn");

if (refreshClubsBtn) {

  refreshClubsBtn.addEventListener(
    "click",
    loadClubs
  );

}


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    getDatabase();

    setupNavigation();

    await testConnection();

    await loadDashboard();

    await loadClubs();

    await loadPlayerClubs();

    await loadPlayers();

    console.log(
      "AFRN Football Management iko tayari."
    );

  }
);
/* =========================================================
   CONTRACTS
   KIPANDE CHA 1/10
   ========================================================= */

let allContracts = [];


/* =========================================================
   LOAD CONTRACTS
   ========================================================= */

async function loadContracts() {

  if (!db) {

    showStatus(
      "contractStatus",
      "Supabase haijaunganishwa.",
      "error"
    );

    return;
  }

  showStatus(
    "contractStatus",
    "Inapakia mikataba..."
  );

  const result =
    await db
      .from("player_contracts")
      .select(`
        *,
        players:player_id (
          id,
          first_name,
          middle_name,
          last_name,
          club_id
        )
      `)
      .order("created_at", {
        ascending: false
      });

  if (result.error) {

    showStatus(
      "contractStatus",
      "Imeshindikana kupakia mikataba: " +
      result.error.message,
      "error"
    );

    console.error(
      "Contracts Error:",
      result.error
    );

    return;
  }

  allContracts =
    result.data || [];

  renderContracts();

  showStatus(
    "contractStatus",
    allContracts.length +
    " mikataba imepatikana.",
    "success"
  );
}


window.loadContracts =
  loadContracts;
/* =========================================================
   CONTRACTS
   KIPANDE CHA 2/10
   ========================================================= */

function renderContracts() {

  const table =
    $("contractsTable");

  if (!table) return;


  if (!allContracts.length) {

    table.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          Hakuna mikataba.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    allContracts.map(
      (contract, index) => {

        const player =
          contract.players || {};

        const fullName =
          playerName(player);

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(
                fullName
              )}
            </td>

            <td>
              ${escapeHTML(
                player.club_id || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.start_date || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.end_date || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.status || "—"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editContract('${contract.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deleteContract('${contract.id}')">
                🗑️
              </button>

            </td>

          </tr>
        `;

      }
    ).join("");
}


window.renderContracts =
  renderContracts;
/* =========================================================
   CONTRACTS
   KIPANDE CHA 3/10
   ========================================================= */

async function loadContractPlayers() {

  if (!db) return;

  const result =
    await db
      .from("players")
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        club_id
      `)
      .order("first_name");

  if (result.error) {

    console.error(
      "Imeshindikana kupakia wachezaji:",
      result.error
    );

    return;
  }

  const select =
    $("contractPlayerId");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Chagua Mchezaji
    </option>
  `;

  (result.data || []).forEach(
    player => {

      const option =
        document.createElement("option");

      option.value =
        player.id;

      option.textContent =
        playerName(player);

      select.appendChild(option);

    }
  );
}


window.loadContractPlayers =
  loadContractPlayers;
/* =========================================================
   CONTRACTS
   KIPANDE CHA 4/10
   ADD CONTRACT
   ========================================================= */

async function addContract() {

  if (!db) {

    alert(
      "Supabase haijaunganishwa."
    );

    return;
  }

  const playerId =
    $("contractPlayerId")?.value || null;

  if (!playerId) {

    alert(
      "Tafadhali chagua mchezaji."
    );

    return;
  }

  const data = {

    player_id:
      playerId,

    start_date:
      $("contractStartDate")?.value || null,

    end_date:
      $("contractEndDate")?.value || null,

    status:
      $("contractStatusSelect")?.value || "active"

  };

  const result =
  await db
    .from("player_contracts")
    .insert(data);

if (result.error) {

  alert(
    "Imeshindikana kuongeza mkataba: " +
    result.error.message
  );

  console.error(
    "Add Contract Error:",
    result.error
  );

  return;
}

alert(
  "Mkataba umeongezwa kikamilifu."
);

$("contractForm")?.reset();

await loadContracts();

await loadDashboard();

}


window.addContract =
  addContract;
/* =========================================================
   CONTRACT FORM
   KIPANDE CHA 5/10
   ========================================================= */

const contractForm =
  $("contractForm");

if (contractForm) {

  contractForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await addContract();

    }
  );
}


window.contractForm =
  contractForm;
/* =========================================================
   LOAD CONTRACTS
   KIPANDE CHA 6/10
   ========================================================= */

async function loadContracts() {

  if (!db) {

    console.error(
      "Supabase haijaunganishwa."
    );

    return;
  }

  const result =
    await db
      .from("player_contracts")
      .select(`
        *,
        players:player_id (
          id,
          first_name,
          middle_name,
          last_name
        ),
        clubs:club_id (
          id,
          name
        )
      `)
      .order("start_date", {
        ascending: false
      });

  if (result.error) {

    console.error(
      "Imeshindikana kupakia mikataba:",
      result.error
    );

    showStatus(
      "contractStatus",
      "Imeshindikana kupakia mikataba: " +
      result.error.message,
      "error"
    );

    return;
  }

  const contracts =
    result.data || [];

  renderContracts(
    contracts
  );

  showStatus(
    "contractStatus",
    contracts.length +
    " mikataba imepatikana.",
    "success"
  );
}


window.loadContracts =
  loadContracts;
/* =========================================================
   RENDER CONTRACTS
   KIPANDE CHA 7/10
   ========================================================= */

function renderContracts(contracts) {

  const table =
    $("contractsTable");

  if (!table) return;

  if (!contracts.length) {

    table.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          Hakuna mikataba.
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML =
    contracts.map(
      (contract, index) => {

        const player =
          contract.players;

        const playerFullName =
          player
            ? playerName(player)
            : "Bila jina";

        const club =
          contract.clubs?.name || "—";

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(
                playerFullName
              )}
            </td>

            <td>
              ${escapeHTML(
                club
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.start_date || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.end_date || "—"
              )}
            </td>

            <td>
              ${escapeHTML(
                contract.status || "active"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editContract('${contract.id}')">
                ✏️
              </button>

              <button
                type="button"
                onclick="deleteContract('${contract.id}')">
                🗑️
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");
}


window.renderContracts =
  renderContracts;
/* =========================================================
   CONTRACT SEARCH
   KIPANDE CHA 8/10
   ========================================================= */

function searchContracts() {

  const input =
    $("contractSearch");

  if (!input) return;

  const query =
    normalize(input.value);

  const filtered =
    allContracts.filter(contract => {

      const player =
        contract.players
          ? playerName(contract.players)
          : "";

      const club =
        contract.clubs?.name || "";

      const status =
        contract.status || "";

      return (
        normalize(player).includes(query) ||
        normalize(club).includes(query) ||
        normalize(status).includes(query)
      );

    });

  renderContracts(filtered);

}


/* =========================================================
   SEARCH EVENT
   ========================================================= */

const contractSearch =
  $("contractSearch");

if (contractSearch) {

  contractSearch.addEventListener(
    "input",
    searchContracts
  );

}


/* =========================================================
   REFRESH CONTRACTS
   ========================================================= */

const refreshContractsBtn =
  $("refreshContractsBtn");

if (refreshContractsBtn) {

  refreshContractsBtn.addEventListener(
    "click",
    loadContracts
  );

}
/* =========================================================
   CONTRACT EDIT + DELETE
   KIPANDE CHA 9/10
   ========================================================= */

async function deleteContract(id) {

  if (!db) return;

  const confirmDelete =
    confirm(
      "Una uhakika unataka kufuta mkataba huu?"
    );

  if (!confirmDelete) return;

  const result =
    await db
      .from("player_contracts")
      .delete()
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kufuta mkataba: " +
      result.error.message
    );

    console.error(
      "Delete Contract Error:",
      result.error
    );

    return;
  }

  alert(
    "Mkataba umefutwa kikamilifu."
  );

  await loadContracts();
  await loadDashboard();
}


window.deleteContract =
  deleteContract;


/* =========================================================
   EDIT CONTRACT
   ========================================================= */

async function editContract(id) {

  if (!db) return;

  const contract =
    allContracts.find(
      item =>
        String(item.id) === String(id)
    );

  if (!contract) {

    alert(
      "Mkataba haujapatikana."
    );

    return;
  }

  const startDate =
    prompt(
      "Tarehe ya kuanza:",
      contract.start_date || ""
    );

  if (startDate === null) return;

  const endDate =
    prompt(
      "Tarehe ya kumaliza:",
      contract.end_date || ""
    );

  if (endDate === null) return;

  const status =
    prompt(
      "Status:",
      contract.status || "active"
    );

  if (status === null) return;

  const result =
    await db
      .from("player_contracts")
      .update({

        start_date:
          startDate.trim() || null,

        end_date:
          endDate.trim() || null,

        status:
          status.trim() || "active"

      })
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kuhariri mkataba: " +
      result.error.message
    );

    console.error(
      "Edit Contract Error:",
      result.error
    );

    return;
  }

    alert(
    "Mkataba umehaririwa kikamilifu."
  );

  await loadContracts();

  await loadDashboard();
}


window.editContract =
  editContract;


/* =========================================================
   CONTRACT MODAL EVENTS
   ========================================================= */

const openAddContractBtn =
  $("openAddContractBtn");

if (openAddContractBtn) {

  openAddContractBtn.addEventListener(
    "click",
    () => {

      const modal =
        $("contractModal");

      if (modal) {
        modal.classList.add("show");
      }

    }
  );

}


const cancelContractBtn =
  $("cancelContractBtn");

if (cancelContractBtn) {

  cancelContractBtn.addEventListener(
    "click",
    () => {

      const modal =
        $("contractModal");

      if (modal) {
        modal.classList.remove("show");
      }

    }
  );

}

console.log(
  "CONTRACT BUTTON CODE IMESOMA"
);
/* =========================================================
   CONTRACTS PAGE INITIALIZATION
   KIPANDE CHA 10/10
   ========================================================= */

async function initContractsPage() {

  if (!db) return;

  await loadContractPlayers();

  await loadContracts();

}

window.initContractsPage =
  initContractsPage;
/* =========================================================
   SAVE CONTRACT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const saveContractBtn =
      $("saveContractBtn");

    console.log(
      "SAVE BUTTON:",
      saveContractBtn
    );

    if (!saveContractBtn) {

      console.error(
        "saveContractBtn haijapatikana."
      );

      return;
    }

    saveContractBtn.addEventListener(
      "click",
      async () => {

        console.log(
          "HIFADHI IMEBONYEZWA"
        );

        if (!db) {

          alert(
            "Supabase haijaunganishwa."
          );

          return;
        }

        const playerId =
          $("contractPlayerId")?.value;

        const startDate =
          $("contractStartDate")?.value;

        const endDate =
          $("contractEndDate")?.value || null;

        const status =
          $("contractStatusSelect")?.value ||
          "active";

        if (!playerId) {

          alert(
            "Tafadhali chagua mchezaji."
          );

          return;
        }

        if (!startDate) {

          alert(
            "Tafadhali weka tarehe ya kuanza."
          );

          return;
        }

        const result =
          await db
            .from("player_contracts")
            .insert({
              player_id: playerId,
              start_date: startDate,
              end_date: endDate,
              status: status
            });

        if (result.error) {

          console.error(
            "Contract Save Error:",
            result.error
          );

          alert(
            "Imeshindikana kuhifadhi mkataba: " +
            result.error.message
          );

          return;
        }

        alert(
          "Mkataba umehifadhiwa kikamilifu."
        );

        $("contractModal")
          ?.classList.remove("show");

        await loadContracts();

        await loadDashboard();

      }
    );

    console.log(
      "CONTRACT SAVE CODE IMESOMA"
    );

  }
);
/* =========================================================
   START APP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    getDatabase();

    setupNavigation();

    await testConnection();

    await loadDashboard();

    await loadClubs();

    await loadPlayerClubs();

    await loadPlayers();

    console.log(
      "AFRN Football Management iko tayari."
    );

  }
);

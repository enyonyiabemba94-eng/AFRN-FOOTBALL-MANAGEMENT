const db = window.supabaseClient;

let allClubs = [];
let allPlayers = [];

function $(id) {
  return document.getElementById(id);
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

function clubName(club) {
  return club.name ||
    club.club_name ||
    "Bila jina";
}
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
document
.querySelectorAll(".nav-btn")
.forEach(button => {

  button.addEventListener(
    "click",
    async () => {

      const pageName =
        button.dataset.page;

      showPage(pageName);

      if (pageName === "players") {
        await loadPlayers();
      }

    }
  );

});
async function testConnection() {

  const status =
    $("connectionStatus");

  if (!db) {

    status.textContent =
      "Supabase client haijaunganishwa.";

    status.className =
      "status error";

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

    status.textContent =
      "Supabase imeunganishwa tayari.";

    status.className =
      "status success";

    return true;

  } catch (error) {

    status.textContent =
      "Tatizo la Supabase: " +
      error.message;

    status.className =
      "status error";

    return false;
  }
}
async function loadDashboard() {

  if (!db) return;

  const clubs =
    await db
      .from("clubs")
      .select("id", {
        count: "exact",
        head: true
      });

  const players =
    await db
      .from("players")
      .select("id", {
        count: "exact",
        head: true
      });

  if ($("dashClubs")) {
    $("dashClubs").textContent =
      clubs.count ?? 0;
  }

  if ($("dashPlayers")) {
    $("dashPlayers").textContent =
      players.count ?? 0;
  }
}
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await testConnection();

    await loadDashboard();

  }
);
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

  const table = $("clubsTable");

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

  table.innerHTML = allClubs
    .map((club, index) => {

      return `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(clubName(club))}
          </td>

          <td>
            ${escapeHTML(club.zone || "—")}
          </td>

          <td>
            ${escapeHTML(club.status || "active")}
          </td>

          <td>

            <div class="actions">

              <button
                class="btn edit"
                onclick="editClub('${club.id}')">
                ✏️ Hariri
              </button>

              <button
                class="btn danger"
                onclick="deleteClub('${club.id}')">
                🗑️ Futa
              </button>

            </div>

          </td>

        </tr>
      `;

    })
    .join("");

  if ($("clubCount")) {
    $("clubCount").textContent =
      allClubs.length;
  }

  if ($("visibleClubCount")) {
    $("visibleClubCount").textContent =
      allClubs.length;
  }
}
function searchClubs() {

  const input = $("clubSearch");

  if (!input) return;

  const query =
    normalize(input.value);

  const filtered =
    allClubs.filter(club => {

      const name =
        normalize(clubName(club));

      const zone =
        normalize(club.zone);

      return (
        name.includes(query) ||
        zone.includes(query)
      );

    });

  const original =
    allClubs;

  allClubs =
    filtered;

  renderClubs();

  allClubs =
    original;
}
const clubSearch = $("clubSearch");

if (clubSearch) {

  clubSearch.addEventListener(
    "input",
    searchClubs
  );

}
const refreshClubsBtn =
  $("refreshClubsBtn");

if (refreshClubsBtn) {

  refreshClubsBtn.addEventListener(
    "click",
    loadClubs
  );

}
const clubsButton =
  document.querySelector(
    '[data-page="clubs"]'
  );

if (clubsButton) {

  clubsButton.addEventListener(
    "click",
    loadClubs
  );

}
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await testConnection();

    await loadDashboard();

    await loadClubs();

  }
);
async function addClub() {

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
      $("clubShortName")?.value.trim(),
    zone:
      $("clubZone")?.value.trim(),
    address:
      $("clubAddress")?.value.trim(),
    phone:
      $("clubPhone")?.value.trim(),
    email:
      $("clubEmail")?.value.trim(),
    founded_year:
      $("clubFoundedYear")?.value || null,
    logo_url:
      $("clubLogoUrl")?.value.trim() || null,
    status:
      $("clubStatusInput")?.value || "active"
  };
  const exists =
    await db
      .from("clubs")
      .select("id")
      .eq("name", name)
      .limit(1);

  if (exists.error) {

    alert(
      "Imeshindikana kukagua klabu: " +
      exists.error.message
    );

    return;
  }

  if (exists.data?.length) {

    alert(
      "Klabu yenye jina hili tayari ipo."
    );

    return;
    }
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

  await loadClubs();
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
async function deleteClub(id) {

  if (
    !confirm(
      "Una uhakika unataka kufuta klabu hii?"
    )
  ) {
    return;
  }

  const result =
  await db
    .from("clubs")
    .delete()
    .eq("id", id)
    .select();

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
}
async function editClub(id) {

  const club =
    allClubs.find(
      item => String(item.id) === String(id)
    );

  if (!club) {

    alert("Klabu haijapatikana.");

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
    "Jina la klabu limebadilishwa."
  );

  await loadClubs();
}
window.addClub = addClub;
window.deleteClub = deleteClub;
window.editClub = editClub;
window.loadClubs = loadClubs;
async function loadPlayers() {

  if (!db) {
    alert("Supabase haijaunganishwa.");
    return;
  }

  const result = await db
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

  window.allPlayers =
    result.data || [];

  renderPlayers();
}
function renderPlayers() {

  const table =
    $("playersTable");

  if (!table) return;

  const players =
    window.allPlayers || [];

  const playerCount =
    document.getElementById("playerCount");

  const visiblePlayerCount =
    document.getElementById("visiblePlayerCount");

  if (playerCount) {
    playerCount.textContent =
      String(players.length);
  }

  if (visiblePlayerCount) {
    visiblePlayerCount.textContent =
      String(players.length);
  }

  if (!players.length) {

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
    players.map(
      (player, index) => {

        const clubName =
  player.clubs?.name || "—";

        const fullName =
          [
            player.first_name,
            player.middle_name,
            player.last_name
          ]
            .filter(Boolean)
            .join(" ");

        const photo =
          player.photo_url
            ? `
              <img
                src="${player.photo_url}"
                alt="${fullName}"
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
              ${fullName || "—"}
            </td>

            <td>
              ${clubName}
            </td>

            <td>
              ${player.position || "—"}
            </td>

            <td>
              ${player.jersey_number || "—"}
            </td>

            <td>
              ${player.status || "—"}
            </td>

            <td>

              <button
                type="button"
                onclick="editPlayer('${player.id}')">

                ✏️ Hariri

              </button>

              <button
                type="button"
                onclick="deletePlayer('${player.id}')">

                🗑️ Futa

              </button>

            </td>

          </tr>
        `;
      }
    )
    .join("");
}

if (playersButton) {

  playersButton.addEventListener(
    "click",
    loadPlayers
  );

}
const playersRefreshBtn =
  $("refreshPlayersBtn");

if (playersRefreshBtn) {

  playersRefreshBtn.addEventListener(
    "click",
    loadPlayers
  );

}
const playersButton =
  document.querySelector(
    '[data-page="players"]'
  );

if (playersButton) {

  playersButton.addEventListener(
    "click",
    loadPlayers
  );

}
async function addPlayer() {

  const firstName =
    $("playerFirstName")?.value.trim();

  if (!firstName) {

    alert(
      "Tafadhali weka jina la kwanza la mchezaji."
    );

    return;
  }

  const playerIdNumber =
    $("playerIdNumber")?.value.trim();

  if (playerIdNumber) {

    const exists =
      await playerExists(
        playerIdNumber
      );

    if (exists) {

      alert(
        "Namba ya mchezaji tayari ipo."
      );

      return;
    }
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
      $("playerPosition")?.value || null,

    jersey_number:
      $("playerJerseyNumber")?.value || null,

    photo_url:
      $("playerPhotoUrl")?.value.trim() || null,

    player_id_number:
      $("playerIdNumber")?.value.trim() || null,

    phone:
      $("playerPhone")?.value.trim() || null,

    address:
      $("playerAddress")?.value.trim() || null,

    status:
      $("playerStatus")?.value || "active"
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

  await loadPlayers();
}
async function playerExists(playerIdNumber) {

  if (!playerIdNumber) return false;

  const result =
    await db
      .from("players")
      .select("id")
      .eq(
        "player_id_number",
        playerIdNumber
      )
      .limit(1);

  if (result.error) {

    console.error(
      "Imeshindikana kukagua mchezaji:",
      result.error.message
    );

    return false;
  }

  return result.data?.length > 0;
}
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
window.addPlayer = addPlayer;
window.loadPlayers = loadPlayers;
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

  if (!select) return;

  select.innerHTML = `
  <option value="">
    Chagua Klabu
  </option>
`;

if (editSelect) {
  editSelect.innerHTML = `
    <option value="">
      Chagua Klabu
    </option>
  `;
}

  (result.data || []).forEach(
    club => {

      const option =
        document.createElement("option");

      option.value =
  club.id;

option.textContent =
  club.name;

select.appendChild(option);

if (editSelect) {

  const editOption =
    document.createElement("option");

  editOption.value =
    club.id;

  editOption.textContent =
    club.name;

  editSelect.appendChild(editOption);
}
  }
);
}
loadPlayerClubs();
async function deletePlayer(id) {

  if (
    !confirm(
      "Una uhakika unataka kufuta mchezaji huyu?"
    )
  ) {
    return;
  }

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
}

window.deletePlayer = deletePlayer;
async function editPlayer(id) {

  const player =
    (window.allPlayers || []).find(
      item => String(item.id) === String(id)
    );

  if (!player) {

    alert(
      "Mchezaji hakupatikana."
    );

    return;
  }
  const clubSelect =
  $("editPlayerClubId");
  if (clubSelect) {
  clubSelect.value =
    player.club_id || "";
}

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

  const middleName =
    prompt(
      "Middle Name:",
      player.middle_name || ""
    );

  if (middleName === null) return;

  const lastName =
    prompt(
      "Last Name:",
      player.last_name || ""
    );

  if (lastName === null) return;

  if (!lastName.trim()) {

    alert(
      "Last Name haiwezi kuwa tupu."
    );

    return;
  }
  const selectedClubId =
  $("editPlayerClubId")?.value || "";

if (!selectedClubId) {
  alert("Tafadhali chagua Klabu.");
  return;
}

  const dateOfBirth =
    prompt(
      "Date of Birth (YYYY-MM-DD):",
      player.date_of_birth || ""
    );

  if (dateOfBirth === null) return;

  const nationality =
    prompt(
      "Nationality:",
      player.nationality || ""
    );

  if (nationality === null) return;

  const position =
    prompt(
      "Position (GK, DF, MF, FW):",
      player.position || ""
    );

  if (position === null) return;

  const jerseyNumber =
    prompt(
      "Jersey Number:",
      player.jersey_number || ""
    );

  if (jerseyNumber === null) return;

  const phone =
    prompt(
      "Phone:",
      player.phone || ""
    );

  if (phone === null) return;

  const address =
    prompt(
      "Address:",
      player.address || ""
    );

  if (address === null) return;

  const playerIdNumber =
    prompt(
      "Player ID Number:",
      player.player_id_number || ""
    );

  if (playerIdNumber === null) return;

  const photoUrl =
    prompt(
      "Photo URL:",
      player.photo_url || ""
    );

  if (photoUrl === null) return;

  const status =
    prompt(
      "Status (active, inactive, suspended):",
      player.status || "active"
    );

  if (status === null) return;

  const result =
    await db
      .from("players")
      .update({

        first_name:
          firstName.trim(),

        middle_name:
          middleName.trim() || null,

        last_name:
          lastName.trim(),
        club_id:
  selectedClubId || null,

        date_of_birth:
          dateOfBirth || null,

        nationality:
          nationality.trim() || null,

        position:
          position.trim() || null,

        jersey_number:
          jerseyNumber || null,

        phone:
          phone.trim() || null,

        address:
          address.trim() || null,

        player_id_number:
          playerIdNumber.trim() || null,

        photo_url:
          photoUrl.trim() || null,

        status:
          status.trim() || "active"

      })
      .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kuhariri mchezaji: " +
      result.error.message
    );

    return;
  }

  alert(
    "Taarifa za mchezaji zimebadilishwa kikamilifu."
  );

  await loadPlayers();
}

window.editPlayer = editPlayer;

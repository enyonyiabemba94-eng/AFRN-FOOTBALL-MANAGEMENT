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
      () => {
        showPage(
          button.dataset.page
        );
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
const addClubBtn =
  $("addClubBtn");

if (addClubBtn) {

  addClubBtn.addEventListener(
    "click",
    addClub
  );

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

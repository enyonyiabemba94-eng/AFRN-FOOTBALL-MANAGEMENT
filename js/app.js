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

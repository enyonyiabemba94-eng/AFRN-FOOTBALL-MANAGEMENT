/* =========================================================
   AFRN FOOTBALL MANAGEMENT
   MAIN APPLICATION
   APP.JS — KIPANDE 1/8
   ========================================================= */

"use strict";

/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let db = null;

let allClubs = [];
let allPlayers = [];
let allContracts = [];
let allTransfers = [];
let allCompetitions = [];
let allMatches = [];


/* =========================================================
   HELPER
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
    player?.first_name,
    player?.middle_name,
    player?.last_name
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Bila jina";
}


function showStatus(id, message, type = "") {

  const element = $(id);

  if (!element) return;

  element.textContent = message;

  element.className = "status";

  if (type) {
    element.classList.add(type);
  }
}


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

function getDatabase() {

  console.log(
    "AFRN: Checking Supabase..."
  );

  console.log(
    "window.supabase:",
    window.supabase
  );

  console.log(
    "window.supabaseClient:",
    window.supabaseClient
  );

  if (
    window.supabaseClient &&
    typeof window.supabaseClient.from === "function"
  ) {

    db = window.supabaseClient;

    console.log(
      "AFRN: Supabase client FOUND."
    );

    return true;
  }

  console.error(
    "AFRN: Supabase client HAIPATIKANI."
  );

  return false;
}


/* =========================================================
   TEST SUPABASE
   ========================================================= */

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

    console.log(
      "AFRN SUPABASE TEST:",
      result
    );

    if (result.error) {
      throw result.error;
    }

    showStatus(
      "connectionStatus",
      "Supabase imeunganishwa tayari.",
      "success"
    );

    return true;

  } catch (error) {

    console.error(
      "AFRN SUPABASE ERROR:",
      error
    );

    showStatus(
      "connectionStatus",
      "Tatizo la Supabase: " +
      error.message,
      "error"
    );

    return false;
  }
}


/* =========================================================
   START CHECK
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "AFRN Football Management inaanza..."
    );

    const connected =
      getDatabase();

    console.log(
      "AFRN DATABASE RESULT:",
      connected
    );

    if (connected) {

      await testConnection();

    } else {

      showStatus(
        "connectionStatus",
        "Supabase client haipatikani.",
        "error"
      );

    }

  }
);


console.log(
  "AFRN APP.JS IMESOMA — KIPANDE 1"
);
/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(function(page) {

      page.classList.remove("active");

    });

  document
    .querySelectorAll(".nav-btn")
    .forEach(function(button) {

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
    .forEach(function(button) {

      button.addEventListener(
        "click",
        function() {

          const pageName =
            button.dataset.page;

          showPage(pageName);

        }
      );

    });

}


console.log(
  "AFRN APP.JS — NAVIGATION READY"
);
/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  if (!db) return;

  console.log("AFRN: Loading dashboard...");

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

  console.log(
    "AFRN: Dashboard clubs/players loaded."
  );
}
/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "AFRN: Application inaanza..."
    );

    const connected =
      getDatabase();

    if (connected) {

      const connectionOK =
        await testConnection();

      if (connectionOK) {

        await loadDashboard();

        console.log(
          "AFRN: Supabase iko tayari."
        );

      }

    } else {

      showStatus(
        "connectionStatus",
        "Supabase client haipatikani.",
        "error"
      );

    }

    setupNavigation();

  }
);


console.log(
  "AFRN APP.JS IMEKAMILIKA — SEHEMU YA MWANZO"
);
/* =========================================================
   CONNECTION TEST
   ========================================================= */

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
      "AFRN: CONNECTION OK"
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
      "AFRN CONNECTION ERROR:",
      error
    );

    return false;
  }
}
/* =========================================================
   CLUBS — LOAD
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
      "Tatizo: " +
      result.error.message,
      "error"
    );

    console.error(
      "AFRN CLUBS ERROR:",
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

  console.log(
    "AFRN CLUBS:",
    allClubs
  );
}
/* =========================================================
   CLUBS — RENDER
   ========================================================= */

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
                type="button">
                ✏️
              </button>

              <button
                type="button">
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
/* =========================================================
   CLUBS — NAVIGATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const clubsButton =
      document.querySelector(
        '[data-page="clubs"]'
      );

    if (!clubsButton) return;

    clubsButton.addEventListener(
      "click",
      async () => {

        console.log(
          "AFRN: Ukurasa wa Vilabu umefunguliwa."
        );

        await loadClubs();

      }
    );

  }
);

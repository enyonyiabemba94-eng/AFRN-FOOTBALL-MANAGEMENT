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

  ${
    club.logo_url
      ? `
        <img
          src="${escapeHTML(club.logo_url)}"
          alt="Logo"
          style="
            width:45px;
            height:45px;
            object-fit:contain;
            vertical-align:middle;
            margin-right:8px;
            border-radius:8px;
          "
        >
      `
      : `
        <span
          style="
            display:inline-block;
            width:45px;
            height:45px;
            line-height:45px;
            text-align:center;
            border:1px solid #ddd;
            border-radius:8px;
            margin-right:8px;
          "
        >⚽</span>
      `
  }

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
/* =========================================================
   CLUBS — NAVIGATION
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(".nav-btn")
    .forEach(function(button) {

      button.addEventListener(
        "click",
        async function() {

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

        }
      );

    });

}
/* =========================================================
   EDIT CLUB
   ========================================================= */

async function editClub(id) {

  if (!db) {
    alert("Supabase haijaunganishwa.");
    return;
  }

  const club = allClubs.find(
    item => String(item.id) === String(id)
  );

  if (!club) {
    alert("Klabu haijapatikana.");
    return;
  }

  const newName = prompt(
    "Badilisha jina la klabu:",
    club.name || ""
  );

  if (newName === null) {
    return;
  }

  if (!newName.trim()) {
    alert("Jina la klabu haliwezi kuwa tupu.");
    return;
  }

  const result = await db
    .from("clubs")
    .update({
      name: newName.trim()
    })
    .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kuhariri klabu: " +
      result.error.message
    );

    console.error(
      "AFRN EDIT CLUB ERROR:",
      result.error
    );

    return;
  }

  alert("Klabu imehaririwa kikamilifu.");

  await loadClubs();
  await loadDashboard();
}


/* =========================================================
   MAKE EDIT CLUB AVAILABLE
   ========================================================= */

window.editClub = editClub;
/* =========================================================
   DELETE CLUB
   ========================================================= */

async function deleteClub(id) {

  if (!db) {
    alert("Supabase haijaunganishwa.");
    return;
  }

  const club = allClubs.find(
    item => String(item.id) === String(id)
  );

  if (!club) {
    alert("Klabu haijapatikana.");
    return;
  }

  const confirmed = confirm(
    "Una uhakika unataka kufuta klabu: " +
    club.name +
    "?"
  );

  if (!confirmed) {
    return;
  }

  const result = await db
    .from("clubs")
    .delete()
    .eq("id", id);

  if (result.error) {

    alert(
      "Imeshindikana kufuta klabu: " +
      result.error.message
    );

    console.error(
      "AFRN DELETE CLUB ERROR:",
      result.error
    );

    return;
  }

  alert("Klabu imefutwa kikamilifu.");

  await loadClubs();
  await loadDashboard();
}


/* =========================================================
   MAKE DELETE CLUB AVAILABLE
   ========================================================= */

window.deleteClub = deleteClub;
/* =========================================================
   CLUB LOGO PREVIEW
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const logoInput =
      $("clubLogoFile");

    const preview =
      $("clubLogoPreview");

    const previewImage =
      $("clubLogoPreviewImage");

    if (!logoInput) return;

    logoInput.addEventListener(
      "change",
      function () {

        const file =
          logoInput.files?.[0];

        if (!file) {

          if (preview) {
            preview.style.display = "none";
          }

          return;
        }

        if (!file.type.startsWith("image/")) {

          alert(
            "Tafadhali chagua picha ya logo."
          );

          logoInput.value = "";

          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          function (event) {

            if (previewImage) {

              previewImage.src =
                event.target.result;
            }

            if (preview) {

              preview.style.display =
                "block";
            }

          };

        reader.readAsDataURL(file);

      }
    );

  }
);
/* =========================================================
   CLUB LOGO PREVIEW
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const logoInput =
      $("clubLogoFile");

    const preview =
      $("clubLogoPreview");

    const previewImage =
      $("clubLogoPreviewImage");

    if (!logoInput) return;

    logoInput.addEventListener(
      "change",
      function () {

        const file =
          logoInput.files?.[0];

        if (!file) {

          if (preview) {
            preview.style.display = "none";
          }

          return;
        }

        if (!file.type.startsWith("image/")) {

          alert(
            "Tafadhali chagua picha ya logo."
          );

          logoInput.value = "";

          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          function (event) {

            if (previewImage) {
              previewImage.src =
                event.target.result;
            }

            if (preview) {
              preview.style.display =
                "block";
            }

          };

        reader.readAsDataURL(file);

      }
    );

  }
);
/* =========================================================
   ADD CLUB + LOGO UPLOAD
   ========================================================= */

async function addClub() {

  if (!db) {
    alert("Supabase haijaunganishwa.");
    return;
  }

  const name =
    $("clubName")?.value.trim();

  if (!name) {
    alert("Tafadhali weka jina la klabu.");
    return;
  }

  const logoInput =
    $("clubLogoFile");

  const logoFile =
    logoInput?.files?.[0];

  let logoUrl = null;


  /* =======================================================
     UPLOAD LOGO
     ======================================================= */

  if (logoFile) {

    if (!logoFile.type.startsWith("image/")) {

      alert(
        "Tafadhali chagua picha ya logo."
      );

      return;
    }

    const fileExtension =
      logoFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName =
      "club-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 8) +
      "." +
      fileExtension;

    const filePath =
      "clubs/logos/" +
      fileName;


    const uploadResult =
      await db.storage
        .from("AFRN FILES")
        .upload(
          filePath,
          logoFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: logoFile.type
          }
        );


    if (uploadResult.error) {

      alert(
        "Logo haikuweza kupakiwa: " +
        uploadResult.error.message
      );

      console.error(
        "AFRN LOGO UPLOAD ERROR:",
        uploadResult.error
      );

      return;
    }


    /* =====================================================
       GET PUBLIC URL
       ===================================================== */

    const publicResult =
      db.storage
        .from("AFRN FILES")
        .getPublicUrl(filePath);

    logoUrl =
      publicResult.data?.publicUrl || null;


    if (!logoUrl) {

      alert(
        "Logo imepakiwa lakini URL haikupatikana."
      );

      return;
    }

  }


  /* =======================================================
     CLUB DATA
     ======================================================= */

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
      logoUrl,

    status:
      $("clubStatusSelect")?.value || "active"
  };


  /* =======================================================
     INSERT CLUB
     ======================================================= */

  const result =
    await db
      .from("clubs")
      .insert(data)
      .select()
      .single();


  if (result.error) {

    alert(
      "Imeshindikana kuongeza klabu: " +
      result.error.message
    );

    console.error(
      "AFRN ADD CLUB ERROR:",
      result.error
    );

    return;
  }


  alert(
    "Klabu na logo yake vimehifadhiwa kikamilifu."
  );


  /* =======================================================
     RESET FORM
     ======================================================= */

  const form =
    $("clubForm");

  if (form) {
    form.reset();
  }


  if ($("clubLogoPreview")) {

    $("clubLogoPreview").style.display =
      "none";

  }


  if ($("clubLogoPreviewImage")) {

    $("clubLogoPreviewImage").src =
      "";

  }


  await loadClubs();

  await loadDashboard();

}


window.addClub = addClub;


/* =========================================================
   CLUB FORM SUBMIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const form =
      $("clubForm");

    if (!form) return;

    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        await addClub();

      }
    );

  }
);

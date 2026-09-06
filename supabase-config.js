/* =========================================================
   AFRN FOOTBALL MANAGEMENT
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
  "https://jjqhvruppafpumcthmwe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G";

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  console.error(
    "AFRN: Supabase library haijapakiwa."
  );

} else {

  window.supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

  /* Official AFRN Player ID compatibility. */
  if (!Object.prototype.hasOwnProperty.call(Object.prototype, "afrn_player_id")) {
    Object.defineProperty(Object.prototype, "afrn_player_id", {
      configurable: true,
      enumerable: false,
      get() {
        if (
          this &&
          Object.prototype.hasOwnProperty.call(this, "player_id_number")
        ) {
          return this.player_id_number || null;
        }
        return undefined;
      },
      set(value) {
        Object.defineProperty(this, "afrn_player_id", {
          value,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    });
  }

  console.log(
    "AFRN: Supabase client CREATED. Official Player ID = player_id_number."
  );

}

/* =========================================================
   AFRN OFFICIAL LICENCE NUMBERING
   Format: AFRN-[YEAR]-[TEAM CODE]-[TEAM REGISTRATION NO]
   Example: AFRN-2026-ADF-00001

   Player ID is permanent.
   Licence number belongs to the player's registration at a
   particular club in a particular year.
========================================================= */

window.addEventListener("load", function(){

  setTimeout(function(){

    window.afrnGenerateLicenseById = async function(id){

      try {

        const client = window.supabaseClient;

        const transferResult = await client
          .from("transfers")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (transferResult.error) {
          alert("❌ Imeshindikana kusoma Transfer: " + transferResult.error.message);
          return;
        }

        const t = transferResult.data;
        if (!t) {
          alert("❌ Transfer haijapatikana.");
          return;
        }

        const [playerResult, fromResult, toResult] = await Promise.all([
          client.from("players").select("*").eq("id", t.player_id).maybeSingle(),
          client.from("clubs").select("*").eq("id", t.from_club_id).maybeSingle(),
          client.from("clubs").select("*").eq("id", t.to_club_id).maybeSingle()
        ]);

        const p = playerResult.data;
        const from = fromResult.data;
        const to = toResult.data;

        if (!to) {
          alert("❌ Klabu ya sasa haijapatikana.");
          return;
        }

        const meta = typeof window.readNotes === "function"
          ? window.readNotes(t.notes)
          : {};

        const registrationDate =
          t.transfer_date || new Date().toISOString().slice(0,10);

        const year =
          String(registrationDate).slice(0,4) ||
          String(new Date().getFullYear());

        function teamCode(club){

          const explicit = String(club?.club_code || "")
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

          if (explicit) return explicit.slice(0,8);

          let name = String(club?.name || "TEAM")
            .toUpperCase()
            .trim()
            .replace(/[^A-Z0-9 ]/g, " ")
            .replace(/\s+/g, " ");

          const parts = name.split(" ").filter(Boolean);

          if (
            parts.length > 1 &&
            /^(D|AB|AEF|CD|GHI)\d+$/.test(parts[0])
          ) {
            parts.shift();
          }

          if (!parts.length) return "TEAM";
          if (parts.length === 1) return parts[0].slice(0,6);

          return parts.map(x => x[0]).join("").slice(0,6);
        }

        const code = teamCode(to);

        /*
           IMPORTANT:
           Count registrations for THIS TEAM + THIS YEAR.
           We do not use players.id or transfers.id as the
           registration sequence.
        */
        const registrationsResult = await client
          .from("player_licenses")
          .select("id, player_id, license_number")
          .eq("club_id", t.to_club_id)
          .eq("season", year);

        let existingLicense = null;

        if (!registrationsResult.error) {
          existingLicense = (registrationsResult.data || [])
            .find(row => String(row.player_id) === String(t.player_id)) || null;
        }

        let registrationNo;
        let licenseNumber;

        if (existingLicense?.license_number) {

          /* Reuse the existing licence for the same player/team/year. */
          licenseNumber = existingLicense.license_number;

          const match = String(licenseNumber)
            .match(/^AFRN-\d{4}-[^-]+-(\d+)$/);

          registrationNo = match
            ? String(match[1]).padStart(5,"0")
            : "";

        } else {

          let count = 0;

          if (!registrationsResult.error) {
            count = (registrationsResult.data || []).length;
          } else {
            /* If licence records cannot be read, count completed transfers. */
            const fallback = await client
              .from("transfers")
              .select("id")
              .eq("to_club_id", t.to_club_id)
              .gte("transfer_date", `${year}-01-01`)
              .lt("transfer_date", `${Number(year)+1}-01-01`)
              .neq("status", "CANCELLED");

            if (fallback.error) {
              alert("❌ Imeshindikana kuhesabu usajili wa timu: " + fallback.error.message);
              return;
            }

            count = (fallback.data || []).length;
          }

          registrationNo =
            String(count + 1).padStart(5,"0");

          licenseNumber =
            `AFRN-${year}-${code}-${registrationNo}`;
        }

        const licenseData = {
          player_id: t.player_id,
          club_id: t.to_club_id,
          from_club_id: t.from_club_id,
          license_number: licenseNumber,
          season: year,
          registration_date: registrationDate,
          registration_type: t.transfer_type,
          loan_type: meta.loan_type || null,
          status: "ACTIVE",
          issue_date: existingLicense?.issue_date || new Date().toISOString().slice(0,10),
          expiry_date: meta.contract_end || null,
          photo_url: p?.photo_url || p?.photo || null,
          notes: JSON.stringify({
            league: meta.league_name || null,
            loan_months: meta.loan_months || null,
            team_code: code,
            team_registration_no: registrationNo,
            generated_by: "AFRN Official Licence Numbering"
          })
        };

        /* Insert a new licence only when this registration does not exist. */
        if (!existingLicense) {
          const saveResult = await client
            .from("player_licenses")
            .insert(licenseData);

          if (saveResult.error) {
            console.warn("Licence haijahifadhiwa:", saveResult.error.message);
          }
        }

        if (typeof window.openLicense === "function") {
          window.openLicense(licenseData, p, from, to, meta);
        }

      } catch (error) {
        console.error("AFRN Licence error:", error);
        alert("❌ Hitilafu wakati wa kutengeneza Licence: " + error.message);
      }
    };

    /*
       The old transfers.html contains its own generateLicenseById().
       Replace the button handlers directly so the old UUID-based
       function can no longer be called by the Licence buttons.
    */
    document.querySelectorAll('button[onclick*="generateLicenseById"]').forEach(function(button){
      const match = button.getAttribute("onclick")?.match(/generateLicenseById\('([^']+)'\)/);
      if (!match) return;
      const transferId = match[1];
      button.onclick = function(event){
        event.preventDefault();
        window.afrnGenerateLicenseById(transferId);
      };
      button.removeAttribute("onclick");
    });

    console.log(
      "AFRN: Licence buttons locked to official YEAR + TEAM + REGISTRATION numbering."
    );

  }, 0);

});

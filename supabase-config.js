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

  /*
     AFRN PLAYER ID COMPATIBILITY
     --------------------------------
     players.id is the internal UUID.
     players.player_id_number is the official AFRN Player ID.

     Existing AFRN pages may still read p.afrn_player_id.
     This compatibility getter makes that legacy property
     resolve to the official player_id_number without changing
     the database, tables, relationships, or stored data.
  */
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
   AFRN LICENCE NUMBERING
   --------------------------------
   Licence format:
   AFRN-[YEAR]-[TEAM-ID]-[TEAM REGISTRATION NO]

   Example:
   AFRN-2026-ADF-00004

   Player ID remains permanent and is NOT used as the
   team's registration sequence.

   The sequence is based on real records in player_licenses
   for the same team and year. If the same player already has
   a licence for that team/year, the existing licence number is
   reused instead of creating a second number.

   No database/table creation or deletion is performed here.
========================================================= */

window.addEventListener("load", function(){

  setTimeout(function(){

    window.generateLicenseById = async function(id){

      try {

        /* Get the transfer directly from the existing database. */
        const transferResult = await window.supabaseClient
          .from("transfers")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (transferResult.error) {
          console.error(transferResult.error);
          alert("❌ Imeshindikana kusoma Transfer: " + transferResult.error.message);
          return;
        }

        const t = transferResult.data;

        if (!t) {
          alert("Transfer haijapatikana.");
          return;
        }

        /* Get player and both clubs from the existing tables. */
        const [playerResult, fromResult, toResult] = await Promise.all([

          window.supabaseClient
            .from("players")
            .select("*")
            .eq("id", t.player_id)
            .maybeSingle(),

          window.supabaseClient
            .from("clubs")
            .select("*")
            .eq("id", t.from_club_id)
            .maybeSingle(),

          window.supabaseClient
            .from("clubs")
            .select("*")
            .eq("id", t.to_club_id)
            .maybeSingle()
        ]);

        if (playerResult.error) {
          console.warn("Player lookup warning:", playerResult.error.message);
        }

        if (toResult.error) {
          console.warn("Club lookup warning:", toResult.error.message);
        }

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
          t.transfer_date ||
          new Date().toISOString().slice(0,10);

        const year = String(registrationDate).slice(0,4) ||
          String(new Date().getFullYear());

        /*
           Prefer club_code when it exists.
           Current clubs may have NULL club_code, so use a
           stable short code from the club name as fallback.
        */
        function teamCode(club){

          const explicit = String(club?.club_code || "")
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

          if (explicit) {
            return explicit.slice(0,8);
          }

          let name = String(club?.name || "TEAM")
            .toUpperCase()
            .trim()
            .replace(/[^A-Z0-9 ]/g, " ")
            .replace(/\s+/g, " ");

          const parts = name.split(" ").filter(Boolean);

          /* Ignore common division prefixes such as D1, AB1, GHI1. */
          if (
            parts.length > 1 &&
            /^(D|AB|AEF|CD|GHI)\d+$/.test(parts[0])
          ) {
            parts.shift();
          }

          if (!parts.length) return "TEAM";

          if (parts.length === 1) {
            return parts[0].slice(0,6);
          }

          return parts.map(x => x[0]).join("").slice(0,6);
        }

        const code = teamCode(to);

        /*
           If this player already has a licence for this team and
           year, reuse it. This prevents repeated clicks from
           changing AFRN-2026-ADF-00004 into 00005, etc.
        */
        const existingLicenseResult = await window.supabaseClient
          .from("player_licenses")
          .select("*")
          .eq("player_id", t.player_id)
          .eq("club_id", t.to_club_id)
          .eq("season", year)
          .maybeSingle();

        let existingLicense = null;

        if (!existingLicenseResult.error) {
          existingLicense = existingLicenseResult.data;
        } else {
          console.warn(
            "Existing licence lookup warning:",
            existingLicenseResult.error.message
          );
        }

        let registrationNo = "";
        let licenseNumber = "";

        if (existingLicense?.license_number) {

          licenseNumber = existingLicense.license_number;

          const match = String(licenseNumber).match(
            /^AFRN-\d{4}-[^-]+-(\d+)$/
          );

          registrationNo = match
            ? String(match[1]).padStart(5, "0")
            : "";

        } else {

          /*
             Count actual licence registrations for THIS TEAM and
             THIS YEAR. This includes registrations created from
             other pages, not only transfers.
          */
          const registrationsResult = await window.supabaseClient
            .from("player_licenses")
            .select("license_number, player_id")
            .eq("club_id", t.to_club_id)
            .eq("season", year);

          if (registrationsResult.error) {

            console.warn(
              "player_licenses count failed; using transfer history:",
              registrationsResult.error.message
            );

            const startDate = `${year}-01-01`;
            const endDate = `${Number(year) + 1}-01-01`;

            const fallbackResult = await window.supabaseClient
              .from("transfers")
              .select("id")
              .eq("to_club_id", t.to_club_id)
              .gte("transfer_date", startDate)
              .lt("transfer_date", endDate)
              .neq("status", "CANCELLED");

            if (fallbackResult.error) {
              alert("❌ Imeshindikana kuhesabu usajili wa timu: " + fallbackResult.error.message);
              return;
            }

            registrationNo = String(
              (fallbackResult.data || []).filter(
                row => String(row.id) !== String(t.id)
              ).length + 1
            ).padStart(5, "0");

          } else {

            registrationNo = String(
              (registrationsResult.data || []).length + 1
            ).padStart(5, "0");

          }

          licenseNumber =
            `AFRN-${year}-${code}-${registrationNo}`;
        }

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
            year,

          registration_date:
            registrationDate,

          registration_type:
            t.transfer_type,

          loan_type:
            meta.loan_type || null,

          status:
            "ACTIVE",

          issue_date:
            existingLicense?.issue_date ||
            new Date().toISOString().slice(0,10),

          expiry_date:
            meta.contract_end || null,

          photo_url:
            p?.photo_url ||
            p?.photo ||
            null,

          notes:
            JSON.stringify({
              league: meta.league_name || null,
              loan_months: meta.loan_months || null,
              team_code: code,
              team_registration_no: registrationNo,
              generated_by: "AFRN Licence Numbering v3"
            })
        };

        /* Save using the existing player_licenses table. */
        try {

          const saveResult = await window.supabaseClient
            .from("player_licenses")
            .upsert(
              licenseData,
              { onConflict: "license_number" }
            );

          if (saveResult.error) {
            console.warn(
              "Licence haijahifadhiwa kwenye player_licenses:",
              saveResult.error.message
            );
          }

        } catch (saveError) {
          console.warn("Licence save warning:", saveError);
        }

        if (typeof window.openLicense === "function") {
          window.openLicense(
            licenseData,
            p,
            from,
            to,
            meta
          );
        } else {
          alert("❌ Mfumo wa kuonyesha Licence haujapatikana.");
        }

      } catch (error) {

        console.error("AFRN Licence error:", error);
        alert("❌ Hitilafu wakati wa kutengeneza Licence: " + error.message);

      }

    };

    console.log(
      "AFRN: Licence numbering enabled = AFRN-YEAR-TEAM-REGISTRATION."
    );

  }, 0);

});

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

   This is intentionally implemented in the existing config
   so the current transfers.html can use the new numbering
   without changing the database schema or existing tables.
========================================================= */

window.addEventListener("load", function(){

  setTimeout(function(){

    if (typeof window.generateLicenseById !== "function") {
      return;
    }

    window.generateLicenseById = async function(id){

      const t = (window.transfers || []).find(
        x => String(x.id) === String(id)
      );

      if (!t) {
        alert("Transfer haijapatikana.");
        return;
      }

      const p = (window.players || []).find(
        x => String(x.id) === String(t.player_id)
      );

      const clubsList = window.clubs || [];

      const from = clubsList.find(
        c => String(c.id) === String(t.from_club_id)
      );

      const to = clubsList.find(
        c => String(c.id) === String(t.to_club_id)
      );

      if (!to) {
        alert("❌ Klabu ya sasa haijapatikana.");
        return;
      }

      const meta = typeof window.readNotes === "function"
        ? window.readNotes(t.notes)
        : {};

      const year = String(
        (t.transfer_date || new Date().toISOString().slice(0,10))
      ).slice(0,4) || String(new Date().getFullYear());

      /*
         Prefer the official club_code when available.
         Existing clubs may have club_code = NULL, therefore
         generate a stable short code from the club name as a
         fallback. Division prefixes such as D1/GHI1/AB1 are
         ignored when possible.
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

        if (parts.length > 1 && /^(D|AB|AEF|CD|GHI)\d+$/.test(parts[0])) {
          parts.shift();
        }

        if (!parts.length) {
          return "TEAM";
        }

        if (parts.length === 1) {
          return parts[0].slice(0,6);
        }

        return parts.map(x => x[0]).join("").slice(0,6);
      }

      const code = teamCode(to);

      /*
         Determine the next registration number for THIS TEAM
         and THIS YEAR from existing transfer registrations.
         The current transfer is excluded so regenerating a
         licence does not change its number.
      */
      let maxRegistration = 0;

      (window.transfers || []).forEach(existing => {

        if (String(existing.id) === String(t.id)) {
          return;
        }

        const existingDate = String(existing.transfer_date || "");
        const existingYear = existingDate.slice(0,4);

        if (existingYear !== year) {
          return;
        }

        if (String(existing.to_club_id) !== String(t.to_club_id)) {
          return;
        }

        if (String(existing.status || "").toUpperCase() === "CANCELLED") {
          return;
        }

        /* New-format licence already present in notes is not
           required; the transfer itself is the registration event. */
        maxRegistration += 1;
      });

      const registrationNo = String(maxRegistration + 1)
        .padStart(5, "0");

      const licenseNumber =
        `AFRN-${year}-${code}-${registrationNo}`;

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
          t.transfer_date ||
          new Date().toISOString().slice(0,10),

        registration_type:
          t.transfer_type,

        loan_type:
          meta.loan_type || null,

        status:
          "ACTIVE",

        issue_date:
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
            generated_by: "AFRN Licence Numbering v2"
          })
      };

      /*
         Keep the existing database write. If the current
         player_licenses schema/RLS rejects the write, the
         official licence number is still displayed correctly
         on the licence card; no table is created, dropped or
         altered by this change.
      */
      try {

        const result = await window.supabaseClient
          .from("player_licenses")
          .upsert(
            licenseData,
            { onConflict: "license_number" }
          );

        if (result.error) {
          console.warn(
            "Licence haijahifadhiwa kwenye player_licenses:",
            result.error.message
          );
        }

      } catch (e) {
        console.warn("Licence save warning:", e);
      }

      if (typeof window.openLicense === "function") {
        window.openLicense(
          licenseData,
          p,
          from,
          to,
          meta
        );
      }

    };

    console.log(
      "AFRN: Licence numbering enabled = AFRN-YEAR-TEAM-REGISTRATION."
    );

  }, 0);

});

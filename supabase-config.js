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

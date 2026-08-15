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

  console.log(
    "AFRN: Supabase client CREATED."
  );

}

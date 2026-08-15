window.AFRN_SUPABASE_URL =
  "https://jjqhvruppafpumcthmwe.supabase.co";

window.AFRN_SUPABASE_ANON_KEY =
  "sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G";


if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {

  window.supabaseClient =
    window.supabase.createClient(
      window.AFRN_SUPABASE_URL,
      window.AFRN_SUPABASE_ANON_KEY
    );

  window.db =
    window.supabaseClient;

  console.log(
    "AFRN: Supabase client CREATED."
  );

} else {

  console.error(
    "AFRN ERROR: Supabase library haijapakiwa."
  );

}

/*
 * Supabase browser configuration.
 *
 * The publishable/anon key is safe to expose in a static frontend when
 * database permissions are protected by RLS. Never put a service-role key here.
 */
window.APP_CONFIG = window.APP_CONFIG || {
  supabaseUrl: "",
  supabaseAnonKey: "",
};

window.getSupabaseClient = function getSupabaseClient() {
  const config = window.APP_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
    return null;
  }
  if (!window.__supabaseClient) {
    window.__supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    );
  }
  return window.__supabaseClient;
};

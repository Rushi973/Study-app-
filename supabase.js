// supabase.js
window.sb = supabase.createClient(
  "https://YOUR_PROJECT_ID.supabase.co",   // Project URL
  "YOUR_ANON_PUBLIC_KEY"                   // anon public key
);

window.sbUser = async () => (await sb.auth.getUser()).data.user;

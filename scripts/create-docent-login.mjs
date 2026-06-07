import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const email = "docent@khalaf-bi.nl";
const password = "AttivaDemo2026!";

let userId;
const { data: created, error: cerr } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (cerr) {
  // Bestaat al → wachtwoord resetten
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  if (!existing) { console.error("Aanmaken mislukt:", cerr.message); process.exit(1); }
  userId = existing.id;
  await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  console.log("ℹ Bestaand account gevonden — wachtwoord opnieuw gezet.");
} else {
  userId = created.user.id;
  console.log("✓ Nieuw docent-account aangemaakt.");
}

const { error: perr } = await sb.from("profiles").upsert(
  { id: userId, full_name: "Docent (demo)", company: "Windesheim", role: "client", client_slug: "attiva" },
  { onConflict: "id" }
);
if (perr) { console.error("Profiel-fout:", perr.message); process.exit(1); }

console.log("✓ Profiel: role=client · client_slug=attiva (ziet het Attiva-dashboard)\n");
console.log("================ DOCENT-INLOG ================");
console.log("  URL:        https://khalaf-bi.vercel.app/login");
console.log("  E-mail:     " + email);
console.log("  Wachtwoord: " + password);
console.log("==============================================");

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

for (const key of ["leveranciers-per-jaar-2025", "leveranciers-per-jaar-2024"]) {
  const { data: row } = await sb.from("exact_data_cache").select("data, updated_at").eq("client_name", "attiva").eq("cache_key", key).maybeSingle();
  if (!row) { console.log(`${key}: BESTAAT NIET (route faalde of niet uitgevoerd)`); continue; }
  const d = row.data;
  console.log(`\n${key} (updated ${row.updated_at}):`);
  console.log(`  totaal: ${d.totaal} | aantalLeveranciers: ${d.aantalLeveranciers}`);
  console.log(`  top 8:`, JSON.stringify((d.leveranciers ?? []).slice(0, 8)));
}

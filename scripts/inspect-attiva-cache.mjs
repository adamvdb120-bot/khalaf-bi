import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// .env.local inlezen zonder secrets te printen
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) { console.error("env ontbreekt"); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false } });

// 1. Welke cache-keys bestaan voor attiva?
const { data: rows, error } = await sb
  .from("exact_data_cache")
  .select("cache_key, updated_at")
  .eq("client_name", "attiva");
if (error) { console.error(error); process.exit(1); }
console.log("=== CACHE KEYS (attiva) ===");
for (const r of rows.sort((a, b) => a.cache_key.localeCompare(b.cache_key))) {
  console.log(`${r.cache_key}\t(updated ${r.updated_at})`);
}

// 2. Voor elke financiele cache: jaar, maanden met data, categorieen
function maxPeriode(pl) {
  let m = 0;
  for (const r of pl) if (r.Period >= 1 && r.Period <= 12 && r.Period > m) m = r.Period;
  return m;
}
for (const r of rows) {
  const { data: row } = await sb
    .from("exact_data_cache")
    .select("data")
    .eq("client_name", "attiva")
    .eq("cache_key", r.cache_key)
    .single();
  const d = row?.data;
  if (!d) continue;
  const huidig = d.huidig ?? d;
  const pl = huidig?.pl;
  if (!Array.isArray(pl) || pl.length === 0) {
    console.log(`\n--- ${r.cache_key}: geen pl-data (waarschijnlijk AI/narratief-cache) ---`);
    continue;
  }
  console.log(`\n=== ${r.cache_key} | jaar=${huidig.jaar} | maanden t/m ${maxPeriode(pl)} | ${pl.length} pl-rijen ===`);
  // sample shape
  console.log("voorbeeld pl-rij:", JSON.stringify(pl[0]));
  // categorieen kosten
  const kosten = {}, omzet = {};
  for (const x of pl) {
    if (x.Period < 1 || x.Period > 12) continue;
    const map = x.IsRevenue ? omzet : kosten;
    map[x.Description] = (map[x.Description] || 0) + x.Amount;
  }
  const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])
    .map(([n, v]) => `   ${n}: ${Math.round(v).toLocaleString("nl-NL")}`).join("\n");
  console.log("  OMZET-categorieen:\n" + fmt(omzet));
  console.log("  KOSTEN-categorieen:\n" + fmt(kosten));
  // crediteuren shape
  const cred = huidig.crediteuren;
  if (Array.isArray(cred) && cred.length) console.log("  crediteuren voorbeeld:", JSON.stringify(cred[0]));
}

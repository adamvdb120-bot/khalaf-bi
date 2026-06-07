import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

for (const key of ["2025-2024", "2024-2023"]) {
  const { data: row } = await sb.from("exact_data_cache").select("data").eq("client_name", "attiva").eq("cache_key", key).single();
  const h = row?.data?.huidig;
  console.log(`\n=== ${key} (jaar ${h?.jaar}) ===`);
  const bs = h?.bankSaldo;
  if (!bs) { console.log("  geen bankSaldo veld"); continue; }
  console.log("  opening:", bs.opening);
  console.log("  perPeriode:", JSON.stringify(bs.perPeriode));
}

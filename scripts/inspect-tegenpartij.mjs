import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const { data: rows } = await sb.from("exact_data_cache").select("cache_key, data").eq("client_name", "attiva");
const keys = rows.map(r => r.cache_key).filter(k => k.startsWith("transacties-per-tegenpartij-kosten")).sort();
console.log("=== kosten-tegenpartij caches ===");
for (const k of keys) console.log("  " + k);

// structuur van één voorbeeld
const voorbeeld = rows.find(r => r.cache_key === "transacties-per-tegenpartij-kosten-2025-Management fee");
if (voorbeeld) {
  console.log("\n=== voorbeeld: Management fee 2025 ===");
  console.log(JSON.stringify(voorbeeld.data).slice(0, 600));
}

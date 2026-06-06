import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const pl = JSON.parse(readFileSync("C:\\Users\\adama\\Downloads\\Bankdata-2026-verwerkt\\dashboard_pl_2026.json", "utf8"));

// vorig jaar (2025) als vergelijkingsbasis ophalen uit de bestaande Exact-cache.
// (alleen als referentie voor YoY; de bankverwerking zelf gebruikt GEEN Exact-data)
const { data: row2025 } = await sb.from("exact_data_cache").select("data")
  .eq("client_name", "attiva").eq("cache_key", "2025-2024").single();
const vorig2025 = row2025?.data?.huidig ?? null;

const payload = {
  huidig: {
    jaar: 2026,
    bron: "bankimport",
    pl,
    bankSaldo: { opening: 0, perPeriode: [] },
    debiteuren: [],
    crediteuren: [],
    debiteurenRaw: [],
    crediteurenRaw: [],
    omzetPerKlant: [],
  },
  vorig: vorig2025
    ? { jaar: 2025, pl: vorig2025.pl ?? [], bankSaldo: vorig2025.bankSaldo ?? { opening: 0, perPeriode: [] }, debiteuren: [], crediteuren: [], omzetPerKlant: [] }
    : { jaar: 2025, pl: [], bankSaldo: { opening: 0, perPeriode: [] }, debiteuren: [], crediteuren: [], omzetPerKlant: [] },
};

const { error } = await sb.from("exact_data_cache").upsert({
  client_name: "attiva",
  cache_key: "bankimport-2026",
  data: payload,
  updated_at: new Date().toISOString(),
}, { onConflict: "client_name,cache_key" });

if (error) { console.error("FOUT:", error); process.exit(1); }
console.log("✓ bankimport-2026 geschreven.");
console.log("  2026 pl-rijen:", pl.length, "| 2025 vergelijking-pl-rijen:", payload.vorig.pl.length);
console.log("  omzet 2026:", pl.filter(r => r.IsRevenue).reduce((s, r) => s + r.Amount, 0).toLocaleString("nl-NL"));
console.log("  kosten 2026:", pl.filter(r => !r.IsRevenue).reduce((s, r) => s + r.Amount, 0).toLocaleString("nl-NL"));

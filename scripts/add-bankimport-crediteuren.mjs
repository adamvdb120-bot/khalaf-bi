import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

// ── CSV parser ──
function parseCsv(text) {
  const rows = []; let f = "", row = [], q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ";") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (f !== "" || row.length) { row.push(f); rows.push(row); row = []; f = ""; } if (c === "\r" && text[i + 1] === "\n") i++; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const rows = parseCsv(readFileSync("C:\\Users\\adama\\Downloads\\NL56INGB0008240617_01-01-2026_31-05-2026.csv", "utf8"));
const H = rows.shift();
const ix = (n) => H.indexOf(n);
const I = { datum: ix("Datum"), naam: ix("Naam / Omschrijving"), afbij: ix("Af Bij"), bedrag: ix("Bedrag (EUR)"), soort: ix("Mutatiesoort") };
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));

// ── aggregeer betaalde bedragen (Af) per tegenpartij, excl. privé-leningen ──
const map = {};
for (const r of rows) {
  if (!r[I.datum]) continue;
  const m = parseInt(r[I.datum].slice(4, 6), 10);
  if (parseInt(r[I.datum].slice(0, 4)) !== 2026 || m < 1 || m > 5) continue;
  if (r[I.afbij] !== "Af") continue;
  const bedrag = num(r[I.bedrag]);
  if (isNaN(bedrag)) continue;
  let naam = (r[I.naam] || "").trim();
  if (/lening/i.test(naam)) continue;                 // privé-leningen niet als leverancier
  if (!naam) naam = (r[I.soort] || "Onbekend").trim() + " (batch)";
  // normaliseer naam-varianten
  naam = naam.replace(/\s+/g, " ");
  const key = naam.toLowerCase();
  if (!map[key]) map[key] = { Name: naam, total: 0, n: 0 };
  map[key].total += bedrag; map[key].n++;
}

const top = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
// dashboard-shape: totaal in Age0to30 zodat d.totaal klopt; frontend toont GEEN aging-balk bij bankimport
const crediteuren = top.map(c => ({
  Name: c.Name, AccountCode: "",
  Age0to30: Math.round(c.total), Age31to60: 0, Age61to90: 0, Age90Plus: 0,
}));

// ── bestaande bankimport-2026 ophalen en crediteuren toevoegen ──
const { data: row } = await sb.from("exact_data_cache").select("data").eq("client_name", "attiva").eq("cache_key", "bankimport-2026").single();
if (!row?.data) { console.error("bankimport-2026 niet gevonden"); process.exit(1); }
const payload = row.data;
payload.huidig.crediteuren = crediteuren;

const { error } = await sb.from("exact_data_cache").upsert({
  client_name: "attiva", cache_key: "bankimport-2026", data: payload, updated_at: new Date().toISOString(),
}, { onConflict: "client_name,cache_key" });
if (error) { console.error("FOUT:", error); process.exit(1); }

console.log("✓ crediteuren (top betaalde leveranciers) toegevoegd aan bankimport-2026:");
for (const c of crediteuren) console.log(`  ${c.Name.slice(0, 45).padEnd(46)} €${c.Age0to30.toLocaleString("nl-NL")}`);

import { readFileSync } from "fs";

// ── ruwe bank-totalen ──
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
const I = { datum: ix("Datum"), afbij: ix("Af Bij"), bedrag: ix("Bedrag (EUR)") };
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));
let rawBij = 0, rawAf = 0, n = 0;
for (const r of rows) {
  if (!r[I.datum]) continue;
  const m = parseInt(r[I.datum].slice(4, 6), 10);
  if (parseInt(r[I.datum].slice(0, 4)) !== 2026 || m < 1 || m > 5) continue;
  const b = num(r[I.bedrag]); if (isNaN(b)) continue;
  if (r[I.afbij] === "Bij") rawBij += b; else rawAf += b; n++;
}

// ── verwerkte data ──
const J = JSON.parse(readFileSync("C:\\Users\\adama\\Downloads\\Bankdata-2026-verwerkt\\bankdata_2026_volledig.json", "utf8"));
const T = J.transacties_verwerkt;
const by = {};
for (const t of T) {
  const k = t.type + " " + t.richting;
  by[k] = (by[k] || 0) + t.bedrag;
}
const g = (k) => Math.round(by[k] || 0);
const eur = (v) => "€" + Math.round(v).toLocaleString("nl-NL");

console.log(`\nAantal transacties: ruw ${n} vs verwerkt ${T.length}  ${n === T.length ? "✓" : "✗ VERSCHIL"}`);

console.log("\n=== INKOMSTEN (Bij) — moet optellen tot bank-totaal ===");
const bijOmzet = g("omzet Bij"), bijPrive = g("privé Bij"), bijIntern = g("intern Bij"), bijOnb = g("onbekend Bij");
console.log(`  omzet:            ${eur(bijOmzet)}`);
console.log(`  privé (lening):   ${eur(bijPrive)}`);
console.log(`  intern:           ${eur(bijIntern)}`);
console.log(`  onbekend:         ${eur(bijOnb)}`);
const bijSom = bijOmzet + bijPrive + bijIntern + bijOnb;
console.log(`  -------------------------------`);
console.log(`  som verwerkt:     ${eur(bijSom)}`);
console.log(`  ruwe bank Bij:    ${eur(rawBij)}   ${Math.abs(bijSom - rawBij) < 1 ? "✓ sluit aan" : "✗ VERSCHIL " + eur(bijSom - rawBij)}`);

console.log("\n=== UITGAVEN (Af) — moet optellen tot bank-totaal ===");
const afKosten = g("kosten Af"), afPrive = g("privé Af"), afIntern = g("intern Af"), afOnb = g("onbekend Af");
console.log(`  kosten:           ${eur(afKosten)}`);
console.log(`  privé (lening):   ${eur(afPrive)}`);
console.log(`  intern:           ${eur(afIntern)}`);
console.log(`  onbekend:         ${eur(afOnb)}`);
const afSom = afKosten + afPrive + afIntern + afOnb;
console.log(`  -------------------------------`);
console.log(`  som verwerkt:     ${eur(afSom)}`);
console.log(`  ruwe bank Af:     ${eur(rawAf)}   ${Math.abs(afSom - rawAf) < 1 ? "✓ sluit aan" : "✗ VERSCHIL " + eur(afSom - rawAf)}`);

console.log("\n=== DASHBOARD-CIJFERS (alleen omzet & kosten) ===");
console.log(`  Omzet 2026:     ${eur(bijOmzet)}`);
console.log(`  Kosten 2026:    ${eur(afKosten)}`);
console.log(`  Resultaat 2026: ${eur(bijOmzet - afKosten)}`);
console.log(`\n  Let op: leningen (privé) en interne overboekingen zitten BEWUST niet in omzet/kosten.`);

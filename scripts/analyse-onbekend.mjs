import { readFileSync } from "fs";
const J = JSON.parse(readFileSync("C:\\Users\\adama\\Downloads\\Bankdata-2026-verwerkt\\bankdata_2026_volledig.json", "utf8"));
const onb = J.transacties_verwerkt.filter(t => t.type === "onbekend");
const af = onb.filter(t => t.richting === "Af");
const bij = onb.filter(t => t.richting === "Bij");
const eur = (v) => "€" + Math.round(v).toLocaleString("nl-NL");
console.log(`Onbekend: ${onb.length} tx | Af €${Math.round(af.reduce((s,t)=>s+t.bedrag,0)).toLocaleString("nl-NL")} (${af.length}) | Bij €${Math.round(bij.reduce((s,t)=>s+t.bedrag,0)).toLocaleString("nl-NL")} (${bij.length})`);

function topBy(arr) {
  const m = {};
  for (const t of arr) {
    const key = (t.omschrijving || "?").replace(/\s+/g, " ").trim();
    if (!m[key]) m[key] = { naam: key, total: 0, n: 0 };
    m[key].total += t.bedrag; m[key].n++;
  }
  return Object.values(m).sort((a, b) => b.total - a.total);
}
console.log("\n=== TOP ONBEKEND — UIT (Af) ===");
for (const x of topBy(af).slice(0, 20)) console.log(`  ${eur(x.total).padStart(10)}  (${x.n}x)  ${x.naam.slice(0, 55)}`);
console.log("\n=== TOP ONBEKEND — IN (Bij) ===");
for (const x of topBy(bij).slice(0, 15)) console.log(`  ${eur(x.total).padStart(10)}  (${x.n}x)  ${x.naam.slice(0, 55)}`);

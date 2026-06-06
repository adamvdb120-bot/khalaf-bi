import { readFileSync } from "fs";

const CSV = "C:\\Users\\adama\\Downloads\\NL56INGB0008240617_01-01-2026_31-05-2026.csv";
const raw = readFileSync(CSV, "utf8");

// ── eenvoudige parser voor quoted, ;-gescheiden CSV ──
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ";") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(raw);
const header = rows.shift();
// kolomindexen
const col = (n) => header.indexOf(n);
const iDatum = col("Datum"), iNaam = col("Naam / Omschrijving"), iAfBij = col("Af Bij"),
  iBedrag = col("Bedrag (EUR)"), iMed = col("Mededelingen"), iSoort = col("Mutatiesoort");

const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));
const MAAND = ["Jan", "Feb", "Mrt", "Apr", "Mei"];

// ── categorisatie-regels ──
function categorize(naam, med, soort) {
  const t = (naam + " " + med).toLowerCase();
  // 9. Management fee
  if (/attiva.*holding|m\.s\.holding/.test(t)) return "Management fee";
  // 8. Leningen (balans, apart)
  if (/lening/.test(t)) return "Leningen";
  // 6. Motorrijtuigenbelasting (Belastingdienst + tarief/kenteken)
  if (/belastingdienst/.test(t) && /(tarief|motorrijtuig|wegenbelast|\b[a-z0-9]{1,3}-[a-z0-9]{1,3}-[a-z0-9]{1,2}\b)/.test(t)) return "Wegenbelasting";
  // 4. Telefoon/abonnement telecom
  if (/\bkpn\b|simyo|odido|vodafone|t-mobile|tele2|ben\.nl/.test(t)) return "Telefoonkosten";
  // 5. Kantoorinventaris
  if (/coolblue|mediamarkt|\bbcc\b/.test(t)) return "Kantoor inventaris";
  // 7. Brandstof
  if (/\btotal\b|shell|\bbp\b|esso|tango|tinq|texaco|\bavia\b|gulf|firezone|tamoil|\bok\b tank|tankstation|brandstof/.test(t)) return "Brandstofkosten";
  // 1. Verblijf (hotels)
  if (/booking|best ?western|van der valk|\bhotel\b|bilderberg|fletcher|leonardo hotel|postillion|mercure|\bibis\b|nh hotel|b&b/.test(t)) return "verblijfkosten";
  // 3. Kantine (supermarkt/boodschappen)
  if (/albert heijn|\bah\b|jumbo|\blidl\b|\baldi\b|\bdirk\b|\bplus\b|\bspar\b|picnic|\bcrisp\b|kruidvat|boodschap/.test(t)) return "Kantinekosten";
  // 2. Lunch en diner (eten/horeca/bezorg)
  if (/takeaway|thuisbezorg|mcdonald|burger|lunchroom|pizza|restaurant|\beet|\bcafe|café|kebab|shoarma|sushi|porto pescara|bumpy|johnny|benny|\bcoco\b|\bkfc\b|\bfebo\b|new york pizza|domino|subway|starbucks|la place|bagel|snackbar|grill|poke|wok|thai|chick/.test(t)) return "Lunch en dinerkosten";
  return null; // niet ingedeeld
}

// ── aggregeren ──
const perCat = {};       // cat -> [m1..m5]
const leningen = { Af: 0, Bij: 0 };
const ongedeeld = [];    // {naam, bedrag, soort, maand}
let totaalAf = 0, totaalBij = 0, n = 0;

for (const r of rows) {
  if (!r[iDatum]) continue;
  const maand = parseInt(r[iDatum].slice(4, 6), 10); // 1-12
  if (maand < 1 || maand > 5) continue;
  const afbij = r[iAfBij];
  const bedrag = num(r[iBedrag]);
  if (isNaN(bedrag)) continue;
  n++;
  if (afbij === "Af") totaalAf += bedrag; else totaalBij += bedrag;
  const cat = categorize(r[iNaam] || "", r[iMed] || "", r[iSoort] || "");
  if (cat === "Leningen") { leningen[afbij] += bedrag; continue; }
  if (!cat) {
    if (afbij === "Af") ongedeeld.push({ naam: r[iNaam], bedrag, soort: r[iSoort], maand });
    continue;
  }
  // alleen 'Af' telt als kosten
  if (afbij !== "Af") continue;
  if (!perCat[cat]) perCat[cat] = [0, 0, 0, 0, 0];
  perCat[cat][maand - 1] += bedrag;
}

// ── output ──
const eur = (v) => v.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
console.log(`\nVerwerkte transacties jan-mei: ${n}  |  Af totaal: €${eur(totaalAf)}  |  Bij totaal: €${eur(totaalBij)}\n`);
console.log("=== KOSTEN PER CATEGORIE PER MAAND (alleen 'Af') ===");
console.log("Categorie".padEnd(24) + MAAND.map(m => m.padStart(9)).join("") + "    TOTAAL");
let grand = 0;
for (const [cat, arr] of Object.entries(perCat).sort((a, b) => b[1].reduce((x, y) => x + y) - a[1].reduce((x, y) => x + y))) {
  const tot = arr.reduce((x, y) => x + y, 0); grand += tot;
  console.log(cat.padEnd(24) + arr.map(v => ("€" + eur(v)).padStart(9)).join("") + ("  €" + eur(tot)).padStart(12));
}
console.log("".padEnd(24) + "".padStart(45) + ("  €" + eur(grand)).padStart(12));
console.log(`\n=== LENINGEN (balans, NIET als kosten) ===  Uit (Af): €${eur(leningen.Af)}  |  In (Bij): €${eur(leningen.Bij)}`);

console.log(`\n=== NIET INGEDEELD (Af) — ${ongedeeld.length} stuks, grootste 25 ===`);
ongedeeld.sort((a, b) => b.bedrag - a.bedrag);
for (const o of ongedeeld.slice(0, 25)) {
  console.log(`  M${o.maand}  €${eur(o.bedrag).padStart(9)}  ${o.soort.padEnd(18)}  ${(o.naam || "").slice(0, 50)}`);
}
const ongTot = ongedeeld.reduce((s, o) => s + o.bedrag, 0);
console.log(`  ... totaal niet ingedeeld (Af): €${eur(ongTot)}`);

// JSON voor eventuele dashboard-injectie
const pl = [];
for (const [cat, arr] of Object.entries(perCat))
  arr.forEach((v, i) => { if (v > 0) pl.push({ Amount: Math.round(v * 100) / 100, Period: i + 1, IsRevenue: false, Description: cat }); });
console.log(`\n[pl-rijen die we zouden toevoegen: ${pl.length}]`);

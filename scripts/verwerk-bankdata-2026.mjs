import { readFileSync, writeFileSync, mkdirSync } from "fs";

const CSV = "C:\\Users\\adama\\Downloads\\NL56INGB0008240617_01-01-2026_31-05-2026.csv";
const OUTDIR = "C:\\Users\\adama\\Downloads\\Bankdata-2026-verwerkt";
mkdirSync(OUTDIR, { recursive: true });

// ── CSV parser (quoted, ;-separated) ──
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

const rows = parseCsv(readFileSync(CSV, "utf8"));
const H = rows.shift();
const ix = (n) => H.indexOf(n);
const I = { datum: ix("Datum"), naam: ix("Naam / Omschrijving"), tegen: ix("Tegenrekening"), afbij: ix("Af Bij"), bedrag: ix("Bedrag (EUR)"), soort: ix("Mutatiesoort"), med: ix("Mededelingen") };
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", "."));
const MND = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

// ── categorisatie ──
// return { type, categorie, zekerheid, toelichting }
function classify(naam, med, soort, afbij, bedrag) {
  const t = (naam + " " + med + " " + soort).toLowerCase();
  const H = "hoog", M = "middel", L = "laag";

  // Interne overboekingen / privé — geen omzet of kosten (beide richtingen)
  if (/attiva zorg bv|altiva zorg bv/.test(t)) return { type: "intern", categorie: "Interne overboeking", zekerheid: M, toelichting: "Overboeking eigen onderneming" };
  if (/bulhan/.test(t)) return { type: "privé", categorie: "Lening (privé)", zekerheid: M, toelichting: "Lening-gerelateerd (privé)" };

  // ── INKOMSTEN (Bij) ──
  if (afbij === "Bij") {
    if (/zorgkantoor|zilveren kruis|\bvgz\b|menzis|\bcz\b|zorgverzekeraar|\bsvb\b|sociale verzekeringsbank|\bpgb\b|\bzvw\b|\bwmo\b|\bcak\b|gemeente|jeugdwet|declarat|stagefonds/.test(t))
      return { type: "omzet", categorie: "Omzet zorg / PGB", zekerheid: H, toelichting: "Zorg-/PGB-inkomsten" };
    if (/subsidie/.test(t)) return { type: "omzet", categorie: "Subsidie", zekerheid: M, toelichting: "Subsidie" };
    if (/lening/.test(t)) return { type: "privé", categorie: "Lening (privé)", zekerheid: M, toelichting: "Privé-lening terugontvangen" };
    if (/terugstort|storting eigen|naar.*spaar|van.*spaar|oranje spaar/.test(t)) return { type: "intern", categorie: "Interne overboeking", zekerheid: M, toelichting: "Eigen rekening/spaar" };
    if (/rente/.test(t)) return { type: "omzet", categorie: "Overige inkomsten", zekerheid: M, toelichting: "Rente" };
    return { type: "onbekend", categorie: "Te controleren", zekerheid: L, toelichting: "Inkomst zonder duidelijke bron" };
  }

  // ── UITGAVEN (Af) ──
  if (/attiva.*holding|m\.s\.holding/.test(t)) return { type: "kosten", categorie: "Management fee", zekerheid: "hoog", toelichting: "Betaling aan holding" };
  if (/lening/.test(t)) return { type: "privé", categorie: "Lening (privé)", zekerheid: "middel", toelichting: "Privé-lening verstrekt/afgelost" };
  if (/verzamelbetaling|salaris|\bloon\b|loonheffing|uwv/.test(t)) return { type: "kosten", categorie: "Personeel / loon", zekerheid: /verzamelbetaling/.test(t) ? "middel" : "hoog", toelichting: /verzamelbetaling/.test(t) ? "Batchbetaling — vermoedelijk salaris" : "Loon/personeel" };
  if (/pensioenfonds|\bpfzw\b|pensioen/.test(t)) return { type: "kosten", categorie: "Personeel / loon", zekerheid: "hoog", toelichting: "Pensioenpremie" };
  if (/belastingdienst/.test(t)) {
    if (/tarief|motorrijtuig|wegenbelast|\b[a-z0-9]{1,3}-[a-z0-9]{1,3}-[a-z0-9]{1,2}\b/.test(t)) return { type: "kosten", categorie: "Brandstof / vervoer", zekerheid: "hoog", toelichting: "Motorrijtuigenbelasting" };
    return { type: "kosten", categorie: "Belastingen", zekerheid: "middel", toelichting: "Belastingdienst (BTW/loonheffing?)" };
  }
  if (/\blizy\b|operational leasing|\blease\b|leasing/.test(t)) return { type: "kosten", categorie: "Brandstof / vervoer", zekerheid: "hoog", toelichting: "Auto-lease" };
  if (/\btotal\b|shell|\bbp\b|esso|tango|tinq|texaco|\bavia\b|gulf|firezone|tamoil|tankstation|brandstof|\bbob autowas\b|parkeer|\bq-park\b|\bp+r\b/.test(t)) return { type: "kosten", categorie: "Brandstof / vervoer", zekerheid: "middel", toelichting: "Brandstof/auto/vervoer" };
  if (/\bkpn\b|simyo|odido|vodafone|t-mobile|tele2|ben\.nl|\bnedap\b|microsoft|google|adobe|software|licentie|coolblue abonnement|\bbol\.com\b abonnement/.test(t)) return { type: "kosten", categorie: "Software / abonnementen", zekerheid: "middel", toelichting: "Telecom/software/abonnement" };
  if (/coolblue|mediamarkt|\bbcc\b|\bikea\b|kantoor/.test(t)) return { type: "kosten", categorie: "Kantoor / inventaris", zekerheid: "middel", toelichting: "Kantoor/inventaris" };
  if (/verzekering|verisure|allianz|nationale nederlanden|\basr\b|aegon|centraal beheer|interpolis|univ|reaal|\bnn\b/.test(t)) return { type: "kosten", categorie: "Verzekeringen", zekerheid: "middel", toelichting: "Verzekering/beveiliging" };
  if (/huur|verhuur|vastgoed/.test(t)) return { type: "kosten", categorie: "Huur", zekerheid: "middel", toelichting: "Huur/huisvesting" };
  if (/kosten zakelijk betalingsverkeer|bankkosten|\bing\b kosten|incassokosten|\bbunq\b kosten/.test(t)) return { type: "kosten", categorie: "Bankkosten", zekerheid: "hoog", toelichting: "Bankkosten" };
  if (/booking|best ?western|van der valk|\bhotel\b|bilderberg|fletcher|leonardo hotel|postillion|mercure|\bibis\b|nh hotel|b&b/.test(t)) return { type: "kosten", categorie: "Verblijf / reizen", zekerheid: "middel", toelichting: "Hotel/verblijf (controleer zakelijk)" };
  if (/albert heijn|\bah\b|jumbo|\blidl\b|\baldi\b|\bdirk\b|\bplus\b|\bspar\b|picnic|\bcrisp\b|kruidvat|boodschap/.test(t)) return { type: "kosten", categorie: "Eten / catering", zekerheid: "laag", toelichting: "Boodschappen — mogelijk privé" };
  if (/takeaway|thuisbezorg|mcdonald|burger|lunchroom|pizza|restaurant|\beet|\bcafe|café|kebab|shoarma|sushi|porto pescara|bumpy|johnny|benny|\bcoco\b|\bkfc\b|\bfebo\b|new york pizza|domino|subway|starbucks|la place|bagel|snackbar|grill|poke|\bwok\b|thai|chick/.test(t)) return { type: "kosten", categorie: "Eten / catering", zekerheid: "laag", toelichting: "Horeca/bezorg — mogelijk privé" };
  if (/marketing|reclame|advertentie|\bads\b|facebook|meta platforms|spark/.test(t)) return { type: "kosten", categorie: "Marketing", zekerheid: "middel", toelichting: "Marketing/reclame" };
  if (/gemeente.*belasting|belastingen gem|gem\. amsterdam|waterschap|hoogheemraadschap/.test(t)) return { type: "kosten", categorie: "Belastingen", zekerheid: "middel", toelichting: "Gemeentelijke/lokale belasting" };
  if (/carglass|autoservice|car ?rent|master car|\bapk\b|garage|bandencentrale|q-park|parkeer/.test(t)) return { type: "kosten", categorie: "Brandstof / vervoer", zekerheid: "laag", toelichting: "Auto/vervoer" };
  if (/routevision|klachtenportaal|admin.?kantoor|boekhoud/.test(t)) return { type: "kosten", categorie: "Software / abonnementen", zekerheid: "laag", toelichting: "Software/zorg-administratie" };
  if (/\bggn\b|deurwaarder|incasso/.test(t)) return { type: "kosten", categorie: "Overige kosten", zekerheid: "laag", toelichting: "Incasso/deurwaarder — controleren" };
  // Resterende uitgaven zijn voor een zorgorganisatie vrijwel altijd betalingen aan
  // zorgverleners/zzp'ers → 'Uitbesteed werk' (lage zekerheid, staat in controlelijst).
  return { type: "kosten", categorie: "Uitbesteed werk", zekerheid: "laag", toelichting: "Vermoedelijk uitbesteed werk/zzp — controleren" };
}

// ── verwerken ──
const A = [];                 // transacties_verwerkt
const seen = new Map();       // dubbel-detectie key -> count
for (const r of rows) {
  if (!r[I.datum]) continue;
  const ymd = r[I.datum];
  const jaar = parseInt(ymd.slice(0, 4), 10);
  const maand = parseInt(ymd.slice(4, 6), 10);
  if (jaar !== 2026 || maand < 1 || maand > 5) continue;
  const afbij = r[I.afbij];
  const bedrag = num(r[I.bedrag]);
  if (isNaN(bedrag)) continue;
  const naam = (r[I.naam] || "").trim();
  const med = (r[I.med] || "").trim();
  const soort = (r[I.soort] || "").trim();
  const c = classify(naam, med, soort, afbij, bedrag);
  const datum = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  const signed = afbij === "Bij" ? bedrag : -bedrag;
  const rec = {
    datum, omschrijving: naam || soort, tegenrekening: r[I.tegen] || "",
    bedrag: Math.round(bedrag * 100) / 100, richting: afbij, bedrag_signed: Math.round(signed * 100) / 100,
    type: c.type, categorie: c.categorie, maand, jaar, toelichting: c.toelichting, zekerheid: c.zekerheid,
  };
  A.push(rec);
  const dk = `${datum}|${bedrag}|${naam}`;
  seen.set(dk, (seen.get(dk) || 0) + 1);
}

// ── B: maand_totalen ──
const B = [];
for (let m = 1; m <= 5; m++) {
  const inM = A.filter(x => x.maand === m);
  const omzet = inM.filter(x => x.type === "omzet").reduce((s, x) => s + x.bedrag, 0);
  const kosten = inM.filter(x => x.type === "kosten").reduce((s, x) => s + x.bedrag, 0);
  B.push({ jaar: 2026, maand: m, maandnaam: MND[m - 1], omzet: Math.round(omzet), kosten: Math.round(kosten), resultaat: Math.round(omzet - kosten) });
}

// ── C: categorie_totalen ──
const catMap = {};
for (const x of A) {
  const k = x.type + "||" + x.categorie;
  if (!catMap[k]) catMap[k] = { jaar: 2026, type: x.type, categorie: x.categorie, totaal: 0, aantal_transacties: 0, maanden: [0, 0, 0, 0, 0] };
  catMap[k].totaal += x.bedrag; catMap[k].aantal_transacties++; catMap[k].maanden[x.maand - 1] += x.bedrag;
}
const C = Object.values(catMap).map(c => ({ ...c, totaal: Math.round(c.totaal), maanden: c.maanden.map(v => Math.round(v)) }))
  .sort((a, b) => b.totaal - a.totaal);

// ── D: controlepunten ──
const D = [];
for (const x of A) {
  const redenen = [];
  if (x.zekerheid === "laag") redenen.push("lage zekerheid categorie");
  if (x.type === "onbekend") redenen.push("type onbekend");
  if (/mogelijk privé|controleer|controleren/i.test(x.toelichting)) redenen.push("mogelijk privé/zakelijk onduidelijk");
  if (!x.omschrijving || x.omschrijving.length < 2) redenen.push("geen omschrijving");
  const dk = `${x.datum}|${x.bedrag}|${x.omschrijving}`;
  if (seen.get(dk) > 1) redenen.push("lijkt dubbel");
  if (x.bedrag >= 10000) redenen.push("groot bedrag (>€10k)");
  if (redenen.length) D.push({ datum: x.datum, omschrijving: x.omschrijving, bedrag: x.bedrag, type: x.type, categorie: x.categorie, reden_waarom_controleren: redenen.join("; ") });
}

// ── CSV-helper (NL: ; + komma-decimaal + BOM) ──
function toCsv(arr, cols) {
  const esc = (v) => { let s = String(v ?? ""); if (typeof v === "number") s = s.replace(".", ","); if (/[";\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; };
  return "﻿" + [cols.join(";"), ...arr.map(o => cols.map(c => esc(o[c])).join(";"))].join("\r\n");
}
writeFileSync(OUTDIR + "\\A_transacties_verwerkt.csv", toCsv(A, ["datum", "omschrijving", "tegenrekening", "bedrag", "richting", "type", "categorie", "maand", "jaar", "toelichting", "zekerheid"]));
writeFileSync(OUTDIR + "\\B_maand_totalen.csv", toCsv(B, ["jaar", "maand", "maandnaam", "omzet", "kosten", "resultaat"]));
writeFileSync(OUTDIR + "\\C_categorie_totalen.csv", toCsv(C.map(c => ({ ...c, maandverdeling: c.maanden.join(" / ") })), ["jaar", "type", "categorie", "totaal", "aantal_transacties", "maandverdeling"]));
writeFileSync(OUTDIR + "\\D_controlepunten.csv", toCsv(D, ["datum", "omschrijving", "bedrag", "type", "categorie", "reden_waarom_controleren"]));
writeFileSync(OUTDIR + "\\bankdata_2026_volledig.json", JSON.stringify({ transacties_verwerkt: A, maand_totalen: B, categorie_totalen: C, controlepunten: D }, null, 2));

// ── dashboard-pl bouwen (alleen omzet + kosten) ──
const pl = [];
for (const c of C) {
  if (c.type !== "omzet" && c.type !== "kosten") continue;
  c.maanden.forEach((v, i) => { if (v !== 0) pl.push({ Amount: Math.abs(v), Period: i + 1, IsRevenue: c.type === "omzet", Description: c.categorie }); });
}
writeFileSync(OUTDIR + "\\dashboard_pl_2026.json", JSON.stringify(pl, null, 2));

// ── samenvatting in console ──
const eur = (v) => "€" + Math.round(v).toLocaleString("nl-NL");
const typeTot = {};
for (const x of A) typeTot[x.type] = (typeTot[x.type] || 0) + x.bedrag;
console.log(`\nVerwerkt: ${A.length} transacties (jan-mei 2026)`);
console.log("Per type:", Object.fromEntries(Object.entries(typeTot).map(([k, v]) => [k, eur(v)])));
console.log("\n=== B. MAANDTOTALEN ===");
console.log("Maand".padEnd(8) + "Omzet".padStart(12) + "Kosten".padStart(12) + "Resultaat".padStart(12));
for (const b of B) console.log(b.maandnaam.padEnd(8) + eur(b.omzet).padStart(12) + eur(b.kosten).padStart(12) + eur(b.resultaat).padStart(12));
const to = B.reduce((s, b) => s + b.omzet, 0), tk = B.reduce((s, b) => s + b.kosten, 0);
console.log("TOT".padEnd(8) + eur(to).padStart(12) + eur(tk).padStart(12) + eur(to - tk).padStart(12));
console.log("\n=== C. CATEGORIE-TOTALEN ===");
for (const c of C) console.log(`${c.type.padEnd(9)} ${c.categorie.padEnd(26)} ${eur(c.totaal).padStart(11)}  (${c.aantal_transacties}x)`);
console.log(`\n=== D. CONTROLEPUNTEN: ${D.length} transacties gemarkeerd ===`);
console.log("\nBestanden geschreven naar:", OUTDIR);
console.log("pl-rijen voor dashboard:", pl.length);

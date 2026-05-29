import { createAdminClient } from "@/lib/supabase/admin";

// Gedeelde bron van waarheid voor alle Attiva-signalen ("meldingen").
// Zowel /api/notifications (sidebar-bel) als het adminportaal
// (Aandachtspunten + klantkaarten) gebruiken deze functie, zodat de
// aantallen overal exact gelijk zijn.

export interface Notification {
  id: string;
  type: "crediteur" | "marge" | "exact" | "data" | "info" | "budget" | "client";
  severity: "alarm" | "attention" | "info";
  titel: string;
  beschrijving: string;
  /** Concrete, voorgestelde vervolgactie ("Wat moet ik nu doen?"). */
  actie?: string;
  href: string;
  klant?: string;
  bedrag?: string;
}

interface CrediteurRow { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }
interface PlRow { Amount: number; IsRevenue: boolean; Period: number }

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

type AdminClient = ReturnType<typeof createAdminClient>;

export interface AttivaSignals {
  notifications: Notification[];
  // Tijdstip van de laatst-verse FINANCIËLE cache (niet de AI-cache),
  // zodat het adminportaal een betrouwbare "laatste update" kan tonen.
  attivaLastRefresh: string | null;
}

/**
 * Bouwt de complete set Attiva-signalen op (Exact-koppeling, crediteuren,
 * marge, verouderde data, budget- en cliënt-checks) en sorteert ze op
 * ernst + type-prioriteit. Aanroepers bepalen zelf of de gebruiker deze
 * mag zien (admin of de Attiva-klant zelf).
 */
export async function buildAttivaSignals(admin: AdminClient): Promise<AttivaSignals> {
  const notifications: Notification[] = [];
  let attivaLastRefresh: string | null = null;

  // ─── Exact token status ──────────────────────────────────────────────────
  const { data: tokenRow } = await admin
    .from("exact_tokens")
    .select("client_name, expires_at")
    .eq("client_name", "attiva")
    .single();

  if (!tokenRow) {
    notifications.push({
      id: "exact-not-connected",
      type: "exact",
      severity: "alarm",
      titel: "Exact Online niet gekoppeld",
      beschrijving: "Geen actieve koppeling — koppel opnieuw om data te kunnen vernieuwen.",
      actie: "Koppel Exact Online opnieuw via Instellingen.",
      href: "/portal/instellingen",
      klant: "Attiva Zorg",
    });
  } else {
    // Token-status check: access_token vervalt elke ~10 min en wordt auto-ververst.
    // Maar als expires_at > 1 uur in het verleden zit, is de auto-refresh blijkbaar
    // niet gelukt — dat duidt op een echt probleem (refresh_token verlopen / revoked).
    const expiresAt = new Date(tokenRow.expires_at).getTime();
    const eenUurGeleden = Date.now() - 60 * 60 * 1000;
    if (expiresAt < eenUurGeleden) {
      notifications.push({
        id: "exact-expired",
        type: "exact",
        severity: "alarm",
        titel: "Exact Online koppeling verlopen",
        beschrijving: "Auto-refresh van token mislukt. Koppel opnieuw om data te ontvangen.",
        actie: "Log opnieuw in bij Exact via Instellingen om de koppeling te herstellen.",
        href: "/portal/instellingen",
        klant: "Attiva Zorg",
      });
    }
  }

  const slug = "attiva"; // alleen Attiva heeft Exact-data

  // Zoek de FINANCIËLE cache (key-format "YYYY-YYYY", bv "2025-2024").
  // Niet zomaar de meest recente cache — die kan een AI-cache zijn (insights-2025,
  // narratief-2025, omzet-per-klant-..., enz.) zonder pl/crediteuren.
  //
  // We pakken de cache met de HOOGSTE maand-coverage (maxPeriode) — anders
  // wint een partial-jaar 2026 cache (jan-only, 5 pl-rijen, verlies €4k)
  // van een volle 2025-cache (12 maanden, verlies €48k). AttivaCharts doet
  // auto-fallback naar het jaar mét data; notifications moet hetzelfde
  // jaar tonen anders raken de twee blokken uit sync.
  const huidigJaar = new Date().getFullYear();
  let cacheRow: { data: unknown; updated_at: string } | null = null;
  let bestePeriode = 0;
  for (const tryJaar of [huidigJaar, huidigJaar - 1, huidigJaar - 2]) {
    const tryKey = `${tryJaar}-${tryJaar - 1}`;
    const { data: row } = await admin
      .from("exact_data_cache")
      .select("data, updated_at")
      .eq("client_name", slug)
      .eq("cache_key", tryKey)
      .maybeSingle();
    if (!row?.data) continue;

    // Bepaal maand-coverage: hoogste periode (1-12) in de pl-rijen.
    const cacheData = row.data as {
      huidig?: { pl?: PlRow[] };
      pl?: PlRow[];
    };
    const pl = cacheData.huidig?.pl ?? cacheData.pl ?? [];
    let maxPeriode = 0;
    for (const r of pl) {
      if (r.Period >= 1 && r.Period <= 12 && r.Period > maxPeriode) {
        maxPeriode = r.Period;
      }
    }

    if (maxPeriode > bestePeriode) {
      cacheRow = row;
      bestePeriode = maxPeriode;
    }
  }

  if (cacheRow?.data) {
    attivaLastRefresh = cacheRow.updated_at;

    const cache = cacheRow.data as {
      huidig?: { crediteuren?: CrediteurRow[]; pl?: PlRow[] };
      crediteuren?: CrediteurRow[];
      pl?: PlRow[];
    };
    const huidig = cache.huidig ?? cache;
    const crediteuren = huidig?.crediteuren ?? [];
    const pl = huidig?.pl ?? [];

    // Urgent crediteuren > 90 dagen
    const totaal90Plus = crediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);
    if (totaal90Plus > 5000) {
      const topUrgent = crediteuren
        .filter(c => (c.Age90Plus ?? 0) > 0)
        .sort((a, b) => (b.Age90Plus ?? 0) - (a.Age90Plus ?? 0))[0];
      notifications.push({
        id: `cred-${slug}`,
        type: "crediteur",
        severity: totaal90Plus > 15000 ? "alarm" : "attention",
        titel: `${euro(totaal90Plus)} aan crediteuren staat >90 dagen open`,
        beschrijving: topUrgent
          ? `Grootste: ${topUrgent.Name} (${euro(topUrgent.Age90Plus)})`
          : "Bekijk welke leveranciers contact nodig hebben",
        actie: topUrgent
          ? `Neem contact op met ${topUrgent.Name} en plan de betaling in.`
          : "Bel de grootste openstaande leveranciers en plan betaling.",
        // ?tab=crediteuren wordt door AttivaTabs gelezen om direct de tab te openen
        href: "/portal/dashboard/attiva?tab=crediteuren",
        klant: "Attiva Zorg",
        bedrag: euro(totaal90Plus),
      });
    }

    // Negatieve marge / verlies
    const totaalOmzet = pl.filter(r => r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
    const totaalKosten = pl.filter(r => !r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
    const marge = totaalOmzet - totaalKosten;
    const margePct = totaalOmzet > 0 ? (marge / totaalOmzet) * 100 : 0;

    if (marge < 0) {
      notifications.push({
        id: `marge-neg-${slug}`,
        type: "marge",
        severity: "alarm",
        titel: "Negatief jaarresultaat",
        beschrijving: `Verlies van ${euro(Math.abs(marge))} — kosten overstijgen omzet`,
        actie: "Analyseer de grootste kostenposten en bespreek bijsturing.",
        href: "/portal/dashboard/attiva#sectie-marge",
        klant: "Attiva Zorg",
        bedrag: `${margePct.toFixed(1)}%`,
      });
    } else if (margePct < 5 && margePct > 0 && totaalOmzet > 50000) {
      notifications.push({
        id: `marge-low-${slug}`,
        type: "marge",
        severity: "attention",
        titel: "Zeer dunne marge",
        beschrijving: `Brutomarge is slechts ${margePct.toFixed(1)}% — onder kritische drempel`,
        actie: "Bekijk waar marge weglekt — kosten of tarieven — en stuur bij.",
        href: "/portal/dashboard/attiva#sectie-marge",
        klant: "Attiva Zorg",
      });
    }

    // Cache verouderd? (>24u)
    const cacheAgeMs = Date.now() - new Date(cacheRow.updated_at).getTime();
    if (cacheAgeMs > 24 * 60 * 60 * 1000) {
      notifications.push({
        id: `cache-stale-${slug}`,
        type: "data",
        severity: "info",
        titel: "Data is meer dan 24 uur oud",
        beschrijving: "Klik vernieuwen op het dashboard voor verse cijfers",
        actie: "Klik op 'Vernieuwen' op het dashboard om de cijfers bij te werken.",
        href: "/portal/dashboard/attiva",
        klant: "Attiva Zorg",
      });
    }
  }

  // ─── Budget- en cliënt-checks op declaratiedata ────────────────────────
  interface DeclRow { budgethouder: string | null; bedrag: number | null; status: string | null; periode: string | null }
  interface BudgRow { budgethouder: string; budget: number }

  // Bepaal het 'actieve' declaratiejaar: probeer huidig kalenderjaar,
  // val dan terug op het jaar ervoor en daarvoor. Voorkomt dat alle
  // checks leeg blijven in januari/februari als de nieuwe declaraties
  // nog niet zijn ingeladen.
  let actiefJaar = huidigJaar;
  let declHuidig: DeclRow[] = [];
  for (const tryJaar of [huidigJaar, huidigJaar - 1, huidigJaar - 2]) {
    const res = await admin.from("attiva_declaraties")
      .select("budgethouder, bedrag, status, periode")
      .eq("jaar", tryJaar)
      .not("bedrag", "is", null);
    const rows = (res.data as DeclRow[] | null) ?? [];
    if (rows.length > 0) {
      declHuidig = rows;
      actiefJaar = tryJaar;
      break;
    }
  }

  const [declVorigRes, budgRes] = await Promise.all([
    admin.from("attiva_declaraties")
      .select("budgethouder, bedrag, status, periode")
      .eq("jaar", actiefJaar - 1)
      .not("bedrag", "is", null),
    admin.from("attiva_pgb_budgetten")
      .select("budgethouder, budget")
      .eq("jaar", actiefJaar),
  ]);

  const declVorig = (declVorigRes.data as DeclRow[] | null) ?? [];
  const budgetten = (budgRes.data as BudgRow[] | null) ?? [];

  // Aggregeer verbruik per budgethouder huidig jaar (alle periodes)
  const verbruikHuidig: Record<string, number> = {};
  let maxPeriode = 0;
  for (const r of declHuidig) {
    if (String(r.status ?? "").toLowerCase().includes("ingetrokken")) continue;
    if (!r.bedrag || r.bedrag <= 0) continue;
    const naam = r.budgethouder?.trim();
    if (!naam) continue;
    verbruikHuidig[naam] = (verbruikHuidig[naam] ?? 0) + r.bedrag;
    // Track laatste maand met data — voor same-period vergelijking
    if (r.periode) {
      const m = parseInt(r.periode.slice(5, 7), 10);
      if (!Number.isNaN(m) && m >= 1 && m <= 12) maxPeriode = Math.max(maxPeriode, m);
    }
  }

  // Budget-alerts
  const overBudget: { naam: string; over: number }[] = [];
  const bijnaOpBudget: { naam: string; pct: number }[] = [];
  const namenMetBudget = new Set<string>();
  for (const b of budgetten) {
    if (!b.budgethouder || !b.budget || b.budget <= 0) continue;
    namenMetBudget.add(b.budgethouder);
    const v = verbruikHuidig[b.budgethouder] ?? 0;
    const pct = (v / b.budget) * 100;
    if (pct >= 100) overBudget.push({ naam: b.budgethouder, over: v - b.budget });
    else if (pct >= 90) bijnaOpBudget.push({ naam: b.budgethouder, pct });
  }

  // Cliënten met materieel verbruik (>= €1.000) maar geen ingesteld budget —
  // monitoring is daar effectief uitgeschakeld. Drempel houdt eenmalige
  // boekingen of proeffacturen buiten de melding.
  const zonderBudgetActief = Object.entries(verbruikHuidig)
    .filter(([naam, v]) => !namenMetBudget.has(naam) && v >= 1000)
    .map(([naam, v]) => ({ naam, verbruik: v }))
    .sort((a, b) => b.verbruik - a.verbruik);

  if (overBudget.length > 0) {
    const sorted = overBudget.sort((a, b) => b.over - a.over);
    notifications.push({
      id: `budget-over-${slug}`,
      type: "budget",
      severity: "alarm",
      titel: `${overBudget.length} ${overBudget.length === 1 ? "cliënt is" : "cliënten zijn"} over budget`,
      beschrijving: sorted.slice(0, 3).map(c => `${c.naam} (+${euro(c.over)})`).join(", "),
      actie: "Controleer deze cliënten en verhoog het budget of beperk de inzet.",
      href: "/portal/dashboard/attiva?tab=declaraties#clientenoverzicht",
      klant: "Attiva Zorg",
    });
  }

  if (bijnaOpBudget.length > 0) {
    const sorted = bijnaOpBudget.sort((a, b) => b.pct - a.pct);
    notifications.push({
      id: `budget-bijna-${slug}`,
      type: "budget",
      severity: "attention",
      titel: `${bijnaOpBudget.length} ${bijnaOpBudget.length === 1 ? "cliënt" : "cliënten"} bijna op jaarbudget`,
      beschrijving: sorted.slice(0, 3).map(c => `${c.naam} (${c.pct.toFixed(0)}%)`).join(", "),
      actie: "Plan een budgetgesprek voordat het jaarbudget op is.",
      href: "/portal/dashboard/attiva?tab=declaraties#clientenoverzicht",
      klant: "Attiva Zorg",
    });
  }

  if (zonderBudgetActief.length > 0) {
    const topNamen = zonderBudgetActief.slice(0, 3).map(c => c.naam);
    const extra = zonderBudgetActief.length - 3;
    const namenTekst = extra > 0
      ? `${topNamen.join(", ")} en ${extra} ${extra === 1 ? "andere" : "anderen"}`
      : topNamen.join(", ");
    notifications.push({
      id: `budget-missing-${slug}`,
      type: "budget",
      severity: "attention",
      titel: `${zonderBudgetActief.length} ${zonderBudgetActief.length === 1 ? "cliënt heeft" : "cliënten hebben"} geen jaarbudget`,
      beschrijving: `${namenTekst} — stel budgetten in voor goede monitoring.`,
      actie: `Stel jaarbudgetten in voor ${zonderBudgetActief.length === 1 ? "deze cliënt" : "deze cliënten"} bij Declaraties.`,
      href: "/portal/dashboard/attiva?tab=declaraties#clientenoverzicht",
      klant: "Attiva Zorg",
    });
  }

  // Cliënten weggevallen: significant vorig jaar (€10k+), nu bijna niets (<20%)
  if (maxPeriode > 0 && declVorig.length > 0) {
    const vorigSamePeriode: Record<string, number> = {};
    for (const r of declVorig) {
      if (String(r.status ?? "").toLowerCase().includes("ingetrokken")) continue;
      if (!r.bedrag || r.bedrag <= 0) continue;
      const naam = r.budgethouder?.trim();
      if (!naam || !r.periode) continue;
      const m = parseInt(r.periode.slice(5, 7), 10);
      if (Number.isNaN(m) || m > maxPeriode) continue;
      vorigSamePeriode[naam] = (vorigSamePeriode[naam] ?? 0) + r.bedrag;
    }

    const weggevallen: { naam: string; vorig: number }[] = [];
    for (const [naam, vorig] of Object.entries(vorigSamePeriode)) {
      const nu = verbruikHuidig[naam] ?? 0;
      if (vorig >= 10000 && nu < vorig * 0.2) {
        weggevallen.push({ naam, vorig });
      }
    }

    if (weggevallen.length > 0) {
      const sorted = weggevallen.sort((a, b) => b.vorig - a.vorig);
      notifications.push({
        id: `client-gone-${slug}`,
        type: "client",
        severity: "attention",
        titel: `${weggevallen.length} ${weggevallen.length === 1 ? "cliënt lijkt" : "cliënten lijken"} weggevallen`,
        beschrijving: sorted.slice(0, 3).map(c => `${c.naam} (was ${euro(c.vorig)})`).join(", "),
        actie: "Bel de cliënt(en) om te checken of de zorg en declaraties doorlopen.",
        href: "/portal/dashboard/attiva?tab=declaraties#omzet-per-client",
        klant: "Attiva Zorg",
      });
    }
  }

  // Sorteren: eerst op severity, dan binnen severity op type-prioriteit zodat
  // de meest acute soort signalen bovenaan komt (exact stuk > negatief
  // resultaat > over budget > urgente crediteuren > ...).
  const severityRank = { alarm: 0, attention: 1, info: 2 };
  const typeRank: Record<Notification["type"], number> = {
    exact: 0, marge: 1, budget: 2, crediteur: 3, client: 4, data: 5, info: 6,
  };
  notifications.sort((a, b) => {
    const sev = severityRank[a.severity] - severityRank[b.severity];
    if (sev !== 0) return sev;
    return typeRank[a.type] - typeRank[b.type];
  });

  return { notifications, attivaLastRefresh };
}

// ─── Klantgezondheid-score ───────────────────────────────────────────────────
// Eén simpele stoplicht-score per klant, afgeleid uit dezelfde signalen:
//   rood   = actie nodig (er staat minstens één urgent signaal open)
//   oranje = aandacht nodig (aandachtspunten, verouderde data of veel open taken)
//   groen  = alles rustig
// Bewust een afgeleide van buildAttivaSignals zodat score en meldingen nooit
// uit elkaar lopen.

export type GezondheidKleur = "groen" | "oranje" | "rood";

export interface Klantgezondheid {
  kleur: GezondheidKleur;
  label: string;
  redenen: string[];
}

// Drempel: vanaf zoveel open taken telt het mee als "aandacht nodig".
const OPEN_TAKEN_DREMPEL = 5;
const DATA_OUD_MS = 24 * 60 * 60 * 1000;

export function computeKlantgezondheid(
  signals: Notification[],
  openTaken: number,
  lastRefresh: string | null,
): Klantgezondheid {
  const alarmCount = signals.filter(s => s.severity === "alarm").length;
  const attentionCount = signals.filter(s => s.severity === "attention").length;
  const geenData = !lastRefresh;
  const dataOud = !geenData && (Date.now() - new Date(lastRefresh).getTime()) > DATA_OUD_MS;
  const veelTaken = openTaken >= OPEN_TAKEN_DREMPEL;

  const redenen: string[] = [];
  if (alarmCount > 0) redenen.push(`${alarmCount} urgente melding${alarmCount === 1 ? "" : "en"}`);
  if (attentionCount > 0) redenen.push(`${attentionCount} aandachtspunt${attentionCount === 1 ? "" : "en"}`);
  if (geenData) redenen.push("Geen recente data");
  else if (dataOud) redenen.push("Data ouder dan 24 uur");
  if (veelTaken) redenen.push(`${openTaken} open taken`);

  let kleur: GezondheidKleur;
  let label: string;
  if (alarmCount > 0) {
    kleur = "rood";
    label = "Actie nodig";
  } else if (attentionCount > 0 || geenData || dataOud || veelTaken) {
    kleur = "oranje";
    label = "Aandacht nodig";
  } else {
    kleur = "groen";
    label = "Alles rustig";
    redenen.push("Geen openstaande signalen");
  }

  return { kleur, label, redenen };
}

export interface AttivaOverzicht {
  notifications: Notification[];
  attivaLastRefresh: string | null;
  openTaken: number;
  gezondheid: Klantgezondheid;
}

/**
 * Volledig klantoverzicht voor admin-klantkaart en maandrapport: signalen +
 * open taken + afgeleide gezondheidsscore. /api/notifications gebruikt bewust
 * alleen buildAttivaSignals (geen taken-query nodig voor de bel).
 */
export async function buildAttivaOverzicht(admin: AdminClient): Promise<AttivaOverzicht> {
  const { notifications, attivaLastRefresh } = await buildAttivaSignals(admin);

  const { count } = await admin
    .from("client_taken")
    .select("id", { count: "exact", head: true })
    .eq("client_slug", "attiva")
    .eq("status", "open");
  const openTaken = count ?? 0;

  const gezondheid = computeKlantgezondheid(notifications, openTaken, attivaLastRefresh);
  return { notifications, attivaLastRefresh, openTaken, gezondheid };
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";
import { selectAttivaFinancialCache } from "@/lib/portal/signals";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 uur

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface AgedRow { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }

export interface NarratiefResponse {
  samenvatting: string;  // max 2 zinnen
  aanbeveling: string;   // 1 concrete actie
  cached?: boolean;
  age_seconds?: number;
}

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? new Date().getFullYear().toString(), 10);
  const refresh = url.searchParams.get("refresh") === "1";

  const admin = createAdminClient();

  // ─── Databron kiezen — gelijk aan KPI's, signalen en maandmail ───────────
  // Voorkeur: de cache van het gevraagde jaar. Maar als dat jaar (nog) geen
  // omzet heeft — bv. een net begonnen 2026 — dan zou de AI "omzet €0, −100%"
  // produceren terwijl de KPI's het laatste volledige jaar tonen. In dat geval
  // vallen we terug op dezelfde max-coverage cache als de signalen/maandmail,
  // zodat deze kaart altijd over hetzelfde jaar praat als de cijfers erboven.
  type CacheShape = {
    huidig?: { jaar?: number; pl?: PlRow[]; crediteuren?: AgedRow[] };
    vorig?: { pl?: PlRow[] };
    pl?: PlRow[];
    crediteuren?: AgedRow[];
  };
  function omzetVan(d: CacheShape | null | undefined): number {
    if (!d) return 0;
    const rows = d.huidig?.pl ?? d.pl ?? [];
    return rows
      .filter(r => r.IsRevenue && r.Period >= 1 && r.Period <= 12)
      .reduce((s, r) => s + r.Amount, 0);
  }

  const requestedKey = `${jaar}-${jaar - 1}`;
  const { data: requestedRow } = await admin
    .from("exact_data_cache")
    .select("data, updated_at")
    .eq("client_name", "attiva")
    .eq("cache_key", requestedKey)
    .maybeSingle();

  let sourceData: CacheShape | null = null;
  let sourceUpdatedAt: string | null = null;
  let dataJaar = jaar;

  if (requestedRow?.data && omzetVan(requestedRow.data as CacheShape) > 0) {
    sourceData = requestedRow.data as CacheShape;
    sourceUpdatedAt = requestedRow.updated_at;
    dataJaar = sourceData.huidig?.jaar ?? jaar;
  } else {
    const financien = await selectAttivaFinancialCache(admin);
    if (financien) {
      sourceData = financien.data as CacheShape;
      sourceUpdatedAt = financien.updatedAt;
      dataJaar = financien.jaar;
    }
  }

  // De AI-tekst-cache keyt op het JAAR dat we daadwerkelijk gebruiken, zodat een
  // oude (foute) tekst van een leeg jaar nooit hergebruikt wordt.
  const cacheKey = `narratief-${dataJaar}`;

  if (!refresh) {
    const { data: cached } = await admin
      .from("exact_data_cache")
      .select("data, updated_at")
      .eq("client_name", "attiva")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      const cacheVers = age < CACHE_TTL_MS;
      // Cache alleen geldig als hij óók nieuwer is dan de onderliggende
      // financiele data. Anders: data is ververst → AI-tekst regenereren.
      const dataIsNieuwer = sourceUpdatedAt
        && new Date(sourceUpdatedAt).getTime() > new Date(cached.updated_at).getTime();
      if (cacheVers && !dataIsNieuwer) {
        return NextResponse.json({ ...(cached.data as object), cached: true, age_seconds: Math.round(age / 1000) });
      }
    }
  }

  if (!sourceData) {
    return NextResponse.json({
      samenvatting: "Open eerst het Financieel-tab zodat data uit Exact opgehaald wordt — daarna verschijnt hier de samenvatting.",
      aanbeveling: "",
    });
  }

  const fullData = sourceData;
  const pl: PlRow[] = fullData.huidig?.pl ?? fullData.pl ?? [];
  const vorigPl: PlRow[] = fullData.vorig?.pl ?? [];
  const crediteuren: AgedRow[] = fullData.huidig?.crediteuren ?? fullData.crediteuren ?? [];

  if (pl.length === 0) {
    return NextResponse.json({
      samenvatting: `Nog geen P&L-data voor ${dataJaar}. Zodra er Exact-boekingen verschijnen, komt hier de verhaallijn.`,
      aanbeveling: "",
    });
  }

  // ─── Samenvatting bouwen voor de AI ──────────────────────────────────────
  const perMaand: Record<number, { omzet: number; kosten: number }> = {};
  for (const r of pl) {
    if (r.Period < 1 || r.Period > 12) continue;
    if (!perMaand[r.Period]) perMaand[r.Period] = { omzet: 0, kosten: 0 };
    if (r.IsRevenue) perMaand[r.Period].omzet += r.Amount;
    else perMaand[r.Period].kosten += r.Amount;
  }
  const maanden = Object.entries(perMaand)
    .map(([p, v]) => ({ periode: Number(p), maand: MAANDEN[Number(p) - 1], ...v }))
    .sort((a, b) => a.periode - b.periode);

  const totaalOmzet = maanden.reduce((s, m) => s + m.omzet, 0);
  const totaalKosten = maanden.reduce((s, m) => s + m.kosten, 0);
  const margePct = totaalOmzet > 0 ? ((totaalOmzet - totaalKosten) / totaalOmzet) * 100 : 0;

  // Vangnet: zonder omzet kan de AI alleen onzin maken ("omzet €0, −100%").
  // Geef dan een rustige boodschap zonder harde bedragen i.p.v. de KPI's tegen
  // te spreken.
  if (totaalOmzet <= 0) {
    return NextResponse.json({
      samenvatting: `Er is voor ${dataJaar} nog onvoldoende omzetdata om een betrouwbare analyse te maken.`,
      aanbeveling: "Controleer of de Exact-koppeling de meest recente boekingen heeft opgehaald.",
    });
  }

  // Vorig jaar same period
  const maxPeriode = Math.max(...maanden.map(m => m.periode));
  const vorigOmzet = vorigPl.filter(r => r.IsRevenue && r.Period <= maxPeriode).reduce((s, r) => s + r.Amount, 0);
  const vorigKosten = vorigPl.filter(r => !r.IsRevenue && r.Period <= maxPeriode).reduce((s, r) => s + r.Amount, 0);
  const yoyOmzet = vorigOmzet > 0 ? ((totaalOmzet - vorigOmzet) / vorigOmzet) * 100 : 0;
  const yoyKosten = vorigKosten > 0 ? ((totaalKosten - vorigKosten) / vorigKosten) * 100 : 0;

  // Top kosten-stijger vs vorig jaar
  const kostenNu: Record<string, number> = {};
  const kostenVorig: Record<string, number> = {};
  pl.filter(r => !r.IsRevenue).forEach(r => { kostenNu[r.Description] = (kostenNu[r.Description] ?? 0) + r.Amount; });
  vorigPl.filter(r => !r.IsRevenue && r.Period <= maxPeriode).forEach(r => { kostenVorig[r.Description] = (kostenVorig[r.Description] ?? 0) + r.Amount; });
  const allKosten = new Set([...Object.keys(kostenNu), ...Object.keys(kostenVorig)]);
  const kostenAfwijkingen = Array.from(allKosten).map(name => ({
    name, nu: kostenNu[name] ?? 0, vorig: kostenVorig[name] ?? 0,
    delta: (kostenNu[name] ?? 0) - (kostenVorig[name] ?? 0),
  })).filter(a => Math.abs(a.delta) > 1000 && a.vorig > 100);
  const topStijgers = [...kostenAfwijkingen].sort((a, b) => b.delta - a.delta).slice(0, 3);

  // Omzet per categorie
  const omzetCats: Record<string, number> = {};
  pl.filter(r => r.IsRevenue).forEach(r => { omzetCats[r.Description] = (omzetCats[r.Description] ?? 0) + r.Amount; });
  const topOmzetCats = Object.entries(omzetCats).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 3);

  // Urgent crediteuren
  const totaal90Plus = crediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);
  const topUrgent = crediteuren.filter(c => (c.Age90Plus ?? 0) > 0).sort((a, b) => (b.Age90Plus ?? 0) - (a.Age90Plus ?? 0)).slice(0, 2);

  const dataSummary = `
JAAR: ${dataJaar} (data t/m ${MAANDEN[maxPeriode - 1]})
OMZET YTD: €${Math.round(totaalOmzet).toLocaleString("nl-NL")} (vorig zelfde periode: €${Math.round(vorigOmzet).toLocaleString("nl-NL")}, ${yoyOmzet >= 0 ? "+" : ""}${yoyOmzet.toFixed(1)}%)
KOSTEN YTD: €${Math.round(totaalKosten).toLocaleString("nl-NL")} (vorig zelfde periode: €${Math.round(vorigKosten).toLocaleString("nl-NL")}, ${yoyKosten >= 0 ? "+" : ""}${yoyKosten.toFixed(1)}%)
RESULTAAT YTD: €${Math.round(totaalOmzet - totaalKosten).toLocaleString("nl-NL")} (brutomarge ${margePct.toFixed(1)}%)

TOP 3 KOSTENSTIJGERS t.o.v. vorig jaar:
${topStijgers.map(t => `- ${t.name}: +€${Math.round(t.delta).toLocaleString("nl-NL")} (van €${Math.round(t.vorig).toLocaleString("nl-NL")} naar €${Math.round(t.nu).toLocaleString("nl-NL")})`).join("\n") || "geen materiele stijgingen"}

TOP 3 OMZETBRONNEN:
${topOmzetCats.map((c, i) => `${i+1}. ${c.name}: €${Math.round(c.value).toLocaleString("nl-NL")} (${((c.value/totaalOmzet)*100).toFixed(0)}%)`).join("\n")}

URGENT CREDITEUREN (>90 dagen open):
- Totaal: €${Math.round(totaal90Plus).toLocaleString("nl-NL")}
${topUrgent.length > 0 ? `- Top: ${topUrgent.map(c => `${c.Name} (€${Math.round(c.Age90Plus ?? 0).toLocaleString("nl-NL")})`).join(", ")}` : ""}
`.trim();

  const prompt = `Je bent een financieel adviseur voor MKB-ondernemers. Schrijf een ULTRA-COMPACTE financiële update.

DATA:
${dataSummary}

REGELS:
- "samenvatting": EXACT 2 korte zinnen:
  * Zin 1: De kern + de hoofdoorzaak met cijfers.
  * Zin 2: Het effect (bv. winst/verlies/marge verschil).
- "aanbeveling": ÉÉN imperatieve zin met een concrete actie (begin met werkwoord: "Onderzoek...", "Bel...", "Verlaag...", "Bekijk...").
- Geen "Dit is een signaal dat...", geen "Het is essentieel om...", geen blabla.
- Spreek de ondernemer aan ("je omzet...").
- Concrete getallen.

Voorbeeld van goede output:
{
  "samenvatting": "Je resultaat staat onder druk: omzet daalt 3,9% terwijl kosten 5,5% stijgen. Daardoor draait Attiva dit jaar een verlies van €33.642.",
  "aanbeveling": "Onderzoek bruto loon, uitbesteed werk en brandstofkosten."
}

Geef ANTWOORD als JSON in dit exacte format:
{
  "samenvatting": "...",
  "aanbeveling": "..."
}`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY niet geconfigureerd" }, { status: 500 });
  }

  const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 800,
    }),
  });

  if (!aiRes.ok) {
    const errBody = await aiRes.text();
    console.error("Groq narratief error:", errBody);
    return NextResponse.json({ error: "AI-samenvatting mislukt" }, { status: 500 });
  }

  const aiJson = await aiRes.json();
  const content = aiJson.choices?.[0]?.message?.content ?? "{}";

  let parsed: { samenvatting?: string; aanbeveling?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "AI gaf onleesbare response" }, { status: 500 });
  }

  const result = {
    samenvatting: parsed.samenvatting ?? "Geen samenvatting beschikbaar.",
    aanbeveling: parsed.aanbeveling ?? "",
  };

  await admin.from("exact_data_cache").upsert({
    client_name: "attiva",
    cache_key: cacheKey,
    data: result,
    updated_at: new Date().toISOString(),
  }, { onConflict: "client_name,cache_key" });

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 uur — refresh 2x/dag

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface AgedRow { Name: string; AccountCode?: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }

export interface Insight {
  titel: string;
  beschrijving: string;
  severity: "alarm" | "attention" | "positive" | "info";
  type: "trend" | "crediteur" | "concentratie" | "marge" | "groei" | "anomalie" | "actie";
  cijfer?: string; // bv "+12%" of "€6.400"
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? new Date().getFullYear().toString(), 10);
  const refresh = url.searchParams.get("refresh") === "1";

  const admin = createAdminClient();
  const cacheKey = `insights-${jaar}`;

  // Cache check
  if (!refresh) {
    const { data: cached } = await admin
      .from("exact_data_cache")
      .select("data, updated_at")
      .eq("client_name", "attiva")
      .eq("cache_key", cacheKey)
      .single();
    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ insights: cached.data, cached: true, age_seconds: Math.round(age / 1000) });
      }
    }
  }

  // Haal de financiele data op
  const dataKey = `${jaar}-${jaar - 1}`;
  const { data: dataRow } = await admin
    .from("exact_data_cache")
    .select("data")
    .eq("client_name", "attiva")
    .eq("cache_key", dataKey)
    .single();

  if (!dataRow) {
    return NextResponse.json({
      insights: [{
        titel: "Geen data beschikbaar",
        beschrijving: "Open eerst het Financieel-tab zodat de data uit Exact wordt opgehaald.",
        severity: "info" as const,
        type: "actie" as const,
      }],
      cached: false,
    });
  }

  // Legacy: data zat platgeslagen op root. Nieuw: genest onder `huidig`.
  // We ondersteunen beide vormen.
  const fullData = dataRow.data as {
    huidig?: { jaar: number; pl: PlRow[]; crediteuren: AgedRow[] };
    pl?: PlRow[];
    crediteuren?: AgedRow[];
  };
  const pl: PlRow[] = fullData.huidig?.pl ?? fullData.pl ?? [];
  const crediteuren: AgedRow[] = fullData.huidig?.crediteuren ?? fullData.crediteuren ?? [];
  const dataJaar: number = fullData.huidig?.jaar ?? jaar;

  if (pl.length === 0) {
    return NextResponse.json({
      insights: [{
        titel: "Nog geen P&L-data voor dit jaar",
        beschrijving: "Zodra Exact boekingen heeft voor het geselecteerde jaar verschijnen hier inzichten.",
        severity: "info" as const,
        type: "actie" as const,
      }],
      cached: false,
    });
  }

  // ─── Bouw datasamenvatting voor AI ───
  const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
  const perMaand: Record<number, { omzet: number; kosten: number }> = {};
  for (const r of pl) {
    if (r.Period < 1 || r.Period > 12) continue;
    if (!perMaand[r.Period]) perMaand[r.Period] = { omzet: 0, kosten: 0 };
    if (r.IsRevenue) perMaand[r.Period].omzet += r.Amount;
    else perMaand[r.Period].kosten += r.Amount;
  }
  const maanden = Object.entries(perMaand)
    .map(([p, v]) => ({ periode: Number(p), maand: MAANDEN[Number(p) - 1], ...v, marge: v.omzet - v.kosten }))
    .sort((a, b) => a.periode - b.periode);

  const totaalOmzet = maanden.reduce((s, m) => s + m.omzet, 0);
  const totaalKosten = maanden.reduce((s, m) => s + m.kosten, 0);
  const totaalMarge = totaalOmzet - totaalKosten;
  const margePct = totaalOmzet > 0 ? (totaalMarge / totaalOmzet) * 100 : 0;

  // Top kosten/omzet
  const aggregateBy = (rows: PlRow[], isRev: boolean) =>
    Object.entries(rows.filter(r => r.IsRevenue === isRev).reduce((acc, r) => {
      acc[r.Description] = (acc[r.Description] ?? 0) + r.Amount;
      return acc;
    }, {} as Record<string, number>))
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const topKosten = aggregateBy(pl, false).slice(0, 5);
  const topOmzet = aggregateBy(pl, true).slice(0, 5);

  // Crediteuren
  const credAged = crediteuren.map(c => {
    const t = (c.Age0to30 ?? 0) + (c.Age31to60 ?? 0) + (c.Age61to90 ?? 0) + (c.Age90Plus ?? 0);
    return { ...c, totaal: t };
  }).filter(c => c.totaal > 0).sort((a, b) => b.totaal - a.totaal);
  const totaalCrediteuren = credAged.reduce((s, c) => s + c.totaal, 0);
  const totaal90Plus = credAged.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);
  const topCred90Plus = credAged.filter(c => c.Age90Plus > 0).slice(0, 3);

  // Trend laatste maand vs gemiddelde
  const laatsteMaand = maanden[maanden.length - 1];
  const eerdereMaanden = maanden.slice(0, -1);
  const gemOmzetEerder = eerdereMaanden.length > 0 ? eerdereMaanden.reduce((s, m) => s + m.omzet, 0) / eerdereMaanden.length : 0;
  const gemKostenEerder = eerdereMaanden.length > 0 ? eerdereMaanden.reduce((s, m) => s + m.kosten, 0) / eerdereMaanden.length : 0;

  const dataSummary = `
JAAR: ${dataJaar}
TOTAAL YTD:
- Omzet: €${Math.round(totaalOmzet).toLocaleString("nl-NL")}
- Kosten: €${Math.round(totaalKosten).toLocaleString("nl-NL")}
- Resultaat: €${Math.round(totaalMarge).toLocaleString("nl-NL")} (marge ${margePct.toFixed(1)}%)
- Aantal maanden met data: ${maanden.length}

PER MAAND:
${maanden.map(m => `${m.maand}: omzet €${Math.round(m.omzet).toLocaleString("nl-NL")}, kosten €${Math.round(m.kosten).toLocaleString("nl-NL")}, marge €${Math.round(m.marge).toLocaleString("nl-NL")}`).join("\n")}

LAATSTE MAAND (${laatsteMaand?.maand}) VS GEMIDDELDE EERDERE MAANDEN:
- Omzet: €${Math.round(laatsteMaand?.omzet ?? 0).toLocaleString("nl-NL")} vs gem €${Math.round(gemOmzetEerder).toLocaleString("nl-NL")} (${gemOmzetEerder > 0 ? (((laatsteMaand?.omzet ?? 0) / gemOmzetEerder - 1) * 100).toFixed(0) : 0}%)
- Kosten: €${Math.round(laatsteMaand?.kosten ?? 0).toLocaleString("nl-NL")} vs gem €${Math.round(gemKostenEerder).toLocaleString("nl-NL")} (${gemKostenEerder > 0 ? (((laatsteMaand?.kosten ?? 0) / gemKostenEerder - 1) * 100).toFixed(0) : 0}%)

TOP 5 KOSTENPOSTEN:
${topKosten.map((k, i) => `${i+1}. ${k.name}: €${k.value.toLocaleString("nl-NL")} (${((k.value / totaalKosten) * 100).toFixed(0)}% van kosten)`).join("\n")}

TOP 5 OMZETCATEGORIEËN:
${topOmzet.map((o, i) => `${i+1}. ${o.name}: €${o.value.toLocaleString("nl-NL")} (${((o.value / totaalOmzet) * 100).toFixed(0)}% van omzet)`).join("\n")}

OPENSTAANDE CREDITEUREN: €${Math.round(totaalCrediteuren).toLocaleString("nl-NL")} totaal bij ${credAged.length} crediteuren
- >90 DAGEN URGENT: €${Math.round(totaal90Plus).toLocaleString("nl-NL")} (${totaalCrediteuren > 0 ? ((totaal90Plus / totaalCrediteuren) * 100).toFixed(0) : 0}%)
${topCred90Plus.length > 0 ? `Top urgent: ${topCred90Plus.map(c => `${c.Name} (€${Math.round(c.Age90Plus).toLocaleString("nl-NL")} >90d)`).join(", ")}` : ""}
`.trim();

  // ─── Vraag AI om 3 insights ───
  const prompt = `Je bent een financieel analist voor MKB-bedrijven. Hieronder zie je financiële data van een Nederlandse zorgorganisatie.

ANALYSEER deze data en geef EXACT 3 actionable insights in het Nederlands. Focus op:
- Wat is opvallend of afwijkend?
- Welke risico's zijn er (cashflow, marge, concentratie, urgent crediteuren)?
- Welke positieve trends zijn er?
- Wat moet de ondernemer DEZE WEEK doen?

DATA:
${dataSummary}

Geef ANTWOORD als JSON-object met "insights" key (array van 3 objecten):
{
  "insights": [
    {
      "titel": "Korte titel (max 60 tekens, geen punt aan einde)",
      "beschrijving": "Concrete uitleg in 1-2 zinnen, met cijfers. Geef ook actie aan.",
      "severity": "alarm" | "attention" | "positive" | "info",
      "type": "trend" | "crediteur" | "concentratie" | "marge" | "groei" | "anomalie" | "actie",
      "cijfer": "Optioneel: kerncijfer zoals '+12%' of '€6.400'"
    }
  ]
}

REGELS:
- Geef alleen feiten uit de data, verzin niets
- Wees concreet met bedragen en percentages
- Eén insight = één onderwerp
- "titel": kort onderwerp (bv. "Negatieve marge", "Urgente crediteuren", "Omzetconcentratie") — max 35 tekens
- "beschrijving": EXACT ÉÉN korte actiezin in imperatieve stijl, begint met een werkwoord. Max 80 tekens. Geen uitleg of context — alleen wat te doen.
  Voorbeelden:
   - "Controleer welke kostenposten deze marge drukken."
   - "Neem contact op met crediteuren ouder dan 90 dagen."
   - "Onderzoek nieuwe inkomstenbronnen om concentratie te verlagen."
- "cijfer": het kerncijfer (bv. "-5,0%", "€10.960")
- WEES STRENG met severity:
  - "alarm" = ALLEEN bij urgente, deze-week-actie. Max 1x in totaal.
  - "attention" = aandachtswaardige trend (default).
  - "positive" = duidelijk goed nieuws.
  - "info" = neutrale observatie.
- Mix: liever 1 attention + 1 positive + 1 attention dan alles alarm.`;

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
      temperature: 0.4,
      max_tokens: 1500,
    }),
  });

  if (!aiRes.ok) {
    const errBody = await aiRes.text();
    console.error("Groq error:", errBody);
    return NextResponse.json({ error: "AI-analyse mislukt", details: errBody }, { status: 500 });
  }

  const aiJson = await aiRes.json();
  const content = aiJson.choices?.[0]?.message?.content ?? "{}";

  let parsed: { insights?: Insight[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "AI gaf onleesbare response" }, { status: 500 });
  }

  const insights: Insight[] = (parsed.insights ?? []).slice(0, 3);

  // Cache opslaan
  await admin.from("exact_data_cache").upsert({
    client_name: "attiva",
    cache_key: cacheKey,
    data: insights,
    updated_at: new Date().toISOString(),
  }, { onConflict: "client_name,cache_key" });

  return NextResponse.json({ insights, cached: false });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";
import { getValidExactToken, exactGet } from "@/lib/exact/client";

// Cache TTL — 1 uur (boekingen van afgelopen jaren veranderen nauwelijks).
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CATEGORIEEN = 14; // beperk het aantal parallelle Exact-calls

interface TransactionLine {
  AccountName?: string;
  AmountDC?: number;
  FinancialPeriod?: number;
  GLAccountDescription?: string;
}
interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }

/**
 * Top leveranciers (crediteuren) per jaar uit Exact Online.
 * Werkwijze (zelfde, bewezen filter als de drilldowns): bepaal de grootste
 * kostencategorieën uit de P&L-cache, haal per categorie de TransactionLines op
 * (gefilterd op GLAccountDescription) en aggregeer de bedragen per tegenpartij
 * (AccountName). Toont dus wat er per leverancier is geboekt — los van
 * openstaande facturen. Wijzigt geen bestaande Exact-logica.
 */
export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? "0", 10);
  const refresh = url.searchParams.get("refresh") === "1";
  if (!jaar) return NextResponse.json({ error: "jaar is verplicht" }, { status: 400 });

  const admin = createAdminClient();
  const cacheKey = `leveranciers-per-jaar-${jaar}`;

  if (!refresh) {
    const { data: cached } = await admin
      .from("exact_data_cache")
      .select("data, updated_at")
      .eq("client_name", "attiva")
      .eq("cache_key", cacheKey)
      .single();
    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < CACHE_TTL_MS) return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
    }
  }

  // 1. Grootste kostencategorieën bepalen uit de bestaande P&L-cache van dit jaar.
  const { data: plRow } = await admin
    .from("exact_data_cache")
    .select("data")
    .eq("client_name", "attiva")
    .eq("cache_key", `${jaar}-${jaar - 1}`)
    .maybeSingle();
  const plData = plRow?.data as { huidig?: { pl?: PlRow[] }; pl?: PlRow[] } | undefined;
  const pl: PlRow[] = plData?.huidig?.pl ?? plData?.pl ?? [];

  const catTot: Record<string, number> = {};
  for (const r of pl) {
    if (r.IsRevenue || r.Period < 1 || r.Period > 12) continue;
    catTot[r.Description] = (catTot[r.Description] ?? 0) + r.Amount;
  }
  const categorieen = Object.entries(catTot)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORIEEN)
    .map(([naam]) => naam);

  if (categorieen.length === 0) {
    // Geen P&L-cache → niets te aggregeren; lege uitkomst (UI valt terug).
    return NextResponse.json({ jaar, totaal: 0, aantalLeveranciers: 0, leveranciers: [] });
  }

  // 2. Token + per categorie de TransactionLines ophalen (parallel).
  const tokenResult = await getValidExactToken(admin);
  if ("error" in tokenResult) return NextResponse.json({ error: tokenResult.error }, { status: 401 });
  const { token, division } = tokenResult;

  const select = "AccountName,AmountDC,FinancialPeriod,GLAccountDescription";
  const perCat = await Promise.all(categorieen.map(async (cat) => {
    const filter = `FinancialYear eq ${jaar} and GLAccountDescription eq '${cat.replace(/'/g, "''")}'`;
    const path = `financialtransaction/TransactionLines?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=1000`;
    return exactGet(token, division, path, true) as Promise<TransactionLine[] | null>;
  }));

  // 3. Aggregeer per leverancier (alleen regels met een echte tegenpartij).
  const map: Record<string, number> = {};
  for (const lines of perCat) {
    if (!Array.isArray(lines)) continue;
    for (const l of lines) {
      const bedrag = Number(l.AmountDC ?? 0); // kosten = debit positief
      if (bedrag <= 0) continue;
      const naam = l.AccountName?.trim();
      if (!naam) continue;
      map[naam] = (map[naam] ?? 0) + bedrag;
    }
  }

  const leveranciers = Object.entries(map)
    .map(([naam, totaal]) => ({ naam, totaal: Math.round(totaal) }))
    .filter(l => l.totaal > 0)
    .sort((a, b) => b.totaal - a.totaal);

  const result = {
    jaar,
    totaal: leveranciers.reduce((s, l) => s + l.totaal, 0),
    aantalLeveranciers: leveranciers.length,
    leveranciers,
  };

  await admin.from("exact_data_cache").upsert({
    client_name: "attiva",
    cache_key: cacheKey,
    data: result,
    updated_at: new Date().toISOString(),
  }, { onConflict: "client_name,cache_key" });

  return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
}

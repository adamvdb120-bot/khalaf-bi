import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";
import { getValidExactToken, exactGet } from "@/lib/exact/client";

// Cache TTL — 1 uur (boekingen van afgelopen jaren veranderen nauwelijks).
const CACHE_TTL_MS = 60 * 60 * 1000;

interface TransactionLine {
  AccountName?: string;
  AccountCode?: string;
  GLAccountCode?: string;
  AmountDC?: number;
  FinancialPeriod?: number;
}

/**
 * Top leveranciers (crediteuren) per jaar uit Exact Online.
 * Aggregeert alle TransactionLines op kosten-grootboekrekeningen (4000–7999)
 * per tegenpartij (AccountName). Toont dus wat er per leverancier is geboekt —
 * los van openstaande facturen. Wijzigt geen bestaande Exact-logica.
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

  const tokenResult = await getValidExactToken(admin);
  if ("error" in tokenResult) return NextResponse.json({ error: tokenResult.error }, { status: 401 });
  const { token, division } = tokenResult;

  // Kostenrekeningen 4000–7999, alle tegenpartijen, voor het opgegeven boekjaar.
  const filter = `FinancialYear eq ${jaar} and GLAccountCode ge '4000' and GLAccountCode lt '8000'`;
  const select = "AccountName,AccountCode,GLAccountCode,AmountDC,FinancialPeriod";
  const path = `financialtransaction/TransactionLines?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=1000`;

  const lines = await exactGet(token, division, path, true) as TransactionLine[] | null;
  if (!lines) return NextResponse.json({ error: "Kon TransactionLines niet ophalen uit Exact" }, { status: 500 });

  const map: Record<string, number> = {};
  for (const l of lines) {
    const code = parseInt(l.GLAccountCode ?? "0", 10);
    if (code < 4000 || code >= 8000) continue;       // alleen kosten
    const bedrag = Number(l.AmountDC ?? 0);           // kosten = debit positief
    if (bedrag <= 0) continue;                        // correcties/credits overslaan
    const naam = l.AccountName?.trim();
    if (!naam) continue;                              // alleen regels met een echte tegenpartij/leverancier
    map[naam] = (map[naam] ?? 0) + bedrag;
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

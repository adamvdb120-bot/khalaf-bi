import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getValidExactToken, exactGet } from "@/lib/exact/client";

// Cache TTL — 1 uur, want bankboekingen veranderen niet vaak
const CACHE_TTL_MS = 60 * 60 * 1000;

interface TransactionLine {
  AccountName?: string;
  AccountCode?: string;
  GLAccountDescription?: string;
  GLAccountCode?: string;
  AmountDC?: number;
  FinancialPeriod?: number;
  FinancialYear?: number;
  Description?: string;
  Date?: string;
}

interface KlantOmzet {
  naam: string;
  totaal: number;
  perMaand: number[]; // 12 elementen, index 0 = jan
}

export async function GET(req: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? "0", 10);
  const categorie = url.searchParams.get("categorie") ?? "";
  const refresh = url.searchParams.get("refresh") === "1";

  if (!jaar || !categorie) {
    return NextResponse.json({ error: "jaar en categorie zijn verplicht" }, { status: 400 });
  }

  const admin = createAdminClient();
  const cacheKey = `omzet-per-klant-${jaar}-${categorie}`;

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
        return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
      }
    }
  }

  // Token ophalen
  const tokenResult = await getValidExactToken(admin);
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 401 });
  }
  const { token, division } = tokenResult;

  // OData filter — string-waardes met enkele quotes, escape inner quotes
  const escapedCategorie = categorie.replace(/'/g, "''");
  const filter = `FinancialYear eq ${jaar} and GLAccountDescription eq '${escapedCategorie}'`;
  const select = "AccountName,AccountCode,GLAccountDescription,AmountDC,FinancialPeriod,Description,Date";

  const path = `financialtransaction/TransactionLines?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=1000`;

  const lines = await exactGet(token, division, path, true) as TransactionLine[] | null;

  if (!lines) {
    return NextResponse.json({ error: "Kon TransactionLines niet ophalen uit Exact" }, { status: 500 });
  }

  // Aggregeer per klant per maand
  const klantenMap: Record<string, KlantOmzet> = {};

  for (const line of lines) {
    // Voor revenue accounts is AmountDC negatief in Exact (credit boeking).
    // Toon als positief.
    const bedrag = -Number(line.AmountDC ?? 0);
    if (bedrag <= 0) continue; // sla credit-correcties / 0-regels over

    const periode = Number(line.FinancialPeriod ?? 0);
    if (periode < 1 || periode > 12) continue;

    // Klant-naam: AccountName is meestal de tegenpartij. Fallback op Description als die ontbreekt.
    const naam = (line.AccountName?.trim()) || (line.Description?.trim()) || "Onbekend";

    if (!klantenMap[naam]) {
      klantenMap[naam] = { naam, totaal: 0, perMaand: Array(12).fill(0) };
    }
    klantenMap[naam].totaal += bedrag;
    klantenMap[naam].perMaand[periode - 1] += bedrag;
  }

  // Sorteer en rond af
  const klanten = Object.values(klantenMap)
    .map(k => ({
      ...k,
      totaal: Math.round(k.totaal),
      perMaand: k.perMaand.map(v => Math.round(v)),
    }))
    .filter(k => k.totaal > 0)
    .sort((a, b) => b.totaal - a.totaal);

  const result = {
    jaar,
    categorie,
    totaal: klanten.reduce((s, k) => s + k.totaal, 0),
    aantalKlanten: klanten.length,
    klanten,
  };

  // Cache opslaan
  await admin.from("exact_data_cache").upsert({
    client_name: "attiva",
    cache_key: cacheKey,
    data: result,
    updated_at: new Date().toISOString(),
  }, { onConflict: "client_name,cache_key" });

  return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
}

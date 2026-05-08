import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Cache TTL — data wordt 's nachts ververst via cron, anders na 60 min als de cron miste
const CACHE_TTL_MS = 60 * 60 * 1000;

async function readCache(admin: ReturnType<typeof createAdminClient>, cacheKey: string) {
  const { data } = await admin
    .from("exact_data_cache")
    .select("data, updated_at")
    .eq("client_name", "attiva")
    .eq("cache_key", cacheKey)
    .single();
  if (!data) return null;
  const age = Date.now() - new Date(data.updated_at).getTime();
  if (age > CACHE_TTL_MS) return null;
  return { data: data.data, ageSeconds: Math.round(age / 1000) };
}

async function writeCache(admin: ReturnType<typeof createAdminClient>, cacheKey: string, data: unknown) {
  await admin.from("exact_data_cache").upsert({
    client_name: "attiva",
    cache_key: cacheKey,
    data,
    updated_at: new Date().toISOString(),
  }, { onConflict: "client_name,cache_key" });
}

async function refreshExactToken(admin: ReturnType<typeof createAdminClient>, row: Record<string, string>) {
  const res = await fetch("https://start.exactonline.nl/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
    }),
  });
  const refreshBody = await res.text();
  if (!res.ok) return { error: refreshBody };

  const tokens = JSON.parse(refreshBody);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await admin.from("exact_tokens").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
  }).eq("client_name", "attiva");
  return { token: tokens.access_token, division: row.division };
}

async function getValidToken(admin: ReturnType<typeof createAdminClient>) {
  const { data: row, error: dbError } = await admin
    .from("exact_tokens")
    .select("*")
    .eq("client_name", "attiva")
    .single();

  if (dbError || !row) return { error: "Geen token opgeslagen — koppel opnieuw" };

  // Token nog minimaal 5 minuten geldig → direct gebruiken
  if (new Date(row.expires_at).getTime() - Date.now() >= 300_000) {
    return { token: row.access_token, division: row.division };
  }

  // Token bijna verlopen → refresh proberen
  console.log("Token bijna verlopen, refresh...");
  const result = await refreshExactToken(admin, row);

  if ("error" in result) {
    // Refresh mislukt — mogelijk concurrent request deed dit al.
    // Herlaad token uit DB: misschien is het al ververst door een andere request.
    console.warn("Refresh mislukt, herlaad token uit DB:", result.error);
    const { data: fresh } = await admin
      .from("exact_tokens")
      .select("*")
      .eq("client_name", "attiva")
      .single();

    if (fresh && new Date(fresh.expires_at).getTime() - Date.now() > 30_000) {
      // Andere request heeft token al ververst, gebruik dat
      console.log("Token al ververst door concurrent request, gebruik nieuw token.");
      return { token: fresh.access_token, division: fresh.division };
    }

    // Token echt verlopen, gebruiker moet opnieuw koppelen
    return { error: `Refresh mislukt — koppel opnieuw via Exact Online` };
  }

  return result;
}

async function exactGet(token: string, division: number, path: string, paginate = false): Promise<unknown[] | null> {
  const baseUrl = `https://start.exactonline.nl/api/v1/${division}/${path}`;
  let url: string | null = baseUrl;
  const allResults: unknown[] = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Exact API error:", res.status, url, text.slice(0, 500));
      return null;
    }
    let json: Record<string, unknown>;
    try { json = JSON.parse(text); } catch { return null; }

    const results = (json.d as Record<string, unknown>)?.results as unknown[];
    if (Array.isArray(results)) allResults.push(...results);

    const next = (json.d as Record<string, unknown>)?.__next as string | undefined;
    url = paginate && next ? next : null;
  }

  return allResults.length > 0 ? allResults : null;
}

function buildPl(balances: unknown[] | null) {
  const pl: Array<{ Amount: number; Description: string; Period: number; IsRevenue: boolean }> = [];
  if (!Array.isArray(balances)) return pl;
  for (const rawRow of balances) {
    const row = rawRow as {
      GLAccountCode: string; GLAccountDescription: string;
      ReportingPeriod: number; Amount: number; AmountDebit: number; AmountCredit: number;
    };
    const codeNum = parseInt(row.GLAccountCode ?? "0");
    if (codeNum < 4000) continue;
    const isRevenue = codeNum >= 8000;
    const amount = isRevenue
      ? (row.AmountCredit ?? 0) - (row.AmountDebit ?? 0)
      : (row.AmountDebit ?? 0) - (row.AmountCredit ?? 0);
    if (amount === 0) continue;
    pl.push({ Amount: amount, Description: row.GLAccountDescription ?? "", Period: row.ReportingPeriod ?? 0, IsRevenue: isRevenue });
  }
  return pl;
}

// Exact Online retourneert datums als "/Date(1234567890000)/"
function parseExactDate(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = /\/Date\((-?\d+)\)\//.exec(s);
  if (m) return parseInt(m[1], 10);
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

// PayablesList/ReceivablesList = factuurregels. Aggregeer naar aging-buckets per account.
function buildAgedList(invoices: unknown[] | null) {
  if (!Array.isArray(invoices)) return [];
  const today = Date.now();
  const map: Record<string, {
    Name: string; AccountCode: string;
    Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number;
  }> = {};

  for (const raw of invoices) {
    const inv = raw as {
      AccountName?: string; AccountCode?: string; Description?: string;
      AmountDC?: number; AmountFC?: number; Amount?: number;
      DueDate?: string; InvoiceDate?: string; EntryDate?: string;
    };
    const naam = inv.AccountName || inv.AccountCode || inv.Description || "Onbekend";
    const code = inv.AccountCode || "";
    // Open bedrag in default currency. Sommige endpoints retourneren AmountDC, andere Amount.
    const amount = Number(inv.AmountDC ?? inv.Amount ?? inv.AmountFC ?? 0);
    if (amount === 0) continue;

    const dueMs = parseExactDate(inv.DueDate ?? inv.InvoiceDate ?? inv.EntryDate);
    const daysOverdue = dueMs !== null ? Math.floor((today - dueMs) / 86400000) : 0;

    if (!map[naam]) {
      map[naam] = { Name: naam, AccountCode: code, Age0to30: 0, Age31to60: 0, Age61to90: 0, Age90Plus: 0 };
    }
    if (daysOverdue <= 30) map[naam].Age0to30 += amount;
    else if (daysOverdue <= 60) map[naam].Age31to60 += amount;
    else if (daysOverdue <= 90) map[naam].Age61to90 += amount;
    else map[naam].Age90Plus += amount;
  }

  return Object.values(map).map(r => ({
    ...r,
    Age0to30: Math.round(r.Age0to30),
    Age31to60: Math.round(r.Age31to60),
    Age61to90: Math.round(r.Age61to90),
    Age90Plus: Math.round(r.Age90Plus),
  }));
}

function buildOmzetPerKlant(facturen: unknown[] | null) {
  const map: Record<string, { naam: string; omzet: number }> = {};
  if (!Array.isArray(facturen)) return [];
  for (const rawFactuur of facturen) {
    const f = rawFactuur as { OrderedBy: string; OrderedByName: string; AmountDC: number };
    if (!f.OrderedBy) continue;
    if (!map[f.OrderedBy]) map[f.OrderedBy] = { naam: f.OrderedByName ?? f.OrderedBy, omzet: 0 };
    map[f.OrderedBy].omzet += f.AmountDC ?? 0;
  }
  return Object.values(map).map(k => ({ naam: k.naam, omzet: Math.round(k.omzet) })).filter(k => k.omzet > 0).sort((a, b) => b.omzet - a.omzet);
}

export async function GET(req: Request) {
  // Cron-jobs mogen ook binnen (met geheim) — anders moet user ingelogd zijn
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret === process.env.CRON_SECRET && cronSecret !== undefined;

  if (!isCron) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const admin = createAdminClient();
  // Eén token ophalen voor alle calls — vermijdt race condition bij parallelle requests
  const auth = await getValidToken(admin);
  if (!auth || "error" in auth) {
    const msg = auth && "error" in auth ? auth.error : "Niet gekoppeld met Exact Online";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const { token, division } = auth;

  const url = new URL(req.url);
  const jaarParam = url.searchParams.get("jaar");
  const jaar = jaarParam ? parseInt(jaarParam) : new Date().getFullYear();
  const jaarVorigParam = url.searchParams.get("jaarVorig");
  const jaarVorig = jaarVorigParam ? parseInt(jaarVorigParam) : null;
  const debug = url.searchParams.get("debug") === "1";
  const forceRefresh = url.searchParams.get("refresh") === "1";

  // Cache check (niet voor debug requests) — leest uit Supabase
  const cacheKey = `${jaar}-${jaarVorig ?? "none"}`;
  if (!debug && !forceRefresh) {
    const cached = await readCache(admin, cacheKey);
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT", "X-Cache-Age": String(cached.ageSeconds) },
      });
    }
  }

  // Fetch huidig jaar + optioneel vorig jaar + debiteuren/crediteuren — allemaal met dezelfde token
  // SalesInvoices weggelaten uit hoofd-fetch (traag, gepagineerd) — omzetPerKlant komt uit ReportingBalance
  const fetches: Promise<unknown[] | null>[] = [
    exactGet(token, division,
      `financial/ReportingBalance?$filter=ReportingYear eq ${jaar}` +
      `&$select=GLAccount,GLAccountCode,GLAccountDescription,ReportingPeriod,Amount,AmountDebit,AmountCredit,Type`,
      true),
    exactGet(token, division, `read/financial/ReceivablesList`),
    exactGet(token, division, `read/financial/PayablesList`),
  ];
  if (jaarVorig) {
    fetches.push(exactGet(token, division,
      `financial/ReportingBalance?$filter=ReportingYear eq ${jaarVorig}` +
      `&$select=GLAccount,GLAccountCode,GLAccountDescription,ReportingPeriod,Amount,AmountDebit,AmountCredit,Type`,
      true));
  }

  const [balances, debiteuren, crediteuren, balancesVorig = null] = await Promise.all(fetches);

  if (debug) {
    const sample = Array.isArray(balances) ? balances.slice(0, 5) : balances;
    const byRange: Record<string, { debit: number; credit: number; net: number; count: number }> = {
      "4000-4999": { debit: 0, credit: 0, net: 0, count: 0 },
      "5000-5999": { debit: 0, credit: 0, net: 0, count: 0 },
      "6000-6999": { debit: 0, credit: 0, net: 0, count: 0 },
      "7000-7999": { debit: 0, credit: 0, net: 0, count: 0 },
      "8000-8999": { debit: 0, credit: 0, net: 0, count: 0 },
      "9000-9999": { debit: 0, credit: 0, net: 0, count: 0 },
    };
    let omzetSum = 0; let kostenSum = 0; let plCount = 0;
    if (Array.isArray(balances)) {
      for (const rawRow of balances) {
        const row = rawRow as { GLAccountCode: string; AmountDebit: number; AmountCredit: number; ReportingPeriod: number };
        const codeNum = parseInt(row.GLAccountCode ?? "0");
        if (codeNum < 4000 || codeNum >= 10000) continue;
        plCount++;
        const isRevenue = codeNum >= 8000;
        const net = isRevenue ? (row.AmountCredit ?? 0) - (row.AmountDebit ?? 0) : (row.AmountDebit ?? 0) - (row.AmountCredit ?? 0);
        if (isRevenue) omzetSum += net; else kostenSum += net;
        const rangeKey = `${Math.floor(codeNum / 1000) * 1000}-${Math.floor(codeNum / 1000) * 1000 + 999}`;
        if (byRange[rangeKey]) {
          byRange[rangeKey].debit += row.AmountDebit ?? 0;
          byRange[rangeKey].credit += row.AmountCredit ?? 0;
          byRange[rangeKey].net += net;
          byRange[rangeKey].count++;
        }
      }
    }
    for (const k of Object.keys(byRange)) {
      byRange[k].debit = Math.round(byRange[k].debit);
      byRange[k].credit = Math.round(byRange[k].credit);
      byRange[k].net = Math.round(byRange[k].net);
    }
    return NextResponse.json({
      division, jaar, balancesCount: Array.isArray(balances) ? balances.length : 0,
      balancesSample: sample, plRowCount: plCount,
      omzetSum: Math.round(omzetSum), kostenSum: Math.round(kostenSum), byRange,
      debiteuren: Array.isArray(debiteuren) ? debiteuren.slice(0, 3) : debiteuren,
    });
  }

  // Compacte raw rijen (alleen velden die we nodig hebben voor drilldown — bespaart cache-size)
  function compactInvoice(arr: unknown[] | null) {
    if (!Array.isArray(arr)) return [];
    return arr.map(raw => {
      const r = raw as {
        AccountName?: string; AccountCode?: string; Description?: string;
        AmountDC?: number; AmountFC?: number; Amount?: number;
        DueDate?: string; InvoiceDate?: string; EntryDate?: string;
        InvoiceNumber?: number | string; YourRef?: string;
      };
      return {
        AccountName: r.AccountName ?? "",
        AccountCode: r.AccountCode ?? "",
        Description: r.Description ?? "",
        Amount: Number(r.AmountDC ?? r.Amount ?? r.AmountFC ?? 0),
        DueDate: r.DueDate ?? null,
        InvoiceDate: r.InvoiceDate ?? null,
        EntryDate: r.EntryDate ?? null,
        InvoiceNumber: r.InvoiceNumber ?? null,
        YourRef: r.YourRef ?? null,
      };
    });
  }

  const huidigeData = {
    division, jaar,
    pl: buildPl(balances),
    debiteuren: buildAgedList(debiteuren),
    crediteuren: buildAgedList(crediteuren),
    debiteurenRaw: compactInvoice(debiteuren),
    crediteurenRaw: compactInvoice(crediteuren),
    omzetPerKlant: [],
  };

  // Als jaarVorig meegegeven: geef beide jaren terug in één response
  const responseData = jaarVorig && balancesVorig !== undefined
    ? { huidig: huidigeData, vorig: { division, jaar: jaarVorig, pl: buildPl(balancesVorig), debiteuren: [], crediteuren: [], omzetPerKlant: [] } }
    : huidigeData;

  // Sla op in Supabase cache
  if (!debug) {
    await writeCache(admin, cacheKey, responseData);
  }

  return NextResponse.json(responseData, { headers: { "X-Cache": "MISS" } });
}

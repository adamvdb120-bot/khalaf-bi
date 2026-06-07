import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const { data: tok } = await sb.from("exact_tokens").select("*").eq("client_name", "attiva").single();
const token = tok.access_token, division = tok.division;

async function exactGet(path) {
  let url = `https://start.exactonline.nl/api/v1/${division}/${path}`;
  const all = [];
  let pages = 0;
  while (url && pages < 6) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!res.ok) return null;
    const j = JSON.parse(await res.text());
    const results = Array.isArray(j.d) ? j.d : (j.d?.results ?? []);
    all.push(...results);
    url = (!Array.isArray(j.d) && j.d?.__next) ? j.d.__next : null;
    pages++;
  }
  return all;
}

async function topLev(jaar) {
  const { data: plRow } = await sb.from("exact_data_cache").select("data").eq("client_name", "attiva").eq("cache_key", `${jaar}-${jaar - 1}`).maybeSingle();
  const pl = plRow?.data?.huidig?.pl ?? plRow?.data?.pl ?? [];
  const catTot = {};
  for (const r of pl) { if (!r.IsRevenue && r.Period >= 1 && r.Period <= 12) catTot[r.Description] = (catTot[r.Description] || 0) + r.Amount; }
  const cats = Object.entries(catTot).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k]) => k);
  const perCat = await Promise.all(cats.map(c => {
    const f = encodeURIComponent(`FinancialYear eq ${jaar} and GLAccountDescription eq '${c.replace(/'/g, "''")}'`);
    return exactGet(`financialtransaction/TransactionLines?$filter=${f}&$select=AccountName,AmountDC,FinancialPeriod&$top=1000`);
  }));
  const map = {};
  for (const lines of perCat) { if (!Array.isArray(lines)) continue; for (const l of lines) { const b = Number(l.AmountDC ?? 0); if (b <= 0) continue; const n = l.AccountName?.trim(); if (!n) continue; map[n] = (map[n] || 0) + b; } }
  const lev = Object.entries(map).map(([naam, t]) => ({ naam, totaal: Math.round(t) })).sort((a, b) => b.totaal - a.totaal);
  console.log(`\n=== ${jaar} — ${cats.length} categorieën, ${lev.length} leveranciers ===`);
  for (const l of lev.slice(0, 10)) console.log(`  €${l.totaal.toLocaleString("nl-NL").padStart(9)}  ${l.naam}`);
}

await topLev(2025);
await topLev(2024);

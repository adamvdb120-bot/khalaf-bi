import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

// token ophalen
const { data: row } = await sb.from("exact_tokens").select("*").eq("client_name", "attiva").single();
let token = row.access_token;
const division = row.division;
const exp = new Date(row.expires_at).getTime();
console.log("token verloopt:", row.expires_at, "| nog geldig:", exp > Date.now());

// refresh indien nodig (en terugschrijven, net als de app)
if (exp - Date.now() < 60_000) {
  console.log("token verlopen → refresh...");
  const res = await fetch("https://start.exactonline.nl/api/oauth2/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: row.refresh_token, client_id: get("EXACT_CLIENT_ID"), client_secret: get("EXACT_CLIENT_SECRET") }),
  });
  const body = await res.text();
  if (!res.ok) { console.error("refresh mislukt:", body.slice(0, 300)); process.exit(1); }
  const t = JSON.parse(body);
  token = t.access_token;
  await sb.from("exact_tokens").update({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() }).eq("client_name", "attiva");
  console.log("✓ token ververst + opgeslagen");
}

async function exactGet(path) {
  const res = await fetch(`https://start.exactonline.nl/api/v1/${division}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

// TEST A: nieuwe (bewezen) per-categorie filter
console.log("\n=== A: GLAccountDescription eq 'Management fee', 2025 ===");
{
  const f = encodeURIComponent("FinancialYear eq 2025 and GLAccountDescription eq 'Management fee'");
  const r = await exactGet(`financialtransaction/TransactionLines?$filter=${f}&$select=AccountName,AmountDC,FinancialPeriod&$top=5`);
  console.log("status:", r.status);
  try { const j = JSON.parse(r.text); console.log("aantal:", j.d?.results?.length, "voorbeeld:", JSON.stringify(j.d?.results?.[0])); }
  catch { console.log(r.text.slice(0, 300)); }
}

// TEST B: oude (mogelijk falende) GLAccountCode-bereik
console.log("\n=== B: GLAccountCode ge '4000' and lt '8000', 2025 ===");
{
  const f = encodeURIComponent("FinancialYear eq 2025 and GLAccountCode ge '4000' and GLAccountCode lt '8000'");
  const r = await exactGet(`financialtransaction/TransactionLines?$filter=${f}&$select=AccountName,AmountDC,GLAccountCode&$top=5`);
  console.log("status:", r.status);
  console.log(r.text.slice(0, 300));
}

// TEST C: 2024 heeft data?
console.log("\n=== C: GLAccountDescription eq 'Huurkosten', 2024 ===");
{
  const f = encodeURIComponent("FinancialYear eq 2024 and GLAccountDescription eq 'Huurkosten'");
  const r = await exactGet(`financialtransaction/TransactionLines?$filter=${f}&$select=AccountName,AmountDC&$top=5`);
  console.log("status:", r.status);
  try { const j = JSON.parse(r.text); console.log("aantal:", j.d?.results?.length, "voorbeeld:", JSON.stringify(j.d?.results?.[0])); }
  catch { console.log(r.text.slice(0, 300)); }
}

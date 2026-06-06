import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";

/**
 * Aparte, TIJDELIJKE bankdata-bron naast Exact Online.
 *
 * Leest een handmatig verwerkte bankimport uit `exact_data_cache` onder de key
 * `bankimport-<jaar>`. Die key wordt NOOIT door de Exact-cron aangeraakt, dus
 * de Exact-flow blijft volledig intact en primair. Het dashboard valt alleen op
 * deze bron terug wanneer Exact voor dat jaar (nog) geen data heeft.
 *
 * Deze route wijzigt of vervangt geen enkele bestaande Exact-logica.
 */
export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? new Date().getFullYear().toString(), 10);

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("exact_data_cache")
    .select("data, updated_at")
    .eq("client_name", "attiva")
    .eq("cache_key", `bankimport-${jaar}`)
    .maybeSingle();

  if (!row?.data) {
    return NextResponse.json({ error: "Geen bankimport voor dit jaar" }, { status: 404 });
  }

  return NextResponse.json(row.data, {
    headers: { "X-Data-Source": "bank-import", "X-Bank-Updated": row.updated_at ?? "" },
  });
}

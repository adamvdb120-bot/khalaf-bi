import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";

export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaar = url.searchParams.get("jaar") ? parseInt(url.searchParams.get("jaar")!) : null;

  const admin = createAdminClient();
  let query = admin
    .from("attiva_declaraties")
    .select("budgethouder,soort,bedrag,status,periode,jaar")
    .not("bedrag", "is", null);

  if (jaar) query = query.eq("jaar", jaar);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter: exclude retractions (negative amounts or "ingetrokken" status)
  const actief = (data ?? []).filter(r =>
    !String(r.status ?? "").toLowerCase().includes("ingetrokken") &&
    r.bedrag > 0
  );

  // Per maand
  const perMaand: Record<string, number> = {};
  actief.forEach(r => {
    const m = r.periode ? String(r.periode).slice(0, 7) : "onbekend";
    perMaand[m] = (perMaand[m] ?? 0) + r.bedrag;
  });

  // Per soort
  const perSoort: Record<string, number> = {};
  actief.forEach(r => {
    const s = r.soort ?? "Overig";
    const kort = s.includes("zorg") ? "Geleverde zorg" : s.includes("loon") ? "Maandloon" : s;
    perSoort[kort] = (perSoort[kort] ?? 0) + r.bedrag;
  });

  // Per persoon
  const perPersoon: Record<string, number> = {};
  actief.forEach(r => {
    const p = r.budgethouder ?? "Onbekend";
    perPersoon[p] = (perPersoon[p] ?? 0) + r.bedrag;
  });

  return NextResponse.json({
    totaal: actief.reduce((s, r) => s + r.bedrag, 0),
    perMaand: Object.entries(perMaand).sort(([a], [b]) => a.localeCompare(b))
      .map(([maand, bedrag]) => ({ maand, bedrag: Math.round(bedrag) })),
    perSoort: Object.entries(perSoort)
      .sort(([, a], [, b]) => b - a)
      .map(([soort, bedrag]) => ({ soort, bedrag: Math.round(bedrag) })),
    // Alle cliënten teruggeven (geen top-N cap) — nodig voor budget-overzicht
    // dat álle budgethouders met of zonder budget moet kunnen tonen.
    perPersoon: Object.entries(perPersoon)
      .sort(([, a], [, b]) => b - a)
      .map(([naam, bedrag]) => ({ naam, bedrag: Math.round(bedrag) })),
  });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";

// Geeft per budgethouder een rij met totaal én perMaand[12] voor het opgegeven
// jaar. Bedoeld voor de "Waarom?"-cliënt-drilldown bij PGB-omzetcategorieën.
//
// Filter:
//   - status != "ingetrokken"
//   - bedrag > 0
//   - jaar = ?jaar
// Soort wordt NIET gefilterd (Geleverde zorg én Maandloon meegenomen) — het
// onderscheid is administratief; voor cliënt-beweging telt het totaal.

export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaarParam = url.searchParams.get("jaar");
  if (!jaarParam) return NextResponse.json({ error: "jaar is verplicht" }, { status: 400 });
  const jaar = parseInt(jaarParam, 10);
  if (Number.isNaN(jaar)) return NextResponse.json({ error: "jaar moet een nummer zijn" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attiva_declaraties")
    .select("budgethouder,bedrag,status,periode")
    .eq("jaar", jaar)
    .not("bedrag", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    budgethouder: string | null;
    bedrag: number | null;
    status: string | null;
    periode: string | null;
  };

  const actief = (data as Row[] ?? []).filter(r =>
    !String(r.status ?? "").toLowerCase().includes("ingetrokken") &&
    (r.bedrag ?? 0) > 0
  );

  // Aggregeer per budgethouder per maand
  const map: Record<string, { totaal: number; perMaand: number[] }> = {};
  for (const r of actief) {
    const naam = r.budgethouder?.trim() || "Onbekend";
    // periode is yyyy-mm format; we hebben de maand (1..12) nodig
    const maandStr = r.periode ? r.periode.slice(5, 7) : "";
    const maand = parseInt(maandStr, 10);
    if (Number.isNaN(maand) || maand < 1 || maand > 12) continue;

    if (!map[naam]) map[naam] = { totaal: 0, perMaand: Array(12).fill(0) };
    const bedrag = r.bedrag ?? 0;
    map[naam].totaal += bedrag;
    map[naam].perMaand[maand - 1] += bedrag;
  }

  const personen = Object.entries(map)
    .map(([naam, v]) => ({
      naam,
      totaal: Math.round(v.totaal),
      perMaand: v.perMaand.map(x => Math.round(x)),
    }))
    .filter(p => p.totaal > 0)
    .sort((a, b) => b.totaal - a.totaal);

  return NextResponse.json({
    jaar,
    totaal: personen.reduce((s, p) => s + p.totaal, 0),
    aantalPersonen: personen.length,
    personen,
  });
}

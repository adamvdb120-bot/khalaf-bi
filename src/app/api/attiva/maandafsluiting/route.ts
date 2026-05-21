import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";

const CLIENT_SLUG = "attiva";

type MaandStatus = "open" | "in_verwerking" | "gecontroleerd" | "afgesloten";

// 8 checklist-velden — interne lijst voor server-side logica. De frontend
// heeft een eigen kopie (Next.js staat geen non-handler exports toe op een
// route-file, dus géén `export` hier).
const CHECK_VELDEN = [
  "check_boekingen",
  "check_omzet",
  "check_kosten",
  "check_declaraties",
  "check_budgetten",
  "check_crediteuren",
  "check_afwijkingen",
  "check_maandrapport",
] as const;

type CheckVeld = (typeof CHECK_VELDEN)[number];

interface MaandRow {
  id: string | null;
  client_slug: string;
  jaar: number;
  maand: number;
  status: MaandStatus;
  check_boekingen: boolean;
  check_omzet: boolean;
  check_kosten: boolean;
  check_declaraties: boolean;
  check_budgetten: boolean;
  check_crediteuren: boolean;
  check_afwijkingen: boolean;
  check_maandrapport: boolean;
  notitie: string | null;
  aangemaakt_op: string | null;
  gewijzigd_op: string | null;
}

function legeMaand(jaar: number, maand: number): MaandRow {
  return {
    id: null,
    client_slug: CLIENT_SLUG,
    jaar,
    maand,
    status: "open",
    check_boekingen: false,
    check_omzet: false,
    check_kosten: false,
    check_declaraties: false,
    check_budgetten: false,
    check_crediteuren: false,
    check_afwijkingen: false,
    check_maandrapport: false,
    notitie: null,
    aangemaakt_op: null,
    gewijzigd_op: null,
  };
}

// GET /api/attiva/maandafsluiting?jaar=2025
// Returnt altijd 12 maanden (auto-fill ontbrekende met defaults).
export async function GET(req: Request) {
  const access = await checkClientAccess(CLIENT_SLUG);
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaarParam = url.searchParams.get("jaar");
  if (!jaarParam) return NextResponse.json({ error: "jaar is verplicht" }, { status: 400 });
  const jaar = parseInt(jaarParam, 10);
  if (Number.isNaN(jaar)) return NextResponse.json({ error: "jaar moet een nummer zijn" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_maandafsluiting")
    .select("*")
    .eq("client_slug", CLIENT_SLUG)
    .eq("jaar", jaar)
    .order("maand", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-fill: zorg dat we altijd 12 rijen terugkrijgen, ook als er nog niets
  // bestaat in de DB. De UI kan dan zonder fallbacks renderen.
  const opMaand = new Map<number, MaandRow>();
  for (const row of (data as MaandRow[] | null) ?? []) {
    opMaand.set(row.maand, row);
  }
  const alleMaanden: MaandRow[] = [];
  for (let m = 1; m <= 12; m++) {
    alleMaanden.push(opMaand.get(m) ?? legeMaand(jaar, m));
  }

  return NextResponse.json({ jaar, maanden: alleMaanden });
}

// PATCH /api/attiva/maandafsluiting
// Body: { jaar, maand, status?, check_xxx?, notitie? }
// Upsert per maand. Server-side regel: als alle 8 checks true zijn EN status is
// geen 'afgesloten' (handmatige eindstand), bump status automatisch naar
// 'gecontroleerd'. Voorkomt dat de gebruiker dit zelf moet doen.
export async function PATCH(req: Request) {
  const access = await checkClientAccess(CLIENT_SLUG);
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body ontbreekt" }, { status: 400 });

  const jaar = typeof body.jaar === "number" ? body.jaar : NaN;
  const maand = typeof body.maand === "number" ? body.maand : NaN;
  if (!Number.isInteger(jaar) || jaar < 2020 || jaar > 2050) {
    return NextResponse.json({ error: "Ongeldig jaar" }, { status: 400 });
  }
  if (!Number.isInteger(maand) || maand < 1 || maand > 12) {
    return NextResponse.json({ error: "Ongeldige maand" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Haal bestaande rij op (of leeg) zodat we kunnen 'mergen' met de patch
  // en de auto-status kunnen evalueren op het gecombineerde resultaat.
  const { data: bestaand } = await admin
    .from("client_maandafsluiting")
    .select("*")
    .eq("client_slug", CLIENT_SLUG)
    .eq("jaar", jaar)
    .eq("maand", maand)
    .maybeSingle();

  const huidig: MaandRow = (bestaand as MaandRow | null) ?? legeMaand(jaar, maand);

  // Bouw update-object: alleen velden die in de body staan worden vervangen.
  const update: Partial<MaandRow> & { gewijzigd_op: string } = {
    client_slug: CLIENT_SLUG,
    jaar,
    maand,
    gewijzigd_op: new Date().toISOString(),
  };

  // Status (optioneel, gevalideerd)
  if (body.status !== undefined) {
    const s = body.status;
    if (s !== "open" && s !== "in_verwerking" && s !== "gecontroleerd" && s !== "afgesloten") {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    update.status = s;
  }

  // Checklist-velden
  for (const veld of CHECK_VELDEN) {
    if (body[veld] !== undefined) {
      update[veld] = Boolean(body[veld]);
    }
  }

  // Notitie (optioneel, lege string wordt null)
  if (body.notitie !== undefined) {
    const n = typeof body.notitie === "string" ? body.notitie.trim() : "";
    update.notitie = n.length > 0 ? n : null;
  }

  // Bepaal de definitieve waarden door huidig + update samen te voegen.
  const merged: MaandRow = { ...huidig, ...update };

  // Auto-status: alle checks klaar én niet handmatig op 'afgesloten' →
  // bump naar 'gecontroleerd'. We doen dit alleen als de gebruiker NIET zelf
  // een status in deze patch heeft meegegeven (anders overschrijven we
  // expliciete keuze).
  if (body.status === undefined) {
    const alleChecksKlaar = CHECK_VELDEN.every((v) => merged[v] === true);
    if (alleChecksKlaar && merged.status !== "afgesloten") {
      update.status = "gecontroleerd";
      merged.status = "gecontroleerd";
    }
  }

  // Upsert
  const { data: nieuw, error: upsertError } = await admin
    .from("client_maandafsluiting")
    .upsert(update, { onConflict: "client_slug,jaar,maand" })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ maand: nieuw as MaandRow });
}

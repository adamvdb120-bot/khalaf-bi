import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface TaakRow {
  id: string;
  client_slug: string;
  titel: string;
  beschrijving: string | null;
  notitie: string | null;
  bedrag: number | null;
  status: "open" | "gedaan" | "genegeerd";
  source: string;
  aangemaakt_op: string;
  gewijzigd_op: string;
  voltooid_op: string | null;
}

const CLIENT_SLUG = "attiva";

// GET /api/attiva/taken[?status=open]
// Returnt taken voor de attiva-klant, optioneel gefilterd op status.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("client_taken")
    .select("*")
    .eq("client_slug", CLIENT_SLUG)
    .order("aangemaakt_op", { ascending: false });

  if (statusFilter && ["open", "gedaan", "genegeerd"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ taken: (data as TaakRow[]) ?? [] });
}

// POST /api/attiva/taken
// Body: { titel, beschrijving?, bedrag?, source? }
// Maakt een nieuwe taak aan in status 'open'.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    titel?: string;
    beschrijving?: string;
    bedrag?: number;
    source?: string;
  } | null;

  if (!body?.titel || body.titel.trim().length === 0) {
    return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_taken")
    .insert({
      client_slug: CLIENT_SLUG,
      titel: body.titel.trim().slice(0, 200),
      beschrijving: body.beschrijving?.trim() || null,
      bedrag: typeof body.bedrag === "number" ? body.bedrag : null,
      source: body.source?.trim() || "manual",
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ taak: data as TaakRow });
}

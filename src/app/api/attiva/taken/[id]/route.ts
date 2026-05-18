import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TaakRow } from "../route";

const CLIENT_SLUG = "attiva";

// PATCH /api/attiva/taken/[id]
// Body: { status?, titel?, beschrijving?, notitie?, bedrag? }
// Velden die niet meegegeven worden blijven ongewijzigd.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID ontbreekt" }, { status: 400 });

  const body = await req.json().catch(() => null) as {
    status?: "open" | "gedaan" | "genegeerd";
    titel?: string;
    beschrijving?: string | null;
    notitie?: string | null;
    bedrag?: number | null;
  } | null;
  if (!body) return NextResponse.json({ error: "Body ontbreekt" }, { status: 400 });

  const update: Record<string, unknown> = {
    gewijzigd_op: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!["open", "gedaan", "genegeerd"].includes(body.status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    update.status = body.status;
    // Markeer voltooid_op alleen bij overgang naar 'gedaan'.
    update.voltooid_op = body.status === "gedaan" ? new Date().toISOString() : null;
  }
  if (body.titel !== undefined) {
    const t = body.titel.trim();
    if (t.length === 0) return NextResponse.json({ error: "Titel mag niet leeg zijn" }, { status: 400 });
    update.titel = t.slice(0, 200);
  }
  if (body.beschrijving !== undefined) {
    update.beschrijving = body.beschrijving?.trim() || null;
  }
  if (body.notitie !== undefined) {
    update.notitie = body.notitie?.trim() || null;
  }
  if (body.bedrag !== undefined) {
    update.bedrag = body.bedrag;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_taken")
    .update(update)
    .eq("id", id)
    .eq("client_slug", CLIENT_SLUG)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ taak: data as TaakRow });
}

// DELETE /api/attiva/taken/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID ontbreekt" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("client_taken")
    .delete()
    .eq("id", id)
    .eq("client_slug", CLIENT_SLUG);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

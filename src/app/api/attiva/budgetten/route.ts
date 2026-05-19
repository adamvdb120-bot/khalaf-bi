import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkClientAccess } from "@/lib/portal/access";

export async function GET(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const url = new URL(req.url);
  const jaar = url.searchParams.get("jaar") ? parseInt(url.searchParams.get("jaar")!) : new Date().getFullYear();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attiva_pgb_budgetten")
    .select("budgethouder, budget")
    .eq("jaar", jaar);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const access = await checkClientAccess("attiva");
  if (!access) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const body = await req.json();
  const { budgethouder, jaar, budget } = body;

  if (!budgethouder || !jaar || budget === undefined) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("attiva_pgb_budgetten")
    .upsert(
      { budgethouder, jaar, budget, updated_at: new Date().toISOString() },
      { onConflict: "budgethouder,jaar" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Doelen {
  jaar: number;
  omzet_doel: number | null;
  kosten_doel: number | null;
  marge_pct_doel: number | null;
  resultaat_doel: number | null;
  notitie?: string | null;
  updated_at?: string;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const url = new URL(req.url);
  const jaar = parseInt(url.searchParams.get("jaar") ?? new Date().getFullYear().toString(), 10);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attiva_doelen")
    .select("*")
    .eq("jaar", jaar)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Default: lege doelen-set voor dit jaar
  if (!data) {
    return NextResponse.json({
      jaar,
      omzet_doel: null,
      kosten_doel: null,
      marge_pct_doel: null,
      resultaat_doel: null,
      notitie: null,
    });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  // Check admin rol
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Alleen admins mogen doelen wijzigen" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const jaar = parseInt(body.jaar, 10);
  if (!jaar || jaar < 2020 || jaar > 2050) {
    return NextResponse.json({ error: "Ongeldig jaar" }, { status: 400 });
  }

  // Normaliseer numerieke waarden — null als leeg/0
  const num = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attiva_doelen")
    .upsert({
      jaar,
      omzet_doel: num(body.omzet_doel),
      kosten_doel: num(body.kosten_doel),
      marge_pct_doel: num(body.marge_pct_doel),
      resultaat_doel: num(body.resultaat_doel),
      notitie: body.notitie ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "jaar" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

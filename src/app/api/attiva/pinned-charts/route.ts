import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab");

  const admin = createAdminClient();
  let query = admin
    .from("attiva_pinned_charts")
    .select("id, tab, title, chart_type, chart_data, chart_keys, question, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (tab) query = query.eq("tab", tab);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json();
  const { tab, title, chart_type, chart_data, chart_keys, question } = body;

  if (!title || !chart_type || !chart_data || !chart_keys) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attiva_pinned_charts")
    .insert({ user_id: user.id, tab: tab ?? "financieel", title, chart_type, chart_data, chart_keys, question })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Geen ID" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("attiva_pinned_charts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

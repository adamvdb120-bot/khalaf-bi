import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const fullName: string = (body.full_name ?? "").toString().trim();

  if (fullName.length === 0) {
    return NextResponse.json({ error: "Naam mag niet leeg zijn" }, { status: 400 });
  }
  if (fullName.length > 120) {
    return NextResponse.json({ error: "Naam is te lang (max 120 tekens)" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, full_name: fullName });
}

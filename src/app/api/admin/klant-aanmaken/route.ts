import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Controleer of aanvrager admin is
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { email, password, full_name, company } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "E-mail en wachtwoord zijn verplicht" }, { status: 400 });

  const admin = createAdminClient();

  // Maak gebruiker aan
  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError)
    return NextResponse.json({ error: userError.message }, { status: 400 });

  // Maak profiel aan
  await admin.from("profiles").insert({
    id: newUser.user.id,
    full_name: full_name || email.split("@")[0],
    company: company || "",
    role: "client",
  });

  return NextResponse.json({ success: true, userId: newUser.user.id });
}

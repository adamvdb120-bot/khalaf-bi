import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAttivaSignals } from "@/lib/portal/signals";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const { data: profile } = await supabase
    .from("profiles").select("role, client_slug").eq("id", user.id).single();

  if (!profile) return NextResponse.json({ notifications: [] });

  const isAdmin = profile.role === "admin";
  const ownSlug = profile.client_slug;

  // Alleen de admin én de Attiva-klant zelf zien de Attiva-signalen.
  // Andere klanten hebben (nog) geen eigen signaalbron.
  const wantsAttiva = isAdmin || ownSlug === "attiva";
  if (!wantsAttiva) return NextResponse.json({ notifications: [] });

  const admin = createAdminClient();
  const { notifications } = await buildAttivaSignals(admin);

  return NextResponse.json({ notifications });
}

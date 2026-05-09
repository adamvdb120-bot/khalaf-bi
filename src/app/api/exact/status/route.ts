import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  // Alleen admins mogen status zien
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("exact_tokens")
    .select("client_name, division, expires_at, updated_at")
    .eq("client_name", "attiva")
    .single();

  if (!row) {
    return NextResponse.json({ connected: false, client_name: "attiva" });
  }

  const expiresAtMs = new Date(row.expires_at).getTime();
  const now = Date.now();
  const minutesUntilExpiry = Math.round((expiresAtMs - now) / 60000);

  return NextResponse.json({
    connected: true,
    client_name: row.client_name,
    division: row.division,
    expires_at: row.expires_at,
    minutes_until_expiry: minutesUntilExpiry,
    updated_at: row.updated_at,
    is_expired: minutesUntilExpiry < 0,
    is_expiring_soon: minutesUntilExpiry < 5,
  });
}

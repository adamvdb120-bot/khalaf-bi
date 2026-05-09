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
  const { data: row, error: dbError } = await admin
    .from("exact_tokens")
    .select("client_name, division, expires_at, created_at")
    .eq("client_name", "attiva")
    .single();

  if (dbError || !row) {
    return NextResponse.json({
      connected: false,
      client_name: "attiva",
      debug: dbError?.message,
    });
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
    created_at: row.created_at,
    // Refresh tokens van Exact zijn meestal 30 dagen geldig.
    // Access token vervalt na ~10 min, maar wordt automatisch ververst.
    is_expired: minutesUntilExpiry < 0,
    is_expiring_soon: minutesUntilExpiry < 5,
  });
}

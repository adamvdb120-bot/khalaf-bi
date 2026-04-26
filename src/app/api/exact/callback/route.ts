import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Geen code ontvangen" }, { status: 400 });

  // Wissel code in voor tokens
  const tokenRes = await fetch("https://start.exactonline.nl/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EXACT_REDIRECT_URI!,
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json({ error: "Token exchange mislukt", details: err }, { status: 500 });
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Haal division op
  const meRes = await fetch("https://start.exactonline.nl/api/v1/current/Me", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    },
  });
  const meData = await meRes.json();
  const division = meData.d?.results?.[0]?.CurrentDivision ?? null;

  // Sla op in Supabase
  const admin = createAdminClient();
  await admin.from("exact_tokens").upsert({
    client_name: "attiva",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    division,
  }, { onConflict: "client_name" });

  return NextResponse.redirect("http://localhost:3000/portal/dashboard/attiva");
}

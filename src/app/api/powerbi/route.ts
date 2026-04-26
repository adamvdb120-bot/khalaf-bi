import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/powerbi
 * Body: { reportId: string }
 *
 * 1. Controleer of de gebruiker ingelogd is via Supabase
 * 2. Haal het rapport op uit de database (workspace_id + powerbi_report_id)
 * 3. Haal een Azure AD access token op via client credentials
 * 4. Genereer een Power BI embed token via de REST API
 * 5. Stuur embed token + embed URL terug naar de client
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { reportId } = await req.json();
  if (!reportId) {
    return NextResponse.json({ error: "reportId ontbreekt" }, { status: 400 });
  }

  // Haal rapport op uit database
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("powerbi_report_id, workspace_id")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Rapport niet gevonden" }, { status: 404 });
  }

  try {
    // Stap 1: Azure AD token ophalen (service principal)
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.POWERBI_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.POWERBI_CLIENT_ID!,
          client_secret: process.env.POWERBI_CLIENT_SECRET!,
          scope: "https://analysis.windows.net/powerbi/api/.default",
        }),
      }
    );

    if (!tokenRes.ok) {
      throw new Error("Azure AD token ophalen mislukt");
    }

    const { access_token } = await tokenRes.json();

    // Stap 2: Power BI embed token genereren
    const embedTokenRes = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${report.workspace_id}/reports/${report.powerbi_report_id}/GenerateToken`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessLevel: "view" }),
      }
    );

    if (!embedTokenRes.ok) {
      throw new Error("Power BI embed token genereren mislukt");
    }

    const { token } = await embedTokenRes.json();

    const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${report.powerbi_report_id}&groupId=${report.workspace_id}`;

    return NextResponse.json({ token, embedUrl, reportId: report.powerbi_report_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

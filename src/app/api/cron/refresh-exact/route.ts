import { NextResponse } from "next/server";

/**
 * Cron job: ververst Exact Online cache voor alle klanten.
 * Wordt elke nacht om 03:00 aangeroepen door Vercel Cron.
 *
 * Zie vercel.json voor de schedule.
 * Vercel stuurt automatisch een Authorization header met CRON_SECRET.
 */
export async function GET(req: Request) {
  // Beveiligen: alleen Vercel Cron mag dit aanroepen
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const huidigJaar = new Date().getFullYear();
  const vorigJaar = huidigJaar - 1;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://khalaf-bi.vercel.app";

  const klanten = ["attiva"];
  const results: Record<string, unknown> = {};

  for (const klant of klanten) {
    // Triggert de Exact data fetch met refresh=1 zodat de cache vers wordt
    // We slaan auth check over door rechtstreeks de fetch met service-role context te doen
    try {
      const url = `${baseUrl}/api/exact/data?jaar=${huidigJaar}&jaarVorig=${vorigJaar}&refresh=1&cron=1`;
      const res = await fetch(url, {
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      });
      results[klant] = {
        status: res.status,
        ok: res.ok,
        cacheRefreshed: res.ok,
      };
    } catch (e) {
      results[klant] = { error: e instanceof Error ? e.message : "unknown" };
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
  });
}

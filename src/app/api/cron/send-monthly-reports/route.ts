import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron job: stuurt elke 1e van de maand een maandrapport per email naar de klant.
 * Schedule: 0 8 1 * *  (08:00 UTC = 09:00 of 10:00 NL tijd, 1e van de maand)
 */

const MAANDEN_NL = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

// Configuratie van klanten die een maandrapport moeten ontvangen
const KLANTEN = [
  {
    slug: "attiva",
    naam: "Attiva Zorg",
    email: process.env.ATTIVA_REPORT_EMAIL ?? "",
  },
];

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface ExactData { pl: PlRow[]; jaar: number }

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}

function pct(v: number) {
  if (!isFinite(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

/** Bouw KPIs voor de afgelopen maand uit de cache data */
function buildKpis(huidig: ExactData, vorig: ExactData, periode: number) {
  const omzet = huidig.pl.filter(r => r.IsRevenue && r.Period === periode).reduce((s, r) => s + r.Amount, 0);
  const kosten = huidig.pl.filter(r => !r.IsRevenue && r.Period === periode).reduce((s, r) => s + r.Amount, 0);
  const marge = omzet - kosten;

  const omzetVorig = vorig.pl.filter(r => r.IsRevenue && r.Period === periode).reduce((s, r) => s + r.Amount, 0);
  const kostenVorig = vorig.pl.filter(r => !r.IsRevenue && r.Period === periode).reduce((s, r) => s + r.Amount, 0);

  // Year-to-date totalen
  const omzetYTD = huidig.pl.filter(r => r.IsRevenue && r.Period <= periode).reduce((s, r) => s + r.Amount, 0);
  const kostenYTD = huidig.pl.filter(r => !r.IsRevenue && r.Period <= periode).reduce((s, r) => s + r.Amount, 0);

  return {
    omzet, kosten, marge,
    omzetTrend: omzetVorig > 0 ? ((omzet - omzetVorig) / omzetVorig) * 100 : 0,
    kostenTrend: kostenVorig > 0 ? ((kosten - kostenVorig) / kostenVorig) * 100 : 0,
    omzetYTD, kostenYTD,
    margeYTD: omzetYTD - kostenYTD,
    margePct: omzet > 0 ? (marge / omzet) * 100 : 0,
  };
}

function buildEmailHtml(klantNaam: string, periodeNaam: string, jaar: number, kpis: ReturnType<typeof buildKpis>, dashboardUrl: string) {
  const trendColor = (v: number) => v > 0 ? "#10b981" : v < 0 ? "#ef4444" : "#94a3b8";
  const trendArrow = (v: number) => v > 0 ? "↗" : v < 0 ? "↘" : "→";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Maandrapport ${klantNaam}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">

        <!-- Header -->
        <tr><td style="background:#1B3A5C;padding:30px 40px;">
          <div style="color:#C9A84C;font-size:20px;font-weight:bold;letter-spacing:1px;">KHALAF BI</div>
          <div style="color:#ffffff;font-size:11px;opacity:0.7;margin-top:4px;">Driven by data</div>
        </td></tr>

        <!-- Title -->
        <tr><td style="padding:40px 40px 20px;">
          <div style="color:#94a3b8;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">${periodeNaam} ${jaar}</div>
          <h1 style="color:#1B3A5C;font-size:26px;margin:8px 0 0;font-weight:700;">Maandrapport ${klantNaam}</h1>
          <p style="color:#64748b;font-size:14px;margin:12px 0 0;line-height:1.6;">Hieronder vindt u de belangrijkste cijfers van afgelopen maand.</p>
        </td></tr>

        <!-- KPI Grid -->
        <tr><td style="padding:0 40px 30px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding:20px;background:#f8fafc;border-radius:12px;border-top:4px solid #1B3A5C;">
                <div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Omzet</div>
                <div style="color:#1B3A5C;font-size:22px;font-weight:bold;margin:6px 0 4px;">${euro(kpis.omzet)}</div>
                <div style="color:${trendColor(kpis.omzetTrend)};font-size:11px;font-weight:600;">${trendArrow(kpis.omzetTrend)} ${pct(kpis.omzetTrend)} t.o.v. vorig jaar</div>
              </td>
              <td width="2%"></td>
              <td width="33%" style="padding:20px;background:#f8fafc;border-radius:12px;border-top:4px solid #C9A84C;">
                <div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Kosten</div>
                <div style="color:#1B3A5C;font-size:22px;font-weight:bold;margin:6px 0 4px;">${euro(kpis.kosten)}</div>
                <div style="color:${trendColor(-kpis.kostenTrend)};font-size:11px;font-weight:600;">${trendArrow(kpis.kostenTrend)} ${pct(kpis.kostenTrend)} t.o.v. vorig jaar</div>
              </td>
              <td width="2%"></td>
              <td width="30%" style="padding:20px;background:#f8fafc;border-radius:12px;border-top:4px solid ${kpis.marge >= 0 ? '#10b981' : '#ef4444'};">
                <div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Marge</div>
                <div style="color:${kpis.marge >= 0 ? '#10b981' : '#ef4444'};font-size:22px;font-weight:bold;margin:6px 0 4px;">${euro(kpis.marge)}</div>
                <div style="color:#94a3b8;font-size:11px;font-weight:600;">${kpis.margePct.toFixed(1)}% van omzet</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- YTD samenvatting -->
        <tr><td style="padding:0 40px 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;">
            <tr><td style="padding:20px;">
              <div style="color:#1B3A5C;font-size:14px;font-weight:bold;margin-bottom:12px;">Jaar tot nu toe (${jaar})</div>
              <table width="100%"><tr>
                <td><span style="color:#94a3b8;font-size:12px;">Totale omzet:</span> <span style="color:#1B3A5C;font-weight:600;font-size:13px;">${euro(kpis.omzetYTD)}</span></td>
                <td><span style="color:#94a3b8;font-size:12px;">Totale kosten:</span> <span style="color:#1B3A5C;font-weight:600;font-size:13px;">${euro(kpis.kostenYTD)}</span></td>
                <td><span style="color:#94a3b8;font-size:12px;">Resultaat:</span> <span style="color:${kpis.margeYTD >= 0 ? '#10b981' : '#ef4444'};font-weight:600;font-size:13px;">${euro(kpis.margeYTD)}</span></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:0 40px 40px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#1B3A5C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;">Bekijk volledig dashboard →</a>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Voor live cijfers, grafieken, declaraties en de AI-assistent.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            Dit rapport is automatisch gegenereerd door Khalaf BI.<br>
            Heeft u vragen? Reply gewoon op deze email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

export async function GET(req: Request) {
  // Beveiligen tegen ongeauthoriseerd misbruik
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const isManualTest = url.searchParams.get("test") === "1";
  const cronSecretMatch = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!cronSecretMatch && !isManualTest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY niet geconfigureerd" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const admin = createAdminClient();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://khalaf-bi.vercel.app";

  // Periode bepalen: bij cron = vorige maand, bij test = huidige maand
  const now = new Date();
  let periodeMaand = now.getMonth(); // 0-11
  let periodeJaar = now.getFullYear();
  if (!isManualTest) {
    // 1e van de maand → vorige maand rapporteren
    periodeMaand = periodeMaand - 1;
    if (periodeMaand < 0) { periodeMaand = 11; periodeJaar -= 1; }
  }
  const periodeNaam = MAANDEN_NL[periodeMaand];
  const periodeNummer = periodeMaand + 1; // 1-12 voor data filtering

  const results: Record<string, unknown> = {};

  for (const klant of KLANTEN) {
    if (!klant.email) {
      results[klant.slug] = { skipped: "Geen email geconfigureerd" };
      continue;
    }

    try {
      // Lees de gecachte data uit Supabase
      const cacheKey = `${periodeJaar}-${periodeJaar - 1}`;
      const { data: cacheRow } = await admin
        .from("exact_data_cache")
        .select("data")
        .eq("client_name", klant.slug)
        .eq("cache_key", cacheKey)
        .single();

      if (!cacheRow?.data) {
        results[klant.slug] = { error: `Geen data in cache voor ${cacheKey}` };
        continue;
      }

      const data = cacheRow.data as { huidig: ExactData; vorig: ExactData };
      const kpis = buildKpis(data.huidig, data.vorig, periodeNummer);

      const html = buildEmailHtml(
        klant.naam, periodeNaam, periodeJaar, kpis,
        `${baseUrl}/portal/dashboard/${klant.slug}`
      );

      const sendResult = await resend.emails.send({
        from: "Khalaf BI <onboarding@resend.dev>",
        to: klant.email,
        subject: `Maandrapport ${klant.naam} — ${periodeNaam} ${periodeJaar}`,
        html,
      });

      results[klant.slug] = {
        sent: !sendResult.error,
        emailId: sendResult.data?.id,
        error: sendResult.error?.message,
        to: klant.email,
      };
    } catch (e) {
      results[klant.slug] = { error: e instanceof Error ? e.message : "unknown" };
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    periode: `${periodeNaam} ${periodeJaar}`,
    results,
  });
}

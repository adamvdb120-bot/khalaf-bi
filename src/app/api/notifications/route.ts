import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Notification {
  id: string;
  type: "crediteur" | "marge" | "exact" | "data" | "info";
  severity: "alarm" | "attention" | "info";
  titel: string;
  beschrijving: string;
  href: string;
  klant?: string;
  bedrag?: string;
}

interface CrediteurRow { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }
interface PlRow { Amount: number; IsRevenue: boolean; Period: number }

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const { data: profile } = await supabase
    .from("profiles").select("role, client_slug").eq("id", user.id).single();

  if (!profile) return NextResponse.json({ notifications: [] });

  const isAdmin = profile.role === "admin";
  const ownSlug = profile.client_slug;

  // Welke klanten kunnen we checken?
  // Admin = alle bekende klanten
  // Client = alleen eigen slug
  const klantenTeCheck = isAdmin ? ["attiva"] : (ownSlug ? [ownSlug] : []);

  const notifications: Notification[] = [];
  const admin = createAdminClient();

  // ─── Exact token status (alleen admins zien dit) ────────────────────────
  if (isAdmin) {
    const { data: tokenRow } = await admin
      .from("exact_tokens")
      .select("client_name, expires_at")
      .eq("client_name", "attiva")
      .single();

    if (!tokenRow) {
      notifications.push({
        id: "exact-not-connected",
        type: "exact",
        severity: "alarm",
        titel: "Exact Online niet gekoppeld",
        beschrijving: "Attiva heeft geen actieve Exact-koppeling. Data kan niet vernieuwen.",
        href: "/portal/instellingen",
        klant: "Attiva Zorg",
      });
    }
  }

  // ─── Per klant: crediteuren + marge checks ─────────────────────────────
  for (const slug of klantenTeCheck) {
    if (slug !== "attiva") continue; // alleen Attiva heeft Exact-data

    // Pak meest recente cache
    const { data: cacheRow } = await admin
      .from("exact_data_cache")
      .select("data, updated_at")
      .eq("client_name", slug)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheRow?.data) continue;

    const cache = cacheRow.data as {
      huidig?: { crediteuren?: CrediteurRow[]; pl?: PlRow[] };
      crediteuren?: CrediteurRow[];
      pl?: PlRow[];
    };
    const huidig = cache.huidig ?? cache;
    const crediteuren = huidig?.crediteuren ?? [];
    const pl = huidig?.pl ?? [];

    // Urgent crediteuren > 90 dagen
    const totaal90Plus = crediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);
    if (totaal90Plus > 5000) {
      const topUrgent = crediteuren
        .filter(c => (c.Age90Plus ?? 0) > 0)
        .sort((a, b) => (b.Age90Plus ?? 0) - (a.Age90Plus ?? 0))[0];
      notifications.push({
        id: `cred-${slug}`,
        type: "crediteur",
        severity: totaal90Plus > 15000 ? "alarm" : "attention",
        titel: `${euro(totaal90Plus)} aan crediteuren staat >90 dagen open`,
        beschrijving: topUrgent
          ? `Grootste: ${topUrgent.Name} (${euro(topUrgent.Age90Plus)})`
          : "Bekijk welke leveranciers contact nodig hebben",
        // ?tab=crediteuren wordt door AttivaTabs gelezen om direct de tab te openen
        href: "/portal/dashboard/attiva?tab=crediteuren",
        klant: "Attiva Zorg",
        bedrag: euro(totaal90Plus),
      });
    }

    // Negatieve marge / verlies
    const totaalOmzet = pl.filter(r => r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
    const totaalKosten = pl.filter(r => !r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
    const marge = totaalOmzet - totaalKosten;
    const margePct = totaalOmzet > 0 ? (marge / totaalOmzet) * 100 : 0;

    if (marge < 0) {
      notifications.push({
        id: `marge-neg-${slug}`,
        type: "marge",
        severity: "alarm",
        titel: "Negatief jaarresultaat",
        beschrijving: `Verlies van ${euro(Math.abs(marge))} — kosten overstijgen omzet`,
        href: "/portal/dashboard/attiva#sectie-marge",
        klant: "Attiva Zorg",
        bedrag: `${margePct.toFixed(1)}%`,
      });
    } else if (margePct < 5 && margePct > 0 && totaalOmzet > 50000) {
      notifications.push({
        id: `marge-low-${slug}`,
        type: "marge",
        severity: "attention",
        titel: "Zeer dunne marge",
        beschrijving: `Brutomarge is slechts ${margePct.toFixed(1)}% — onder kritische drempel`,
        href: "/portal/dashboard/attiva#sectie-marge",
        klant: "Attiva Zorg",
      });
    }

    // Cache verouderd? (>24u)
    const cacheAgeMs = Date.now() - new Date(cacheRow.updated_at).getTime();
    if (cacheAgeMs > 24 * 60 * 60 * 1000) {
      notifications.push({
        id: `cache-stale-${slug}`,
        type: "data",
        severity: "info",
        titel: "Data is meer dan 24 uur oud",
        beschrijving: "Klik vernieuwen op het dashboard voor verse cijfers",
        href: "/portal/dashboard/attiva",
        klant: "Attiva Zorg",
      });
    }
  }

  // Sorteer op severity (alarm > attention > info)
  const severityRank = { alarm: 0, attention: 1, info: 2 };
  notifications.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return NextResponse.json({ notifications });
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Zap, CheckCircle2, AlertCircle, AlertTriangle, Info,
  Wallet, TrendingDown, Plug, Database, Target, UserX,
  ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";

const VISIBLE_DEFAULT = 3;

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface CrediteurRow { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }

interface Notification {
  id: string;
  type: "crediteur" | "marge" | "exact" | "data" | "info" | "budget" | "client";
  severity: "alarm" | "attention" | "info";
  titel: string;
  beschrijving: string;
  href: string;
  klant?: string;
  bedrag?: string;
}

const TYPE_ICONS = {
  crediteur: Wallet,
  marge: TrendingDown,
  exact: Plug,
  data: Database,
  info: Info,
  budget: Target,
  client: UserX,
};

const SEVERITY_RANK = { alarm: 0, attention: 1, info: 2 } as const;
const TYPE_RANK: Record<Notification["type"], number> = {
  exact: 0, marge: 1, budget: 2, crediteur: 3, client: 4, data: 5, info: 6,
};

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

interface Props {
  /**
   * P&L-rijen van het jaar dat de gebruiker op het dashboard ziet.
   * Wanneer aanwezig berekenen we marge-alerts uit deze data — zo
   * tonen WatVraagtAandacht en de KPI-tegels gegarandeerd hetzelfde
   * verlies/winst-bedrag. Zonder pl valt de marge-check op de
   * notifications-API terug.
   */
  pl?: PlRow[];
  /** Aged crediteurenrijen — zelfde rationale: één bron voor de UI. */
  crediteuren?: CrediteurRow[];
}

export default function WatVraagtAandacht({ pl, crediteuren }: Props) {
  const [apiNotifications, setApiNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setApiNotifications(json.notifications ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Lokaal berekende meldingen uit door-de-parent doorgegeven data ────
  // Deze waarden komen uit dezelfde fetch (/api/exact/data) die ook de
  // KPI-tegels voedt — daardoor kunnen ze nooit meer afwijken.
  const localAlerts = useMemo<Notification[]>(() => {
    const alerts: Notification[] = [];

    // Marge-alert
    if (pl && pl.length > 0) {
      const omzet = pl.filter(r => r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
      const kosten = pl.filter(r => !r.IsRevenue).reduce((s, r) => s + r.Amount, 0);
      const marge = omzet - kosten;
      const margePct = omzet > 0 ? (marge / omzet) * 100 : 0;

      if (marge < 0) {
        alerts.push({
          id: "marge-neg-attiva",
          type: "marge",
          severity: "alarm",
          titel: "Negatief jaarresultaat",
          beschrijving: `Verlies van ${euro(Math.abs(marge))} — kosten overstijgen omzet`,
          href: "/portal/dashboard/attiva#sectie-marge",
          klant: "Attiva Zorg",
          bedrag: `${margePct.toFixed(1)}%`,
        });
      } else if (margePct < 5 && margePct > 0 && omzet > 50000) {
        alerts.push({
          id: "marge-low-attiva",
          type: "marge",
          severity: "attention",
          titel: "Zeer dunne marge",
          beschrijving: `Brutomarge is slechts ${margePct.toFixed(1)}% — onder kritische drempel`,
          href: "/portal/dashboard/attiva#sectie-marge",
          klant: "Attiva Zorg",
          bedrag: `${margePct.toFixed(1)}%`,
        });
      }
    }

    // Crediteuren-alert
    if (crediteuren && crediteuren.length > 0) {
      const totaal90Plus = crediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);
      if (totaal90Plus > 5000) {
        const topUrgent = crediteuren
          .filter(c => (c.Age90Plus ?? 0) > 0)
          .sort((a, b) => (b.Age90Plus ?? 0) - (a.Age90Plus ?? 0))[0];
        alerts.push({
          id: "cred-attiva",
          type: "crediteur",
          severity: totaal90Plus > 15000 ? "alarm" : "attention",
          titel: `${euro(totaal90Plus)} aan crediteuren staat >90 dagen open`,
          beschrijving: topUrgent
            ? `Grootste: ${topUrgent.Name} (${euro(topUrgent.Age90Plus)})`
            : "Bekijk welke leveranciers contact nodig hebben",
          href: "/portal/dashboard/attiva?tab=crediteuren",
          klant: "Attiva Zorg",
          bedrag: euro(totaal90Plus),
        });
      }
    }

    return alerts;
  }, [pl, crediteuren]);

  // ─── Combineren: lokale alerts hebben voorrang boven dezelfde types uit API ──
  const notifications = useMemo<Notification[]>(() => {
    if (!apiNotifications) return [];

    // Welke types berekenen we lokaal? Filter die uit API-output zodat we ze
    // niet dubbel tonen met (mogelijk) andere getallen.
    const lokaleTypes = new Set(localAlerts.map(a => a.type));
    const apiFiltered = apiNotifications.filter(n => !lokaleTypes.has(n.type));

    const combined = [...localAlerts, ...apiFiltered];
    combined.sort((a, b) => {
      const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (sev !== 0) return sev;
      return TYPE_RANK[a.type] - TYPE_RANK[b.type];
    });
    return combined;
  }, [apiNotifications, localAlerts]);

  // Loading: kleine skeleton zodat de pagina niet schokt zodra data laadt
  if (loading) {
    return (
      <div className="card animate-pulse h-20 flex items-center px-5">
        <div className="w-9 h-9 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="ml-3 flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-2.5 bg-gray-50 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Lege state — geen urgente acties
  if (notifications.length === 0) {
    return (
      <div className="card flex items-center gap-3 py-4 px-5 border-l-4 border-l-emerald-500">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-navy-700">Geen urgente acties deze week</p>
        </div>
      </div>
    );
  }

  // Hoogste severity bepaalt linker rand-kleur van de hele kaart
  const hoogsteSeverity = notifications[0]?.severity ?? "info";
  const randKleur = {
    alarm: "border-l-red-500",
    attention: "border-l-amber-500",
    info: "border-l-blue-500",
  }[hoogsteSeverity];

  const alarmCount = notifications.filter(n => n.severity === "alarm").length;
  const hasMore = notifications.length > VISIBLE_DEFAULT;
  const zichtbaar = expanded || !hasMore ? notifications : notifications.slice(0, VISIBLE_DEFAULT);

  return (
    <div className={`card border-l-4 ${randKleur} p-0 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-navy-700/5 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-navy-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-700">Wat vraagt aandacht?</h3>
            <p className="text-[10px] text-gray-400">
              {notifications.length} {notifications.length === 1 ? "punt" : "punten"}
              {alarmCount > 0 && <> · <span className="text-red-600 font-semibold">{alarmCount} urgent</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* Lijst */}
      <div className="divide-y divide-gray-50">
        {zichtbaar.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Info;
          const SeverityIcon = n.severity === "alarm" ? AlertCircle : n.severity === "attention" ? AlertTriangle : Info;
          const sev = {
            alarm: { bg: "bg-red-50", icoonKleur: "text-red-600", titelKleur: "text-red-700" },
            attention: { bg: "bg-amber-50", icoonKleur: "text-amber-600", titelKleur: "text-amber-700" },
            info: { bg: "bg-blue-50", icoonKleur: "text-blue-600", titelKleur: "text-blue-700" },
          }[n.severity];

          return (
            <Link
              key={n.id}
              href={n.href}
              className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-xl ${sev.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={sev.icoonKleur} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <SeverityIcon size={11} className={sev.icoonKleur} />
                  <p className={`text-sm font-bold ${sev.titelKleur}`}>{n.titel}</p>
                </div>
                <p className="text-xs text-gray-600 leading-snug">{n.beschrijving}</p>
              </div>
              {n.bedrag && (
                <span className={`text-xs font-semibold ${sev.titelKleur} opacity-80 flex-shrink-0 self-center`}>
                  {n.bedrag}
                </span>
              )}
              <ArrowRight size={14} className="text-gray-400 group-hover:text-navy-700 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>

      {/* Toggle voor meer/minder */}
      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-gray-500 hover:text-navy-700 hover:bg-gray-50 border-t border-gray-100 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} />
              Minder tonen
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              Bekijk alle {notifications.length} meldingen
            </>
          )}
        </button>
      )}
    </div>
  );
}

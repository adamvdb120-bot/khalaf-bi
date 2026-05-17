"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, CheckCircle2, AlertCircle, AlertTriangle, Info,
  Wallet, TrendingDown, Plug, Database, Target, UserX,
  ArrowRight,
} from "lucide-react";

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

export default function WatVraagtAandacht() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setNotifications(json.notifications ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

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

  // Lege state — alles in orde
  if (!notifications || notifications.length === 0) {
    return (
      <div className="card flex items-center gap-3 py-4 px-5 border-l-4 border-l-emerald-500">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-navy-700">Alles in orde deze week</p>
          <p className="text-xs text-gray-500 mt-0.5">Geen acute aandachtspunten — kijken kan, ingrijpen hoeft niet.</p>
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
        {notifications.map((n) => {
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
                <span className={`text-sm font-bold ${sev.titelKleur} flex-shrink-0`}>
                  {n.bedrag}
                </span>
              )}
              <ArrowRight size={14} className="text-gray-400 group-hover:text-navy-700 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

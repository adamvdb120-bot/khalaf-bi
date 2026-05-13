"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, AlertCircle, AlertTriangle, TrendingUp, Info, RefreshCw,
  ArrowUpRight, ArrowDownRight, Target, Users, Wallet, Activity,
} from "lucide-react";

interface Insight {
  titel: string;
  beschrijving: string;
  severity: "alarm" | "attention" | "positive" | "info";
  type: "trend" | "crediteur" | "concentratie" | "marge" | "groei" | "anomalie" | "actie";
  cijfer?: string;
}

interface InsightResponse {
  insights: Insight[];
  cached?: boolean;
  age_seconds?: number;
}

type AttivaTabId = "financieel" | "cashflow" | "crediteuren" | "declaraties";
type NavigateFn = (tab: AttivaTabId, sectionId?: string) => void;

// Map insight-type → waar de gebruiker waarschijnlijk heen wil
function navigationTarget(insight: Insight): { tab: AttivaTabId; section?: string } | null {
  switch (insight.type) {
    case "crediteur":
      return { tab: "crediteuren" };
    case "concentratie":
    case "groei":
      return { tab: "financieel", section: "sectie-omzet-categorie" };
    case "marge":
      return { tab: "financieel", section: "sectie-marge" };
    case "trend":
    case "anomalie":
      return { tab: "financieel", section: "sectie-omzet-kosten" };
    case "actie":
      // Vaak gerelateerd aan crediteuren in de huidige Attiva-data
      return { tab: "crediteuren" };
    default:
      return null;
  }
}

const SEVERITY_STYLES = {
  alarm: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    badge: "Actie nodig",
  },
  attention: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    badge: "Let op",
  },
  positive: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: TrendingUp,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    badge: "Goed nieuws",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    badge: "Inzicht",
  },
};

const TYPE_ICONS = {
  trend: Activity,
  crediteur: Wallet,
  concentratie: Users,
  marge: Target,
  groei: TrendingUp,
  anomalie: AlertTriangle,
  actie: ArrowUpRight,
};

export default function AutoInsights({
  jaar, onNavigate, onInsightsLoaded, compact = false,
}: {
  jaar: number;
  onNavigate?: NavigateFn;
  onInsightsLoaded?: (insights: Insight[]) => void;
  compact?: boolean;
}) {
  const [data, setData] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(forceRefresh = false) {
    if (forceRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attiva/insights?jaar=${jaar}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      if (onInsightsLoaded && json.insights) onInsightsLoaded(json.insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [jaar]);

  return (
    <div className="card">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-navy-700 text-sm flex items-center gap-2">
              <Sparkles size={13} className="text-navy-700" />
              Actiepunten
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              AI-analyse van je cijfers
              {data?.cached && data.age_seconds !== undefined && (
                <> · {formatAge(data.age_seconds)}</>
              )}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Herbereken"
            className="text-gray-300 hover:text-navy-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && <InsightsSkeleton compact={compact} />}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Kon inzichten niet laden</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && data && data.insights.length > 0 && (
          <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-3 gap-3"}>
            {data.insights.map((ins, i) => {
              const s = SEVERITY_STYLES[ins.severity] ?? SEVERITY_STYLES.info;
              const TypeIcon = TYPE_ICONS[ins.type] ?? Info;
              const SeverityIcon = s.icon;

              const target = navigationTarget(ins);
              const clickable = !!(onNavigate && target);

              // Compact = strakke lijst-row (geen grote gekleurde blokken meer)
              const cardContent = compact ? (
                <div className="flex items-center gap-3 py-1">
                  {/* Severity dot ipv groot blok */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ins.severity === "alarm" ? "bg-red-500" :
                    ins.severity === "attention" ? "bg-amber-500" :
                    ins.severity === "positive" ? "bg-emerald-500" : "bg-blue-500"
                  }`} />
                  {/* Icon */}
                  <TypeIcon size={14} className="text-gray-400 flex-shrink-0" />
                  {/* Titel + beschrijving */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-700 truncate">{ins.titel}</p>
                    <p className="text-xs text-gray-500 truncate">{ins.beschrijving}</p>
                  </div>
                  {/* Cijfer rechts */}
                  {ins.cijfer && (
                    <span className={`text-sm font-bold flex-shrink-0 ${
                      ins.severity === "alarm" ? "text-red-600" :
                      ins.severity === "attention" ? "text-amber-600" :
                      ins.severity === "positive" ? "text-emerald-600" : "text-navy-700"
                    }`}>
                      {ins.cijfer}
                    </span>
                  )}
                  {/* Klik-arrow */}
                  {clickable && (
                    <ArrowUpRight size={13} className="text-gray-300 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon size={16} className={s.iconColor} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${s.badgeBg} ${s.badgeText} px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                      <SeverityIcon size={10} />
                      {s.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm leading-snug ${s.titleColor}`}>
                      {ins.titel}
                    </h4>
                    {ins.cijfer && (
                      <p className={`text-xl font-bold mt-1 ${s.iconColor}`}>
                        {ins.cijfer}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">
                    {ins.beschrijving}
                  </p>

                  {clickable && (
                    <div className="mt-auto pt-2 flex items-center justify-end">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${s.iconColor} group-hover:gap-2 transition-all`}>
                        Bekijk details
                        <ArrowUpRight size={11} />
                      </span>
                    </div>
                  )}
                </>
              );

              const baseClass = compact
                ? "px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors"
                : `${s.bg} ${s.border} border rounded-xl p-4 flex flex-col gap-2.5 transition-all`;

              if (clickable && target) {
                return (
                  <button
                    key={i}
                    onClick={() => onNavigate!(target.tab, target.section)}
                    className={`group ${baseClass} text-left cursor-pointer w-full`}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <div key={i} className={`${baseClass}`}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && data && data.insights.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Geen inzichten beschikbaar.</p>
        )}
      </div>
    </div>
  );
}

function InsightsSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-3 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-gray-200" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAge(seconds: number): string {
  if (seconds < 60) return "net nu";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min geleden`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} uur geleden`;
  return `${Math.round(seconds / 86400)} dagen geleden`;
}

// Hide unused warnings for icons that are only used as type-icons
void [ArrowUpRight, ArrowDownRight];

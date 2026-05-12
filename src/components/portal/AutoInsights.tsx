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
    <div className="card relative overflow-hidden">
      {/* Decoratieve gradient */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-gold-500/10 to-navy-700/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-navy-700">Smart Insights</h3>
              <p className="text-[11px] text-gray-400">
                AI-analyse van je cijfers
                {data?.cached && data.age_seconds !== undefined && (
                  <> · bijgewerkt {formatAge(data.age_seconds)}</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Herbereken inzichten"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 hover:border-navy-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Vernieuwen
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

              // Compact = horizontale layout (icon links, content rechts), spaart verticale ruimte
              const cardContent = compact ? (
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon size={17} className={s.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-bold text-sm leading-snug ${s.titleColor}`}>
                        {ins.titel}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${s.badgeBg} ${s.badgeText} px-1.5 py-0.5 rounded inline-flex items-center gap-1 flex-shrink-0`}>
                        <SeverityIcon size={9} />
                        {s.badge}
                      </span>
                    </div>
                    {ins.cijfer && (
                      <p className={`text-lg font-bold leading-tight mb-1 ${s.iconColor}`}>
                        {ins.cijfer}
                      </p>
                    )}
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {ins.beschrijving}
                    </p>
                    {clickable && (
                      <div className="mt-2 flex items-center justify-end">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${s.iconColor} group-hover:gap-2 transition-all`}>
                          Bekijk
                          <ArrowUpRight size={11} />
                        </span>
                      </div>
                    )}
                  </div>
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
                ? `${s.bg} ${s.border} border rounded-xl p-3.5 transition-all`
                : `${s.bg} ${s.border} border rounded-xl p-4 flex flex-col gap-2.5 transition-all`;

              if (clickable && target) {
                return (
                  <button
                    key={i}
                    onClick={() => onNavigate!(target.tab, target.section)}
                    className={`group ${baseClass} text-left hover:shadow-md hover:-translate-y-0.5 cursor-pointer w-full`}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <div key={i} className={`${baseClass} hover:shadow-sm`}>
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
  return (
    <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-3 gap-3"}>
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

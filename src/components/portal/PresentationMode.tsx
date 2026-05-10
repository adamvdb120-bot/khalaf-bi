"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  X, ChevronLeft, ChevronRight, Sparkles, AlertCircle, AlertTriangle,
  TrendingUp, Info,
} from "lucide-react";

interface MaandRow { maand: string; omzet: number; kosten: number; marge: number }
interface CategorieRow { name: string; value: number }
interface Insight {
  titel: string; beschrijving: string;
  severity: "alarm" | "attention" | "positive" | "info";
  type: string;
  cijfer?: string;
}
interface CrediteurRow { Name: string; totaal: number; Age90Plus: number }

interface PresentationData {
  klantNaam: string;
  jaar: number;
  totaalOmzet: number;
  totaalKosten: number;
  totaalMarge: number;
  margePct: number;
  vorigOmzet: number;
  maandData: MaandRow[];
  topKosten: CategorieRow[];
  topOmzet: CategorieRow[];
  insights: Insight[];
  topCrediteuren: CrediteurRow[];
  totaalCrediteuren: number;
  totaal90Plus: number;
}

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}
function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

const SEVERITY_BG: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
  alarm: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", iconColor: "text-red-600" },
  attention: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", iconColor: "text-amber-600" },
  positive: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconColor: "text-emerald-600" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", iconColor: "text-blue-600" },
};

const SEVERITY_ICON = {
  alarm: AlertCircle,
  attention: AlertTriangle,
  positive: TrendingUp,
  info: Info,
};

export default function PresentationMode({
  data, onClose, onCategorieClick, onMaandClick,
}: {
  data: PresentationData;
  onClose: () => void;
  onCategorieClick?: (naam: string, type: "omzet" | "kosten") => void;
  onMaandClick?: (periode: number) => void;
}) {
  const [slide, setSlide] = useState(0);

  const slides = [
    "title",
    "insights",
    "kpi",
    "omzetkosten",
    "kosten",
    "crediteuren",
  ] as const;

  const total = slides.length;

  function next() { setSlide(s => Math.min(s + 1, total - 1)); }
  function prev() { setSlide(s => Math.max(s - 1, 0)); }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key >= "1" && e.key <= "9") {
        const i = parseInt(e.key, 10) - 1;
        if (i < total) setSlide(i);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total, onClose]);

  const current = slides[slide];

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-navy-700 via-navy-700 to-navy-600 flex flex-col"
      style={{ minHeight: "100vh" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-navy-700 font-bold">K</span>
          </div>
          <div>
            <div className="text-white font-bold">{data.klantNaam}</div>
            <div className="text-gold-400 text-xs">Financieel overzicht · {data.jaar}</div>
          </div>
        </div>

        <div className="text-white/40 text-xs hidden md:block">
          Gebruik <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">←</kbd>{" "}
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">→</kbd> om te navigeren ·
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] ml-1">Esc</kbd> om te sluiten
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-auto px-8 lg:px-16 py-8 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto">
          {current === "title" && <SlideTitle data={data} />}
          {current === "insights" && <SlideInsights data={data} />}
          {current === "kpi" && <SlideKpi data={data} />}
          {current === "omzetkosten" && <SlideOmzetKosten data={data} onMaandClick={onMaandClick} />}
          {current === "kosten" && <SlideKosten data={data} onCategorieClick={onCategorieClick} />}
          {current === "crediteuren" && <SlideCrediteuren data={data} />}
        </div>
      </div>

      {/* Bottom navigatie */}
      <div className="flex items-center justify-between px-8 py-5 border-t border-white/10">
        <button
          onClick={prev}
          disabled={slide === 0}
          className="flex items-center gap-2 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
          Vorige
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`transition-all ${
                i === slide ? "w-8 h-2 bg-gold-400" : "w-2 h-2 bg-white/30 hover:bg-white/50"
              } rounded-full`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <span className="ml-3 text-white/40 text-xs">{slide + 1} / {total}</span>
        </div>

        <button
          onClick={next}
          disabled={slide === total - 1}
          className="flex items-center gap-2 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Volgende
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── SLIDES ───────────────────────────────────────────────────────────────────

function SlideTitle({ data }: { data: PresentationData }) {
  return (
    <div className="text-center text-white space-y-8">
      <div className="inline-flex items-center gap-2 bg-gold-500/15 text-gold-400 text-sm font-semibold px-4 py-2 rounded-full border border-gold-500/20">
        <Sparkles size={14} />
        <span>Financieel overzicht {data.jaar}</span>
      </div>
      <h1 className="text-6xl lg:text-7xl font-bold leading-tight">{data.klantNaam}</h1>
      <p className="text-xl text-white/60 max-w-2xl mx-auto">
        Een real-time samenvatting van omzet, kosten, marge en crediteuren —
        opgehaald uit Exact Online.
      </p>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-12">
        <BigKpi label="Omzet" value={euro(data.totaalOmzet)} accent="gold" />
        <BigKpi label="Kosten" value={euro(data.totaalKosten)} accent="white" />
        <BigKpi
          label="Resultaat"
          value={euro(data.totaalMarge)}
          accent={data.totaalMarge >= 0 ? "emerald" : "red"}
        />
      </div>
    </div>
  );
}

function SlideInsights({ data }: { data: PresentationData }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gold-500/15 text-gold-400 text-sm font-semibold px-4 py-2 rounded-full border border-gold-500/20 mb-3">
          <Sparkles size={14} />
          AI Smart Insights
        </div>
        <h2 className="text-4xl font-bold text-white">3 acties voor deze week</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {data.insights.map((ins, i) => {
          const s = SEVERITY_BG[ins.severity] ?? SEVERITY_BG.info;
          const Icon = SEVERITY_ICON[ins.severity] ?? Info;
          return (
            <div key={i} className={`${s.bg} ${s.border} border-2 rounded-2xl p-6 space-y-3`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Icon size={22} className={s.iconColor} />
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${s.iconColor}`}>
                    Inzicht {i + 1}
                  </div>
                  <h3 className={`font-bold text-lg ${s.text} leading-tight mt-0.5`}>{ins.titel}</h3>
                </div>
              </div>
              {ins.cijfer && (
                <div className={`text-4xl font-bold ${s.iconColor}`}>{ins.cijfer}</div>
              )}
              <p className={`text-sm ${s.text} leading-relaxed`}>{ins.beschrijving}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideKpi({ data }: { data: PresentationData }) {
  const groei = data.vorigOmzet > 0 ? ((data.totaalOmzet - data.vorigOmzet) / data.vorigOmzet) * 100 : 0;
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-3">Kerncijfers {data.jaar}</h2>
        <p className="text-white/50">Vergelijking met vorig jaar</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <BigKpi
          label="Totaal omzet"
          value={euro(data.totaalOmzet)}
          sub={data.vorigOmzet ? `Vorig jaar: ${euro(data.vorigOmzet)}` : undefined}
          accent="gold"
        />
        <BigKpi
          label="Totaal kosten"
          value={euro(data.totaalKosten)}
          accent="white"
        />
        <BigKpi
          label="Resultaat"
          value={euro(data.totaalMarge)}
          accent={data.totaalMarge >= 0 ? "emerald" : "red"}
        />
        <BigKpi
          label="Marge"
          value={`${data.margePct.toFixed(1)}%`}
          sub={data.vorigOmzet ? `Omzetgroei: ${pct(groei)}` : undefined}
          accent={data.margePct >= 5 ? "emerald" : data.margePct >= 0 ? "gold" : "red"}
        />
      </div>
    </div>
  );
}

function SlideOmzetKosten({ data, onMaandClick }: { data: PresentationData; onMaandClick?: (periode: number) => void }) {
  const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
  function handleClick(rowData: { maand: string }) {
    if (!onMaandClick) return;
    const periode = MAANDEN.indexOf(rowData.maand) + 1;
    if (periode > 0) onMaandClick(periode);
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">Omzet vs Kosten per maand</h2>
        <p className="text-white/50">
          {data.jaar}
          {onMaandClick && <span className="ml-2 text-gold-400 text-xs">· Klik een maand voor details</span>}
        </p>
      </div>
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={data.maandData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 13, fill: "#475569" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 13, fill: "#475569" }} axisLine={false} tickLine={false}
              tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => euro(v as number)}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="omzet" name="Omzet" fill="#1B3A5C" radius={[6, 6, 0, 0]}
              style={onMaandClick ? { cursor: "pointer" } : undefined}
              onClick={onMaandClick ? handleClick : undefined} />
            <Bar dataKey="kosten" name="Kosten" fill="#C9A84C" radius={[6, 6, 0, 0]}
              style={onMaandClick ? { cursor: "pointer" } : undefined}
              onClick={onMaandClick ? handleClick : undefined} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SlideKosten({ data, onCategorieClick }: { data: PresentationData; onCategorieClick?: (naam: string, type: "omzet" | "kosten") => void }) {
  const top = data.topKosten.slice(0, 8);
  function handleBarClick(rowData: { name: string }) {
    if (onCategorieClick && rowData.name) onCategorieClick(rowData.name, "kosten");
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">Top kostenposten</h2>
        <p className="text-white/50">
          Waar gaat het geld heen?
          {onCategorieClick && <span className="ml-2 text-gold-400 text-xs">· Klik een kostenpost voor leverancier-uitsplitsing</span>}
        </p>
      </div>
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={top} layout="vertical" margin={{ left: 30, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 13, fill: "#475569" }}
              tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: "#1B3A5C", fontWeight: 600 }}
              axisLine={false} tickLine={false} width={200}
              tickFormatter={(s: string) => s.length > 24 ? s.slice(0, 24) + "…" : s} />
            <Tooltip formatter={(v) => euro(v as number)}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
            <Bar
              dataKey="value"
              fill="#C9A84C"
              radius={[0, 6, 6, 0]}
              style={onCategorieClick ? { cursor: "pointer" } : undefined}
              onClick={onCategorieClick ? handleBarClick : undefined}
            >
              {top.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#1B3A5C" : i < 3 ? "#C9A84C" : "#3B6EA5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Lijstweergave eronder ook klikbaar voor mobiel/leesbaarheid */}
        {onCategorieClick && (
          <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-gray-100">
            {top.map((k, i) => (
              <button
                key={k.name}
                onClick={() => onCategorieClick(k.name, "kosten")}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-gold-500/15 text-gold-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-navy-700 font-medium flex-1 truncate" title={k.name}>{k.name}</span>
                <span className="text-sm font-bold text-navy-700 flex-shrink-0">{euro(k.value)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlideCrediteuren({ data }: { data: PresentationData }) {
  const urgentPct = data.totaalCrediteuren > 0 ? (data.totaal90Plus / data.totaalCrediteuren) * 100 : 0;
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">Openstaande crediteuren</h2>
        <p className="text-white/50">Peildatum vandaag</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <BigKpi label="Totaal open" value={euro(data.totaalCrediteuren)} accent="gold" />
        <BigKpi label="Aantal crediteuren" value={String(data.topCrediteuren.length)} accent="white" />
        <BigKpi
          label="> 90 dagen urgent"
          value={euro(data.totaal90Plus)}
          sub={`${urgentPct.toFixed(0)}% van totaal`}
          accent={urgentPct > 20 ? "red" : "emerald"}
        />
      </div>
      {data.topCrediteuren.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-navy-700 mb-4">Top 5 crediteuren</h3>
          <div className="space-y-3">
            {data.topCrediteuren.slice(0, 5).map((c, i) => {
              const isUrgent = c.Age90Plus > 0;
              const max = data.topCrediteuren[0].totaal;
              return (
                <div key={c.Name} className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-navy-700">
                        {c.Name}
                        {isUrgent && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">URGENT</span>}
                      </span>
                      <span className="font-bold text-navy-700">{euro(c.totaal)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isUrgent ? "bg-red-500" : "bg-navy-700"}`}
                        style={{ width: `${(c.totaal / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function BigKpi({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "gold" | "white" | "emerald" | "red";
}) {
  const colorMap = {
    gold: "text-gold-400",
    white: "text-white",
    emerald: "text-emerald-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
      <p className={`text-3xl lg:text-4xl font-bold ${colorMap[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1.5">{sub}</p>}
    </div>
  );
}

// LineChart used for type compat (not drawn) — leave for future slides
void LineChart;
void Line;

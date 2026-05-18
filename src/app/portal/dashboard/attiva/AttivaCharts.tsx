"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Euro, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";
import PinnedChartsSection from "@/components/portal/PinnedChartsSection";
import DownloadPDFButton from "@/components/portal/DownloadPDFButton";
import Takenlijst from "./Takenlijst";
import ActivityFeed from "@/components/portal/ActivityFeed";
import DoelenVoortgang from "@/components/portal/DoelenVoortgang";
import ManagementSamenvatting from "@/components/portal/ManagementSamenvatting";
import AINarratief from "@/components/portal/AINarratief";
import ActiesMenu from "@/components/portal/ActiesMenu";
import RapportModal from "@/components/portal/RapportModal";
import ChatSidePanel from "@/components/portal/ChatSidePanel";
import { MessageSquare } from "lucide-react";
import PresentationMode from "@/components/portal/PresentationMode";
import ExportButton from "@/components/portal/ExportButton";
import { CacheBadge } from "@/components/portal/CacheBadge";
import { Presentation } from "lucide-react";
import { CLIENTS } from "@/lib/clients/config";
import WatVraagtAandacht from "./WatVraagtAandacht";

const ATTIVA_FEATURES = CLIENTS.attiva.features;

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface Debiteur { Name: string; Age0to30: number; Age31to60: number; Age61to90: number; Age90Plus: number }
interface KlantOmzet { naam: string; omzet: number }
interface ExactData {
  division: number; jaar: number;
  pl: PlRow[] | null;
  debiteuren: Debiteur[] | null;
  crediteuren: Debiteur[] | null;
  omzetPerKlant: KlantOmzet[] | null;
}

function euro(v: number | string | undefined) {
  return `€ ${Number(v ?? 0).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const PIE_COLORS = ["#1B3A5C","#C9A84C","#3B6EA5","#E8B84B","#264D73","#D4A843","#4A7FB5","#F0C75A","#0F2A45","#B8962E"];
const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);

function buildMaandData(pl: PlRow[]) {
  const perPeriode: Record<number, { omzet: number; kosten: number }> = {};
  pl.forEach(row => {
    const p = row.Period;
    if (p < 1 || p > 12) return;
    if (!perPeriode[p]) perPeriode[p] = { omzet: 0, kosten: 0 };
    if (row.IsRevenue) perPeriode[p].omzet += row.Amount;
    else perPeriode[p].kosten += row.Amount;
  });
  return Object.entries(perPeriode)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([p, v]) => ({
      maand: MAANDEN[Number(p) - 1] ?? `P${p}`,
      omzet: Math.round(v.omzet),
      kosten: Math.round(v.kosten),
      marge: Math.round(v.omzet - v.kosten),
    }));
}

function Trend({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous || previous === 0) return null;
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;
  if (isNeutral) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus size={10} /> {pct(diff)}
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isPositive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
    }`}>
      {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {pct(diff)}
    </span>
  );
}

function AgedBar({ d }: { d: Debiteur }) {
  const total = (d.Age0to30 ?? 0) + (d.Age31to60 ?? 0) + (d.Age61to90 ?? 0) + (d.Age90Plus ?? 0);
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-24 flex-shrink-0">
      {[
        { v: d.Age0to30, color: "bg-emerald-400" },
        { v: d.Age31to60, color: "bg-yellow-400" },
        { v: d.Age61to90, color: "bg-orange-400" },
        { v: d.Age90Plus, color: "bg-red-500" },
      ].map(({ v, color }, i) => v > 0 && (
        <div key={i} className={`${color}`} style={{ width: `${(v / total) * 100}%` }} />
      ))}
    </div>
  );
}

type NavigateFn = (tab: "financieel" | "cashflow" | "crediteuren" | "declaraties", sectionId?: string) => void;

export default function AttivaCharts({ onNavigate }: { onNavigate?: NavigateFn } = {}) {
  const [data, setData] = useState<ExactData | null>(null);
  const [vorigData, setVorigData] = useState<ExactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState<number>(HUIDIG_JAAR);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [maand, setMaand] = useState<string | null>(null);
  const [pinnedRefresh, setPinnedRefresh] = useState(0);
  const [autoFallback, setAutoFallback] = useState<number | null>(null);
  const [detailMaand, setDetailMaand] = useState<number | null>(null);
  const [detailCategorie, setDetailCategorie] = useState<{ naam: string; type: "omzet" | "kosten" } | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [insightsForPresentation, setInsightsForPresentation] = useState<Array<{ titel: string; beschrijving: string; severity: "alarm" | "attention" | "positive" | "info"; type: string; cijfer?: string }>>([]);
  const [cacheStatus, setCacheStatus] = useState<"HIT" | "MISS" | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);

  async function load(j: number, forceRefresh = false, isFallback = false) {
    setLoading(true);
    setError(null);
    if (!isFallback) setAutoFallback(null);
    try {
      const res = await fetch(`/api/exact/data?jaar=${j}&jaarVorig=${j - 1}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());

      // Cache-status uit headers
      const cacheHdr = res.headers.get("X-Cache");
      const cacheAgeHdr = res.headers.get("X-Cache-Age");
      setCacheStatus(cacheHdr === "HIT" || cacheHdr === "MISS" ? cacheHdr : null);
      setCacheAge(cacheAgeHdr ? parseInt(cacheAgeHdr, 10) : null);

      const json = await res.json();
      const huidig = json.huidig ?? json;
      const heeftData = huidig?.pl && huidig.pl.length > 0;

      // Auto-fallback: geen data voor dit jaar → probeer vorig jaar
      if (!heeftData && !isFallback && j > 2024) {
        setAutoFallback(j);
        setJaar(j - 1);
        return; // useEffect triggert load(j-1)
      }

      setData(huidig);
      setVorigData(json.vorig ?? null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(jaar); }, [jaar]);
  useEffect(() => { setMaand(null); }, [jaar]);

  const jaarSelector = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Jaar:</span>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {JAREN.map((j) => (
            <button key={j} onClick={() => setJaar(j)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
              }`}>
              {j}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Bijgewerkt om {lastUpdated.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button onClick={() => load(jaar, true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={12} /> Vernieuwen
        </button>
        <DownloadPDFButton
          targetId="attiva-financieel-export"
          filename={`Attiva-Zorg-Financieel-${jaar}`}
          clientName="Attiva Zorg"
          reportType="Financieel overzicht"
          jaar={jaar}
          label="PDF"
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-6">
      {jaarSelector}

      {/* Smart Insights skeleton */}
      <div className="card relative overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-gray-200" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-7 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => (
          <div key={i} className="card animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100" />
              <div className="h-5 w-14 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-7 w-32 bg-gray-100 rounded mb-1.5" />
            <div className="h-2.5 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="card animate-pulse">
        <div className="h-4 w-48 bg-gray-100 rounded mb-5" />
        <div className="flex items-end gap-2 h-56">
          {[35, 58, 42, 72, 50, 85, 64, 78, 55, 90, 70, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 justify-end items-center">
              <div className="w-full bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
              <div className="w-full bg-gray-100 rounded-t" style={{ height: `${h * 0.7}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
        <RefreshCw size={12} className="animate-spin" />
        <span>Live data ophalen uit Exact Online…</span>
      </div>
    </div>
  );

  if (error) {
    const isAuthError = error.toLowerCase().includes("koppel") || error.toLowerCase().includes("token") || error.toLowerCase().includes("401");
    return (
      <div className="space-y-6">
        {jaarSelector}
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-navy-700">
              {isAuthError ? "Exact Online verbinding verbroken" : "Fout bij ophalen data"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              {isAuthError
                ? "De koppeling met Exact Online is verlopen. Klik op de knop om opnieuw te verbinden — dit duurt maar 30 seconden."
                : error}
            </p>
          </div>
          {isAuthError ? (
            <a href="/api/exact/auth"
              className="bg-navy-700 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-navy-600 transition-colors">
              Koppel Exact Online opnieuw
            </a>
          ) : (
            <button onClick={() => load(jaar)} className="bg-navy-700 text-white px-6 py-2 rounded-xl text-sm hover:bg-navy-600 transition-colors">
              Opnieuw proberen
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maandData = buildMaandData(data.pl ?? []);
  const vorigMaandData = vorigData ? buildMaandData(vorigData.pl ?? []) : [];

  // Month filtering
  const selectedPeriod = maand ? MAANDEN.indexOf(maand) + 1 : null;
  const filteredMaandRow = maand ? maandData.find(m => m.maand === maand) : null;

  const totaalOmzet = Math.max(0, maandData.reduce((s, r) => s + r.omzet, 0));
  const totaalKosten = Math.max(0, maandData.reduce((s, r) => s + r.kosten, 0));
  const totaalMarge = totaalOmzet - totaalKosten;
  const margePercent = totaalOmzet > 0 ? (totaalMarge / totaalOmzet) * 100 : 0;

  const vorigOmzet = Math.max(0, vorigMaandData.reduce((s, r) => s + r.omzet, 0));
  const vorigKosten = Math.max(0, vorigMaandData.reduce((s, r) => s + r.kosten, 0));
  const vorigMarge = vorigOmzet - vorigKosten;

  // Display values (filtered to month or full year)
  const displayOmzet = filteredMaandRow ? filteredMaandRow.omzet : totaalOmzet;
  const displayKosten = filteredMaandRow ? filteredMaandRow.kosten : totaalKosten;
  const displayMarge = filteredMaandRow ? filteredMaandRow.marge : totaalMarge;
  const displayMargePercent = displayOmzet > 0 ? (displayMarge / displayOmzet) * 100 : 0;
  const displayVorigOmzet = maand ? (vorigMaandData.find(m => m.maand === maand)?.omzet ?? 0) : vorigOmzet;
  const displayVorigKosten = maand ? (vorigMaandData.find(m => m.maand === maand)?.kosten ?? 0) : vorigKosten;
  const displayVorigMarge = maand ? (vorigMaandData.find(m => m.maand === maand)?.marge ?? 0) : vorigMarge;

  // Prognose berekening (alleen bij heel jaar + onvolledig jaar)
  const aantalMaandenMetData = maandData.length;
  const restMaanden = 12 - aantalMaandenMetData;
  const toonPrognose = !maand && aantalMaandenMetData > 0 && aantalMaandenMetData < 12;

  const gemOmzetPerMaand = aantalMaandenMetData > 0 ? totaalOmzet / aantalMaandenMetData : 0;
  const gemKostenPerMaand = aantalMaandenMetData > 0 ? totaalKosten / aantalMaandenMetData : 0;
  const gemMargePerMaand = gemOmzetPerMaand - gemKostenPerMaand;

  const verwachteJaarOmzet = Math.round(gemOmzetPerMaand * 12);
  const verwachteJaarKosten = Math.round(gemKostenPerMaand * 12);
  const verwachteJaarResultaat = verwachteJaarOmzet - verwachteJaarKosten;

  // Gecombineerde data voor lijndiagram: actief + prognose (stippellijn)
  const prognoseLijnData = [
    ...maandData.map(m => ({ maand: m.maand, marge: m.marge, prognose: undefined as number | undefined })),
    // Overlap op laatste actuele maand voor continuïteit
    ...(toonPrognose && maandData.length > 0 ? [
      { maand: maandData[maandData.length - 1].maand, marge: undefined as number | undefined, prognose: maandData[maandData.length - 1].marge },
      ...MAANDEN.slice(aantalMaandenMetData).map(m => ({ maand: m, marge: undefined as number | undefined, prognose: Math.round(gemMargePerMaand) })),
    ] : []),
  ];

  const vergelijkData = MAANDEN.map((m) => ({
    maand: m,
    [`omzet${jaar}`]: maandData.find(r => r.maand === m)?.omzet ?? 0,
    [`omzet${jaar - 1}`]: vorigMaandData.find(r => r.maand === m)?.omzet ?? 0,
  })).filter(r => (r[`omzet${jaar}`] as number) > 0 || (r[`omzet${jaar - 1}`] as number) > 0);

  const kostenPerCategorie = Object.entries(
    (data.pl ?? [])
      .filter(r => !r.IsRevenue && (selectedPeriod === null || r.Period === selectedPeriod))
      .reduce((acc, r) => { acc[r.Description] = (acc[r.Description] ?? 0) + r.Amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

  const topDebiteuren = (data.debiteuren ?? [])
    .map(d => ({ ...d, totaal: (d.Age0to30??0)+(d.Age31to60??0)+(d.Age61to90??0)+(d.Age90Plus??0) }))
    .filter(d => d.totaal > 0).sort((a, b) => b.totaal - a.totaal).slice(0, 5);

  // Omzet per categorie (uit P&L revenue-rijen, gegroepeerd op grootboekomschrijving)
  const omzetPerCategorie = Object.entries(
    (data.pl ?? [])
      .filter(r => r.IsRevenue && (selectedPeriod === null || r.Period === selectedPeriod))
      .reduce((acc, r) => { acc[r.Description] = (acc[r.Description] ?? 0) + r.Amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

  const topCrediteuren = (data.crediteuren ?? [])
    .map(d => ({ ...d, totaal: (d.Age0to30??0)+(d.Age31to60??0)+(d.Age61to90??0)+(d.Age90Plus??0) }))
    .filter(d => d.totaal > 0).sort((a, b) => b.totaal - a.totaal).slice(0, 5);

  const klantOmzetHuidig = data.omzetPerKlant ?? [];
  const klantOmzetVorig = vorigData?.omzetPerKlant ?? [];

  const alleKlantNamen = Array.from(new Set([
    ...klantOmzetHuidig.map(k => k.naam),
    ...klantOmzetVorig.map(k => k.naam),
  ]));
  const verdwenenClienten = klantOmzetVorig.filter(k => !klantOmzetHuidig.find(h => h.naam === k.naam)).map(k => k.naam);
  const nieuweClienten = klantOmzetHuidig.filter(k => !klantOmzetVorig.find(v => v.naam === k.naam)).map(k => k.naam);

  const chatContext = [
    `Financiële data Attiva Zorg — jaar ${data.jaar} (bron: Exact Online, real-time):`,
    `- Totale omzet: ${euro(totaalOmzet)} (vorig jaar: ${euro(vorigOmzet)})`,
    `- Totale kosten: ${euro(totaalKosten)} (vorig jaar: ${euro(vorigKosten)})`,
    `- Nettoresultaat: ${euro(totaalMarge)} (${margePercent.toFixed(1)}% marge)`,
    ``,`Top kostenposten:`,
    ...kostenPerCategorie.map(k => `- ${k.name}: ${euro(k.value)} (${((k.value/totaalKosten)*100).toFixed(0)}%)`),
    ``,`Omzet per maand ${jaar}:`,
    ...maandData.map(m => `- ${m.maand}: omzet ${euro(m.omzet)}, kosten ${euro(m.kosten)}, resultaat ${euro(m.marge)}`),
    ...(vorigMaandData.length > 0 ? [``,`Vorig jaar (${jaar-1}) per maand:`, ...vorigMaandData.map(m => `- ${m.maand}: omzet ${euro(m.omzet)}, kosten ${euro(m.kosten)}`)] : []),
    ...(klantOmzetHuidig.length > 0 ? [
      ``,`Gefactureerde omzet per klant in ${jaar} (bron: verkoopfacturen Exact Online):`,
      ...klantOmzetHuidig.map(k => `- ${k.naam}: ${euro(k.omzet)}`),
    ] : []),
    ...(klantOmzetVorig.length > 0 ? [
      ``,`Gefactureerde omzet per klant in ${jaar-1} (vorig jaar):`,
      ...klantOmzetVorig.map(k => `- ${k.naam}: ${euro(k.omzet)}`),
    ] : []),
    ...(alleKlantNamen.length > 0 ? [
      ``,`Vergelijking per klant (${jaar-1} → ${jaar}):`,
      ...alleKlantNamen.map(naam => {
        const huidig = klantOmzetHuidig.find(k => k.naam === naam)?.omzet ?? 0;
        const vorig = klantOmzetVorig.find(k => k.naam === naam)?.omzet ?? 0;
        const diff = huidig - vorig;
        const label = diff > 0 ? `+${euro(diff)}` : diff < 0 ? euro(diff) : "geen wijziging";
        return `- ${naam}: ${euro(vorig)} → ${euro(huidig)} (${label})`;
      }),
    ] : []),
    ...(verdwenenClienten.length > 0 ? [
      ``,`Klanten die in ${jaar-1} factureerden maar NIET meer in ${jaar}: ${verdwenenClienten.join(", ")}`,
    ] : []),
    ...(nieuweClienten.length > 0 ? [
      `Nieuwe klanten in ${jaar} (kwamen niet voor in ${jaar-1}): ${nieuweClienten.join(", ")}`,
    ] : []),
    ...(toonPrognose ? [
      ``,
      `Prognose ${jaar} (op basis van ${aantalMaandenMetData} maanden, gemiddelde doorgetrokken):`,
      `- Verwachte jaaromzet: ${euro(verwachteJaarOmzet)} (nu ${euro(totaalOmzet)}, ${Math.round((totaalOmzet/verwachteJaarOmzet)*100)}% van prognose)`,
      `- Verwachte jaarkosten: ${euro(verwachteJaarKosten)} (nu ${euro(totaalKosten)})`,
      `- Verwacht jaarresultaat: ${euro(verwachteJaarResultaat)} (nu ${euro(totaalMarge)})`,
      `- Nog ${restMaanden} maanden te gaan`,
    ] : []),
  ].join("\n");

  return (
    <div className="space-y-6">
      {/* "Wat vraagt aandacht?" — gebruikt dezelfde pl/crediteuren als de
          KPI-tegels eronder. Garandeert één waarheid. */}
      <WatVraagtAandacht pl={data.pl ?? []} crediteuren={data.crediteuren ?? []} />

      {/* Gecombineerde filterbalk */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Jaar pills */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {JAREN.map((j) => (
              <button key={j} onClick={() => setJaar(j)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                }`}>
                {j}
              </button>
            ))}
          </div>
          {/* Scheidslijn */}
          {maandData.length > 0 && <div className="h-5 w-px bg-gray-200" />}
          {/* Maand pills */}
          {maandData.length > 0 && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              <button onClick={() => setMaand(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  maand === null ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                }`}>
                Heel jaar
              </button>
              {maandData.map((m) => (
                <button key={m.maand} onClick={() => setMaand(m.maand)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    maand === m.maand ? "bg-gold-500 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
                  }`}>
                  {m.maand}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Rechts: timestamp + knoppen */}
        <div className="flex items-center gap-3">
          <CacheBadge cacheStatus={cacheStatus} ageSeconds={cacheAge} />
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              Bijgewerkt {lastUpdated.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {/* Vraag je data — opent zij-paneel met AI chat */}
          {ATTIVA_FEATURES.aiChat && (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-navy-700 hover:bg-navy-600 text-white font-semibold rounded-lg px-3 py-1.5 transition-colors shadow-sm"
            >
              <MessageSquare size={12} />
              Vraag je data
            </button>
          )}
          <ActiesMenu
            onRefresh={() => load(jaar, true)}
            onPresentatie={() => setShowPresentation(true)}
            onRapport={ATTIVA_FEATURES.pdfExport ? () => setRapportOpen(true) : undefined}
            pdfExport={ATTIVA_FEATURES.pdfExport}
            presentatieDisabled={maandData.length === 0}
          />
        </div>
      </div>

      {autoFallback && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
          <span>Geen data gevonden voor <strong>{autoFallback}</strong> — data van <strong>{jaar}</strong> wordt weergegeven.</span>
          <button onClick={() => { setAutoFallback(null); setJaar(autoFallback); }} className="ml-auto text-xs underline hover:no-underline">
            Toch {autoFallback} proberen
          </button>
        </div>
      )}

      <div id="attiva-financieel-export" className="space-y-6 bg-white">
      {/* 1. Management samenvatting — HOOFDSECTIE: harde cijfers met YoY */}
      {maandData.length > 0 && (
        <ManagementSamenvatting
          jaar={data.jaar}
          pl={data.pl ?? []}
          vorigPl={vorigData?.pl ?? []}
        />
      )}

      {/* 2. AI conclusie — kleine kaart "wat betekent dit?" */}
      {maandData.length > 0 && <AINarratief jaar={data.jaar} />}

      {/* Doelen voortgang — TIJDELIJK UITGESCHAKELD (debug)
      {maandData.length > 0 && (
        <DoelenVoortgang
          jaar={data.jaar}
          totaalOmzet={totaalOmzet}
          totaalKosten={totaalKosten}
          margePercent={margePercent}
        />
      )}
      */}

      {/* 3. Takenlijst — vervangt de AI-Actiepunten met echte afvinkbare taken */}
      {maandData.length > 0 && <Takenlijst />}

      {/* KPI Cards — alleen tonen bij maand-filter (anders dubbel met Management Samenvatting) */}
      {maand && (
        <div className="grid grid-cols-3 gap-5">
          {/* Omzet */}
          <div className="card border-t-4 border-t-navy-700">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
                <Euro size={16} className="text-navy-700" />
              </div>
              <Trend current={displayOmzet} previous={displayVorigOmzet} />
            </div>
            <p className="text-sm text-gray-400 mb-1">Omzet {maand}</p>
            <p className="text-2xl font-bold text-navy-700">{euro(displayOmzet)}</p>
            {displayVorigOmzet > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(displayVorigOmzet)}</p>}
          </div>

          {/* Kosten */}
          <div className="card border-t-4 border-t-gold-500">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
                <Euro size={16} className="text-gold-500" />
              </div>
              <Trend current={displayKosten} previous={displayVorigKosten} inverse />
            </div>
            <p className="text-sm text-gray-400 mb-1">Kosten {maand}</p>
            <p className="text-2xl font-bold text-navy-700">{euro(displayKosten)}</p>
            {displayVorigKosten > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(displayVorigKosten)}</p>}
          </div>

          {/* Resultaat */}
          <div className={`card border-t-4 ${displayMarge >= 0 ? "border-t-emerald-500" : "border-t-red-500"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${displayMarge >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                {displayMarge >= 0
                  ? <TrendingUp size={16} className="text-emerald-600" />
                  : <TrendingDown size={16} className="text-red-500" />}
              </div>
              <Trend current={displayMarge} previous={displayVorigMarge} />
            </div>
            <p className="text-sm text-gray-400 mb-1">Resultaat {maand}</p>
            <p className={`text-2xl font-bold ${displayMarge >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {euro(displayMarge)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {displayMargePercent.toFixed(1)}% marge
              {displayVorigMarge !== 0 && ` · vorig jaar: ${euro(displayVorigMarge)}`}
            </p>
          </div>
        </div>
      )}

      {/* Prognose kaart */}
      {toonPrognose && (
        <div className="card border border-dashed border-navy-700/25 bg-navy-700/[0.02]">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-navy-700">Prognose {jaar}</h3>
                <span className="text-[10px] bg-navy-700/10 text-navy-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                  Schatting
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Op basis van {aantalMaandenMetData} maanden · gemiddelde doorgetrokken naar jaareinde
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
              {restMaanden} maanden te gaan
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Verwachte jaaromzet</p>
              <p className="text-xl font-bold text-navy-700">{euro(verwachteJaarOmzet)}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Nu: {euro(totaalOmzet)}</span>
                  <span>{Math.round((totaalOmzet / verwachteJaarOmzet) * 100)}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-700 rounded-full" style={{ width: `${Math.min((totaalOmzet / verwachteJaarOmzet) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Verwachte jaarkosten</p>
              <p className="text-xl font-bold text-navy-700">{euro(verwachteJaarKosten)}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Nu: {euro(totaalKosten)}</span>
                  <span>{Math.round((totaalKosten / verwachteJaarKosten) * 100)}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-500 rounded-full" style={{ width: `${Math.min((totaalKosten / verwachteJaarKosten) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${verwachteJaarResultaat >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
              <p className="text-xs text-gray-400 mb-1">Verwacht jaarresultaat</p>
              <p className={`text-xl font-bold ${verwachteJaarResultaat >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {euro(verwachteJaarResultaat)}
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Nu: {euro(totaalMarge)}</span>
                  <span>{verwachteJaarResultaat !== 0 ? `${Math.round((totaalMarge / verwachteJaarResultaat) * 100)}%` : "—"}</span>
                </div>
                <div className="h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${verwachteJaarResultaat >= 0 ? "bg-emerald-500" : "bg-red-400"}`}
                    style={{ width: `${verwachteJaarResultaat !== 0 ? Math.min(Math.abs((totaalMarge / verwachteJaarResultaat) * 100), 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Jaarvoortgang */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Jaarvoortgang</span>
            <span>{aantalMaandenMetData} van 12 maanden ({Math.round((aantalMaandenMetData / 12) * 100)}%)</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-navy-700 rounded-full transition-all" style={{ width: `${(aantalMaandenMetData / 12) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Omzet vs Kosten */}
      {maandData.length > 0 && (
        <div className="card" id="sectie-omzet-kosten">
          <h3 className="font-bold text-navy-700 mb-5">Omzet vs Kosten per maand — {data.jaar}</h3>
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gold-500/60" />
            Klik op een maand voor kostenuitsplitsing
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={maandData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar
                dataKey="omzet"
                name="Omzet"
                radius={[5,5,0,0]}
                style={{ cursor: "pointer" }}
                onClick={(data) => {
                  const maandLabel = (data as { maand?: string }).maand;
                  if (!maandLabel) return;
                  const periodeNr = MAANDEN.indexOf(maandLabel) + 1;
                  if (periodeNr > 0) setDetailMaand(periodeNr);
                }}
              >
                {maandData.map((entry, i) => (
                  <Cell key={i} fill={maand === null || maand === entry.maand ? "#1B3A5C" : "#cbd5e1"} />
                ))}
              </Bar>
              <Bar
                dataKey="kosten"
                name="Kosten"
                radius={[5,5,0,0]}
                style={{ cursor: "pointer" }}
                onClick={(data) => {
                  const maandLabel = (data as { maand?: string }).maand;
                  if (!maandLabel) return;
                  const periodeNr = MAANDEN.indexOf(maandLabel) + 1;
                  if (periodeNr > 0) setDetailMaand(periodeNr);
                }}
              >
                {maandData.map((entry, i) => (
                  <Cell key={i} fill={maand === null || maand === entry.maand ? "#C9A84C" : "#e9ecef"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nettoresultaat trend */}
      {maandData.length > 0 && (
        <div className="card" id="sectie-marge">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-navy-700">Nettoresultaat per maand — {data.jaar}</h3>
            {toonPrognose && !maand && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-navy-700 align-middle" />Werkelijk</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t-2 border-dashed border-gray-400 align-middle" />Prognose</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={(toonPrognose && !maand ? prognoseLijnData : maandData) as unknown as Record<string, unknown>[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
              <Line type="monotone" dataKey="marge" name="Resultaat" stroke="#1B3A5C" strokeWidth={2.5}
                connectNulls={false}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.marge === undefined || payload.marge === null) return <g key={cx} />;
                  const isSelected = maand === null || maand === payload.maand;
                  const fill = !isSelected ? "#cbd5e1" : payload.marge >= 0 ? "#10b981" : "#ef4444";
                  return <circle key={cx} cx={cx} cy={cy} r={maand === payload.maand ? 6 : 4} fill={fill} stroke="white" strokeWidth={2} />;
                }}
              />
              {toonPrognose && !maand && (
                <Line type="monotone" dataKey="prognose" name="Prognose" stroke="#94a3b8"
                  strokeWidth={2} strokeDasharray="6 4" connectNulls={false}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.prognose === undefined || payload.prognose === null) return <g key={cx} />;
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill="#94a3b8" stroke="white" strokeWidth={2} />;
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Jaar vergelijking */}
      {vergelijkData.length > 0 && vorigMaandData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-navy-700">Omzetvergelijking — {jaar - 1} vs {jaar}</h3>
            {vorigOmzet > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Trend current={totaalOmzet} previous={vorigOmzet} />
                <span className="text-xs text-gray-400">t.o.v. vorig jaar</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vergelijkData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey={`omzet${jaar - 1}`} name={`${jaar - 1}`} radius={[5,5,0,0]}>
                {vergelijkData.map((entry, i) => (
                  <Cell key={i} fill={maand === null || maand === entry.maand ? "#cbd5e1" : "#e9ecef"} />
                ))}
              </Bar>
              <Bar dataKey={`omzet${jaar}`} name={`${jaar}`} radius={[5,5,0,0]}>
                {vergelijkData.map((entry, i) => (
                  <Cell key={i} fill={maand === null || maand === entry.maand ? "#1B3A5C" : "#d1d5db"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kostenuitsplitsing */}
      {kostenPerCategorie.length > 0 && (
        <div className="grid grid-cols-2 gap-5" id="sectie-kosten">
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-4">
              Kostenuitsplitsing {maand ? `${maand} ${data.jaar}` : data.jaar}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={kostenPerCategorie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3}>
                  {kostenPerCategorie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-2">Top kostenposten</h3>
            <p className="text-xs text-gray-400 mb-3">Klik op een kostenpost voor uitsplitsing per leverancier</p>
            <div className="space-y-3">
              {kostenPerCategorie.map((k, i) => (
                <button
                  key={k.name}
                  onClick={() => setDetailCategorie({ naam: k.name, type: "kosten" })}
                  className="w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-gray-600 flex-1 truncate" title={k.name}>{k.name}</span>
                    <span className="text-sm font-semibold text-navy-700 flex-shrink-0">{euro(k.value)}</span>
                  </div>
                  <div className="ml-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(k.value / kostenPerCategorie[0].value) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Debiteuren (of Omzet per categorie als debiteuren leeg) & Crediteuren */}
      {(topDebiteuren.length > 0 || topCrediteuren.length > 0 || omzetPerCategorie.length > 0) && (
        <div className="grid grid-cols-2 gap-5" id="sectie-omzet-categorie">
          {topDebiteuren.length === 0 && omzetPerCategorie.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-700">
                  {maand ? `Omzet per categorie — ${maand}` : "Omzet per categorie"}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {euro(omzetPerCategorie.reduce((s, c) => s + c.value, 0))} totaal
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Klik op een categorie voor maandelijkse uitsplitsing</p>
              <div className="space-y-3">
                {omzetPerCategorie.map((c, i) => {
                  const max = omzetPerCategorie[0].value;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setDetailCategorie({ naam: c.name, type: "omzet" })}
                      className="w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-navy-700 font-medium flex-1 truncate" title={c.name}>{c.name}</span>
                        <span className="font-bold text-navy-700 text-sm flex-shrink-0">{euro(c.value)}</span>
                      </div>
                      <div className="ml-7 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-navy-700 rounded-full transition-all" style={{ width: `${(c.value / max) * 100}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {topDebiteuren.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-700">Openstaande debiteuren</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {euro(topDebiteuren.reduce((s, d) => s + d.totaal, 0))} totaal
                </span>
              </div>
              <div className="flex gap-2 mb-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"/>0–30d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"/>31–60d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full inline-block"/>61–90d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"/>&gt;90d</span>
              </div>
              <div className="space-y-3">
                {topDebiteuren.map((d, i) => (
                  <div key={d.Name} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-navy-700 font-medium flex-1 truncate" title={d.Name}>{d.Name}</span>
                    <AgedBar d={d} />
                    <span className="font-bold text-red-500 text-sm flex-shrink-0 w-20 text-right">{euro(d.totaal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topCrediteuren.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-700">Openstaande crediteuren</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {euro(topCrediteuren.reduce((s, d) => s + d.totaal, 0))} totaal
                </span>
              </div>
              <div className="flex gap-2 mb-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"/>0–30d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"/>31–60d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full inline-block"/>61–90d</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"/>&gt;90d</span>
              </div>
              <div className="space-y-3">
                {topCrediteuren.map((d, i) => (
                  <div key={d.Name} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-navy-700 font-medium flex-1 truncate" title={d.Name}>{d.Name}</span>
                    <AgedBar d={d} />
                    <span className="font-bold text-orange-500 text-sm flex-shrink-0 w-20 text-right">{euro(d.totaal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {maandData.length === 0 && kostenPerCategorie.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <p>Geen financiële data gevonden voor {data.jaar} in Exact Online.</p>
          <p className="text-sm text-gray-400 mt-2">Selecteer een ander jaar of controleer de Exact Online koppeling.</p>
        </div>
      )}

      </div>

      {/* Activity Feed — lager op de pagina, niet de top-aandacht trekken */}
      {maandData.length > 0 && (
        <ActivityFeed
          maandData={maandData}
          vorigMaandData={vorigMaandData}
          kostenPerCategorie={kostenPerCategorie}
          omzetPerCategorie={omzetPerCategorie}
          topCrediteuren={topCrediteuren}
          jaar={data.jaar}
        />
      )}

      {/* Pinned charts blijven onderaan zichtbaar (resultaat van chat) */}
      {maandData.length > 0 && (
        <PinnedChartsSection tab="financieel" refresh={pinnedRefresh} />
      )}

      {/* Chat zit nu in het zij-paneel — altijd gemount zodat history bewaard blijft */}
      {ATTIVA_FEATURES.aiChat && maandData.length > 0 && (
        <ChatSidePanel open={chatOpen} onClose={() => setChatOpen(false)}>
          <DashboardChat
            context={chatContext}
            tab="financieel"
            onChartPinned={() => setPinnedRefresh(r => r + 1)}
          />
        </ChatSidePanel>
      )}

      {/* Rapport-modal */}
      {ATTIVA_FEATURES.pdfExport && (
        <RapportModal
          open={rapportOpen}
          onClose={() => setRapportOpen(false)}
          targetId="attiva-financieel-export"
          clientName="Attiva Zorg"
          clientSlug="attiva"
          jaarDefault={jaar}
        />
      )}

      {/* Presentation mode */}
      {showPresentation && (
        <PresentationMode
          data={{
            klantNaam: "Attiva Zorg",
            jaar: data.jaar,
            totaalOmzet,
            totaalKosten,
            totaalMarge,
            margePct: margePercent,
            vorigOmzet,
            maandData,
            topKosten: kostenPerCategorie,
            topOmzet: omzetPerCategorie,
            insights: insightsForPresentation,
            topCrediteuren: topCrediteuren.map(c => ({ Name: c.Name, totaal: c.totaal, Age90Plus: c.Age90Plus ?? 0 })),
            totaalCrediteuren: topCrediteuren.reduce((s, c) => s + c.totaal, 0),
            totaal90Plus: topCrediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0),
          }}
          onClose={() => setShowPresentation(false)}
          onCategorieClick={(naam, type) => setDetailCategorie({ naam, type })}
          onMaandClick={(periode) => setDetailMaand(periode)}
          onNavigate={onNavigate}
        />
      )}

      {/* Maand detail modal */}
      {detailMaand !== null && data.pl && (
        <MaandDetailModal
          periode={detailMaand}
          jaar={data.jaar}
          pl={data.pl}
          onClose={() => setDetailMaand(null)}
        />
      )}

      {/* Categorie detail modal (omzet of kosten) */}
      {detailCategorie && data.pl && (
        <CategorieDetailModal
          categorie={detailCategorie.naam}
          type={detailCategorie.type}
          jaar={data.jaar}
          pl={data.pl}
          onClose={() => setDetailCategorie(null)}
        />
      )}
    </div>
  );
}

// ─── Maand detail modal ───────────────────────────────────────────────────────
function MaandDetailModal({
  periode, jaar, pl, onClose,
}: {
  periode: number;
  jaar: number;
  pl: PlRow[];
  onClose: () => void;
}) {
  const maandNaam = MAANDEN[periode - 1] ?? `Periode ${periode}`;

  const omzetRijen = pl
    .filter(r => r.Period === periode && r.IsRevenue)
    .sort((a, b) => b.Amount - a.Amount);

  const kostenRijen = pl
    .filter(r => r.Period === periode && !r.IsRevenue)
    .sort((a, b) => b.Amount - a.Amount);

  const totaalOmzet = omzetRijen.reduce((s, r) => s + r.Amount, 0);
  const totaalKosten = kostenRijen.reduce((s, r) => s + r.Amount, 0);
  const netto = totaalOmzet - totaalKosten;

  function euro(v: number) {
    return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-navy-700 text-lg">{maandNaam} {jaar}</h2>
            <p className="text-xs text-gray-400 mt-0.5">W&V uitsplitsing per grootboekrekening</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              filename={`Attiva-WV-${maandNaam}-${jaar}`}
              sheetName={`${maandNaam} ${jaar}`}
              rows={[
                ...omzetRijen.map(r => ({
                  Type: "Omzet",
                  Grootboekrekening: r.Description,
                  Bedrag: r.Amount,
                  Periode: maandNaam,
                  Jaar: jaar,
                })),
                ...kostenRijen.map(r => ({
                  Type: "Kosten",
                  Grootboekrekening: r.Description,
                  Bedrag: r.Amount,
                  Periode: maandNaam,
                  Jaar: jaar,
                })),
              ]}
            />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-50">
          {[
            { label: "Omzet",       value: totaalOmzet, color: "text-navy-700" },
            { label: "Kosten",      value: totaalKosten, color: "text-gold-600" },
            { label: "Resultaat",   value: netto,        color: netto >= 0 ? "text-emerald-600" : "text-red-500" },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">{k.label}</p>
              <p className={`text-base font-bold ${k.color}`}>{euro(k.value)}</p>
            </div>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Kostenposten */}
          {kostenRijen.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Kostenposten — {euro(totaalKosten)}
              </p>
              <div className="space-y-2">
                {kostenRijen.map((r, i) => {
                  const pct = totaalKosten > 0 ? (r.Amount / totaalKosten) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-700 font-medium truncate pr-2">{r.Description}</span>
                          <span className="text-xs font-bold text-navy-700 flex-shrink-0">{euro(r.Amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Omzetposten */}
          {omzetRijen.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Omzetposten — {euro(totaalOmzet)}
              </p>
              <div className="space-y-2">
                {omzetRijen.map((r, i) => {
                  const pct = totaalOmzet > 0 ? (r.Amount / totaalOmzet) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-700 font-medium truncate pr-2">{r.Description}</span>
                          <span className="text-xs font-bold text-navy-700 flex-shrink-0">{euro(r.Amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-navy-700 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {kostenRijen.length === 0 && omzetRijen.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Geen detaildata beschikbaar voor deze maand.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Categorie detail modal (werkt voor zowel omzet als kosten) ──────────────
interface TegenpartijRij { naam: string; totaal: number; perMaand: number[] }
interface TransactiesPerTegenpartijResp {
  jaar: number; categorie: string; totaal: number; aantalKlanten: number;
  klanten: TegenpartijRij[];
}

function CategorieDetailModal({
  categorie, type, jaar, pl, onClose,
}: {
  categorie: string;
  type: "omzet" | "kosten";
  jaar: number;
  pl: PlRow[];
  onClose: () => void;
}) {
  const [klantData, setKlantData] = useState<TransactiesPerTegenpartijResp | null>(null);
  const [klantLoading, setKlantLoading] = useState(true);
  const [klantError, setKlantError] = useState<string | null>(null);
  const [openKlant, setOpenKlant] = useState<string | null>(null);

  // Type-afhankelijke labels & kleuren
  const isKosten = type === "kosten";
  const tegenpartijLabel = isKosten ? "leverancier" : "klant";
  const tegenpartijLabelMv = isKosten ? "leveranciers" : "klanten";
  const accentClass = isKosten ? "bg-gold-500" : "bg-navy-700";
  const accentTextClass = isKosten ? "text-gold-600" : "text-navy-700";
  const subtitleSuffix = isKosten ? "kostenuitsplitsing" : "omzetuitsplitsing";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setKlantLoading(true);
      setKlantError(null);
      try {
        const res = await fetch(
          `/api/exact/omzet-per-klant?jaar=${jaar}&categorie=${encodeURIComponent(categorie)}&type=${type}`
        );
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!cancelled) setKlantData(json);
      } catch (e) {
        if (!cancelled) setKlantError(e instanceof Error ? e.message : "Onbekende fout");
      } finally {
        if (!cancelled) setKlantLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [categorie, jaar, type]);

  // Filter alle rijen die bij deze categorie horen — IsRevenue moet matchen met type
  const isRevenueFilter = type === "omzet";
  const rijen = pl.filter(r => r.IsRevenue === isRevenueFilter && r.Description === categorie);
  const totaal = rijen.reduce((s, r) => s + r.Amount, 0);

  // Per maand
  const perMaand = MAANDEN.map((m, i) => {
    const periode = i + 1;
    const bedrag = rijen.filter(r => r.Period === periode).reduce((s, r) => s + r.Amount, 0);
    return { maand: m, bedrag: Math.round(bedrag) };
  });

  const maxBedrag = Math.max(...perMaand.map(p => p.bedrag), 1);
  const maandenMetData = perMaand.filter(p => p.bedrag !== 0);
  const gemPerMaand = maandenMetData.length > 0 ? totaal / maandenMetData.length : 0;
  const beste = maandenMetData.reduce((best, p) => p.bedrag > best.bedrag ? p : best, { maand: "—", bedrag: 0 });
  const slechtste = maandenMetData.length > 0
    ? maandenMetData.reduce((min, p) => p.bedrag < min.bedrag ? p : min, maandenMetData[0])
    : { maand: "—", bedrag: 0 };

  function euroL(v: number) {
    return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0 pr-3">
            <h2 className="font-bold text-navy-700 text-lg truncate">{categorie}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Maandelijkse {subtitleSuffix} — {jaar}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExportButton
              filename={`Attiva-${type}-${categorie.replace(/[^a-zA-Z0-9-]/g, "_")}-${jaar}`}
              sheetName={categorie.slice(0, 28)}
              disabled={!klantData || klantData.klanten.length === 0}
              rows={
                klantData
                  ? klantData.klanten.flatMap(k => [
                      {
                        [tegenpartijLabel === "leverancier" ? "Leverancier" : "Klant"]: k.naam,
                        Categorie: categorie,
                        Periode: "Totaal",
                        Bedrag: k.totaal,
                        Jaar: jaar,
                      },
                      ...k.perMaand.map((bedrag, mi) => ({
                        [tegenpartijLabel === "leverancier" ? "Leverancier" : "Klant"]: k.naam,
                        Categorie: categorie,
                        Periode: MAANDEN[mi],
                        Bedrag: bedrag,
                        Jaar: jaar,
                      })).filter(r => r.Bedrag !== 0),
                    ])
                  : []
              }
            />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-50">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Totaal {jaar}</p>
            <p className="text-base font-bold text-navy-700">{euroL(totaal)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">
              {isKosten ? "Hoogste maand" : "Beste maand"}
            </p>
            <p className={`text-base font-bold ${isKosten ? "text-red-500" : "text-emerald-600"}`}>{beste.maand}</p>
            <p className="text-[10px] text-gray-400">{euroL(beste.bedrag)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Gemiddelde</p>
            <p className="text-base font-bold text-navy-700">{euroL(gemPerMaand)}</p>
            <p className="text-[10px] text-gray-400">per maand met data</p>
          </div>
        </div>

        {/* Per maand bars */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Per maand</p>
          <div className="space-y-2.5">
            {perMaand.map(p => {
              const pct = maxBedrag > 0 ? (Math.abs(p.bedrag) / maxBedrag) * 100 : 0;
              const isLeeg = p.bedrag === 0;
              const isBeste = p.maand === beste.maand && p.bedrag > 0;
              return (
                <div key={p.maand} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium w-8 flex-shrink-0">{p.maand}</span>
                  <div className="flex-1 h-6 bg-gray-50 rounded-md relative overflow-hidden">
                    <div
                      className={`h-full rounded-md transition-all ${
                        isBeste ? (isKosten ? "bg-red-500" : "bg-emerald-500") : accentClass
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-24 text-right flex-shrink-0 ${isLeeg ? "text-gray-300" : "text-navy-700"}`}>
                    {isLeeg ? "—" : euroL(p.bedrag)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Per leverancier/klant — uit bankboekingen / TransactionLines */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Per {tegenpartijLabel}</p>
              {klantData && (
                <span className="text-[10px] text-gray-400">
                  {klantData.aantalKlanten} {tegenpartijLabelMv} · {euroL(klantData.totaal)} totaal
                </span>
              )}
            </div>

            {klantLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
                <RefreshCw size={14} className="animate-spin" />
                {tegenpartijLabelMv.charAt(0).toUpperCase() + tegenpartijLabelMv.slice(1)} ophalen uit Exact...
              </div>
            )}

            {klantError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                Kon {tegenpartijLabelMv} niet laden: {klantError}
              </div>
            )}

            {!klantLoading && !klantError && klantData && klantData.klanten.length === 0 && (
              <div className="bg-gray-50 rounded-xl px-4 py-6 text-sm text-gray-400 text-center">
                Geen {tegenpartijLabelMv} gevonden voor deze categorie.
              </div>
            )}

            {!klantLoading && !klantError && klantData && klantData.klanten.length > 0 && (
              <div className="space-y-1.5">
                {klantData.klanten.map((k, i) => {
                  const isOpen = openKlant === k.naam;
                  const max = klantData.klanten[0].totaal;
                  const pct = max > 0 ? (k.totaal / max) * 100 : 0;
                  return (
                    <div key={k.naam} className="bg-gray-50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenKlant(isOpen ? null : k.naam)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className={`w-5 h-5 rounded-full ${accentClass} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm text-navy-700 font-medium truncate" title={k.naam}>{k.naam}</span>
                            <span className={`text-sm font-bold ${accentTextClass} flex-shrink-0`}>{euroL(k.totaal)}</span>
                          </div>
                          <div className="h-1 bg-white rounded-full overflow-hidden">
                            <div className={`h-full ${accentClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-gray-400 text-xs flex-shrink-0">{isOpen ? "▾" : "▸"}</span>
                      </button>

                      {isOpen && (
                        <div className="px-3 py-3 bg-white border-t border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Per maand</p>
                          <div className="grid grid-cols-6 gap-1.5">
                            {k.perMaand.map((bedrag, mi) => {
                              const heeftData = bedrag > 0;
                              const cellBg = heeftData
                                ? (isKosten ? "bg-gold-500/15" : "bg-navy-700/10")
                                : "bg-gray-50";
                              const cellText = heeftData ? accentTextClass : "text-gray-300";
                              return (
                                <div
                                  key={mi}
                                  className={`rounded p-1.5 text-center ${cellBg}`}
                                  title={`${MAANDEN[mi]} ${jaar}: ${heeftData ? euroL(bedrag) : (isKosten ? "geen kosten" : "geen omzet")}`}
                                >
                                  <div className="text-[9px] font-bold text-gray-400 uppercase">{MAANDEN[mi]}</div>
                                  <div className={`text-[10px] font-semibold ${cellText}`}>
                                    {heeftData ? `€${(bedrag / 1000).toFixed(bedrag >= 1000 ? 0 : 1)}K` : "—"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

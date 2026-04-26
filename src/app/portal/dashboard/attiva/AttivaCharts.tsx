"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Euro, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";

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

function euro(v: number) {
  return `€ ${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
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

export default function AttivaCharts() {
  const [data, setData] = useState<ExactData | null>(null);
  const [vorigData, setVorigData] = useState<ExactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState<number>(HUIDIG_JAAR);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(j: number, forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      // Één call met beide jaren — vermijdt race condition op token refresh
      // forceRefresh=true bij handmatig vernieuwen, anders cache gebruiken
      const res = await fetch(`/api/exact/data?jaar=${j}&jaarVorig=${j - 1}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // Response is { huidig: ExactData, vorig: ExactData }
      setData(json.huidig ?? json);
      setVorigData(json.vorig ?? null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(jaar); }, [jaar]);

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
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-6">
      {jaarSelector}
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="card animate-pulse h-72 flex items-center justify-center gap-3 text-gray-300">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm">Exact Online data ophalen...</span>
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

  const totaalOmzet = Math.max(0, maandData.reduce((s, r) => s + r.omzet, 0));
  const totaalKosten = Math.max(0, maandData.reduce((s, r) => s + r.kosten, 0));
  const totaalMarge = totaalOmzet - totaalKosten;
  const margePercent = totaalOmzet > 0 ? (totaalMarge / totaalOmzet) * 100 : 0;

  const vorigOmzet = Math.max(0, vorigMaandData.reduce((s, r) => s + r.omzet, 0));
  const vorigKosten = Math.max(0, vorigMaandData.reduce((s, r) => s + r.kosten, 0));
  const vorigMarge = vorigOmzet - vorigKosten;

  const vergelijkData = MAANDEN.map((m) => ({
    maand: m,
    [`omzet${jaar}`]: maandData.find(r => r.maand === m)?.omzet ?? 0,
    [`omzet${jaar - 1}`]: vorigMaandData.find(r => r.maand === m)?.omzet ?? 0,
  })).filter(r => (r[`omzet${jaar}`] as number) > 0 || (r[`omzet${jaar - 1}`] as number) > 0);

  const kostenPerCategorie = Object.entries(
    (data.pl ?? []).filter(r => !r.IsRevenue)
      .reduce((acc, r) => { acc[r.Description] = (acc[r.Description] ?? 0) + r.Amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

  const topDebiteuren = (data.debiteuren ?? [])
    .map(d => ({ ...d, totaal: (d.Age0to30??0)+(d.Age31to60??0)+(d.Age61to90??0)+(d.Age90Plus??0) }))
    .filter(d => d.totaal > 0).sort((a, b) => b.totaal - a.totaal).slice(0, 5);

  const topCrediteuren = (data.crediteuren ?? [])
    .map(d => ({ ...d, totaal: (d.Age0to30??0)+(d.Age31to60??0)+(d.Age61to90??0)+(d.Age90Plus??0) }))
    .filter(d => d.totaal > 0).sort((a, b) => b.totaal - a.totaal).slice(0, 5);

  // Echte factuuromzet per klant (uit SalesInvoices) — huidig en vorig jaar
  const klantOmzetHuidig = data.omzetPerKlant ?? [];
  const klantOmzetVorig = vorigData?.omzetPerKlant ?? [];

  // Vergelijk klanten tussen jaren
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
  ].join("\n");

  return (
    <div className="space-y-6">
      {jaarSelector}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-5">
        {/* Omzet */}
        <div className="card border-t-4 border-t-navy-700">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
              <Euro size={16} className="text-navy-700" />
            </div>
            <Trend current={totaalOmzet} previous={vorigOmzet} />
          </div>
          <p className="text-sm text-gray-400 mb-1">Totale omzet</p>
          <p className="text-2xl font-bold text-navy-700">{euro(totaalOmzet)}</p>
          {vorigOmzet > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(vorigOmzet)}</p>}
        </div>

        {/* Kosten */}
        <div className="card border-t-4 border-t-gold-500">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
              <Euro size={16} className="text-gold-500" />
            </div>
            <Trend current={totaalKosten} previous={vorigKosten} inverse />
          </div>
          <p className="text-sm text-gray-400 mb-1">Totale kosten</p>
          <p className="text-2xl font-bold text-navy-700">{euro(totaalKosten)}</p>
          {vorigKosten > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(vorigKosten)}</p>}
        </div>

        {/* Resultaat */}
        <div className={`card border-t-4 ${totaalMarge >= 0 ? "border-t-emerald-500" : "border-t-red-500"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totaalMarge >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              {totaalMarge >= 0
                ? <TrendingUp size={16} className="text-emerald-600" />
                : <TrendingDown size={16} className="text-red-500" />}
            </div>
            <Trend current={totaalMarge} previous={vorigMarge} />
          </div>
          <p className="text-sm text-gray-400 mb-1">Nettoresultaat</p>
          <p className={`text-2xl font-bold ${totaalMarge >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {euro(totaalMarge)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {margePercent.toFixed(1)}% marge
            {vorigMarge !== 0 && ` · vorig jaar: ${euro(vorigMarge)}`}
          </p>
        </div>
      </div>

      {/* Omzet vs Kosten */}
      {maandData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-5">Omzet vs Kosten per maand — {data.jaar}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={maandData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="omzet" name="Omzet" fill="#1B3A5C" radius={[5,5,0,0]} />
              <Bar dataKey="kosten" name="Kosten" fill="#C9A84C" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nettoresultaat trend */}
      {maandData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-5">Nettoresultaat per maand — {data.jaar}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={maandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
              <Line type="monotone" dataKey="marge" name="Resultaat" stroke="#1B3A5C" strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.marge >= 0 ? "#10b981" : "#ef4444"} stroke="white" strokeWidth={2} />;
                }}
              />
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
              <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey={`omzet${jaar - 1}`} name={`${jaar - 1}`} fill="#cbd5e1" radius={[5,5,0,0]} />
              <Bar dataKey={`omzet${jaar}`} name={`${jaar}`} fill="#1B3A5C" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kostenuitsplitsing */}
      {kostenPerCategorie.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-4">Kostenuitsplitsing {data.jaar}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={kostenPerCategorie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3}>
                  {kostenPerCategorie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-4">Top kostenposten</h3>
            <div className="space-y-3">
              {kostenPerCategorie.map((k, i) => (
                <div key={k.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-gray-600 flex-1 truncate" title={k.name}>{k.name}</span>
                    <span className="text-sm font-semibold text-navy-700 flex-shrink-0">{euro(k.value)}</span>
                  </div>
                  <div className="ml-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(k.value / kostenPerCategorie[0].value) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Debiteuren & Crediteuren */}
      {(topDebiteuren.length > 0 || topCrediteuren.length > 0) && (
        <div className="grid grid-cols-2 gap-5">
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
        </div>
      )}

      {maandData.length > 0 && <DashboardChat context={chatContext} />}
    </div>
  );
}

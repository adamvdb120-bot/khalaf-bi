"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Minus, RefreshCw, AlertCircle, Wallet,
} from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface ExactData { pl: PlRow[] | null; jaar: number }
interface DeclaratieData {
  totaal: number;
  perMaand: { maand: string; bedrag: number }[];
  perSoort: { soort: string; bedrag: number }[];
  perPersoon: { naam: string; bedrag: number }[];
}

const MAANDEN_NL: Record<string, string> = {
  "01":"Jan","02":"Feb","03":"Mrt","04":"Apr","05":"Mei","06":"Jun",
  "07":"Jul","08":"Aug","09":"Sep","10":"Okt","11":"Nov","12":"Dec",
};

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);
const PIE_COLORS = ["#1B3A5C","#C9A84C","#3B6EA5","#E8B84B","#264D73","#D4A843","#4A7FB5","#F0C75A"];

function euro(v: number) {
  return `€ ${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
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

function buildCashflowData(pl: PlRow[]) {
  const perPeriode: Record<number, { inkomsten: number; uitgaven: number }> = {};
  pl.forEach(row => {
    const p = row.Period;
    if (p < 1 || p > 12) return;
    if (!perPeriode[p]) perPeriode[p] = { inkomsten: 0, uitgaven: 0 };
    if (row.IsRevenue) perPeriode[p].inkomsten += row.Amount;
    else perPeriode[p].uitgaven += row.Amount;
  });

  let cumulatief = 0;
  return Object.entries(perPeriode)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([p, v]) => {
      const netto = Math.round(v.inkomsten - v.uitgaven);
      cumulatief += netto;
      return {
        maand: MAANDEN[Number(p) - 1] ?? `P${p}`,
        inkomsten: Math.round(v.inkomsten),
        uitgaven: Math.round(v.uitgaven),
        netto,
        cumulatief,
      };
    });
}

function buildUitgavenCategorieen(pl: PlRow[]) {
  return Object.entries(
    pl.filter(r => !r.IsRevenue)
      .reduce((acc, r) => {
        acc[r.Description] = (acc[r.Description] ?? 0) + r.Amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export default function CashflowSection() {
  const [data, setData] = useState<ExactData | null>(null);
  const [vorigData, setVorigData] = useState<ExactData | null>(null);
  const [declaraties, setDeclaraties] = useState<DeclaratieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState(HUIDIG_JAAR);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(j: number, forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const [exactRes, declRes] = await Promise.all([
        fetch(`/api/exact/data?jaar=${j}&jaarVorig=${j - 1}${forceRefresh ? "&refresh=1" : ""}`),
        fetch(`/api/attiva/declaraties?jaar=${j}`),
      ]);
      if (!exactRes.ok) throw new Error(await exactRes.text());
      const json = await exactRes.json();
      setData(json.huidig ?? json);
      setVorigData(json.vorig ?? null);
      if (declRes.ok) setDeclaraties(await declRes.json());
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
      <div className="grid grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="card animate-pulse h-64 flex items-center justify-center gap-3 text-gray-300">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm">Cashflow data ophalen...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="space-y-6">
      {jaarSelector}
      <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="font-semibold text-navy-700">Fout bij ophalen cashflow data</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button onClick={() => load(jaar)}
          className="bg-navy-700 text-white px-6 py-2 rounded-xl text-sm hover:bg-navy-600 transition-colors">
          Opnieuw proberen
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const cashflowData = buildCashflowData(data.pl ?? []);
  const vorigCashflowData = vorigData ? buildCashflowData(vorigData.pl ?? []) : [];
  const uitgavenCategorieen = buildUitgavenCategorieen(data.pl ?? []);

  const totaalInkomsten = cashflowData.reduce((s, r) => s + r.inkomsten, 0);
  const totaalUitgaven = cashflowData.reduce((s, r) => s + r.uitgaven, 0);
  const nettoCashflow = totaalInkomsten - totaalUitgaven;
  const eindSaldo = cashflowData[cashflowData.length - 1]?.cumulatief ?? 0;

  const vorigInkomsten = vorigCashflowData.reduce((s, r) => s + r.inkomsten, 0);
  const vorigUitgaven = vorigCashflowData.reduce((s, r) => s + r.uitgaven, 0);
  const vorigNetto = vorigInkomsten - vorigUitgaven;

  // Beste en slechtste maand
  const besteMaand = [...cashflowData].sort((a, b) => b.netto - a.netto)[0];
  const slechteMaand = [...cashflowData].sort((a, b) => a.netto - b.netto)[0];

  return (
    <div className="space-y-6">
      {jaarSelector}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card border-t-4 border-t-emerald-500">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={16} className="text-emerald-600" />
            </div>
            <Trend current={totaalInkomsten} previous={vorigInkomsten} />
          </div>
          <p className="text-sm text-gray-400 mb-1">Totaal ontvangen</p>
          <p className="text-2xl font-bold text-navy-700">{euro(totaalInkomsten)}</p>
          {vorigInkomsten > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(vorigInkomsten)}</p>}
        </div>

        <div className="card border-t-4 border-t-red-400">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <ArrowDownRight size={16} className="text-red-500" />
            </div>
            <Trend current={totaalUitgaven} previous={vorigUitgaven} inverse />
          </div>
          <p className="text-sm text-gray-400 mb-1">Totaal uitgegeven</p>
          <p className="text-2xl font-bold text-navy-700">{euro(totaalUitgaven)}</p>
          {vorigUitgaven > 0 && <p className="text-xs text-gray-400 mt-1">Vorig jaar: {euro(vorigUitgaven)}</p>}
        </div>

        <div className={`card border-t-4 ${nettoCashflow >= 0 ? "border-t-navy-700" : "border-t-orange-500"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${nettoCashflow >= 0 ? "bg-navy-700/10" : "bg-orange-50"}`}>
              {nettoCashflow >= 0
                ? <TrendingUp size={16} className="text-navy-700" />
                : <TrendingDown size={16} className="text-orange-500" />}
            </div>
            <Trend current={nettoCashflow} previous={vorigNetto} />
          </div>
          <p className="text-sm text-gray-400 mb-1">Netto cashflow</p>
          <p className={`text-2xl font-bold ${nettoCashflow >= 0 ? "text-navy-700" : "text-orange-500"}`}>
            {euro(nettoCashflow)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {totaalInkomsten > 0 ? `${((nettoCashflow / totaalInkomsten) * 100).toFixed(1)}% van inkomsten` : ""}
          </p>
        </div>

        <div className="card border-t-4 border-t-gold-500">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
              <Wallet size={16} className="text-gold-600" />
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-1">Cumulatief saldo</p>
          <p className={`text-2xl font-bold ${eindSaldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {euro(eindSaldo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Einde {MAANDEN[(cashflowData.length - 1)] ?? "periode"}</p>
        </div>
      </div>

      {/* Inkomsten vs Uitgaven per maand */}
      {cashflowData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-5">Inkomsten vs Uitgaven per maand — {jaar}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashflowData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => euro(v)}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="inkomsten" name="Inkomsten" fill="#10b981" radius={[5,5,0,0]} />
              <Bar dataKey="uitgaven" name="Uitgaven" fill="#ef4444" radius={[5,5,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Netto cashflow + cumulatief */}
      {cashflowData.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Netto cashflow per maand</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => euro(v)}
                  contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
                <Bar dataKey="netto" name="Netto cashflow" radius={[4,4,0,0]}>
                  {cashflowData.map((entry, i) => (
                    <rect key={i} fill={entry.netto >= 0 ? "#1B3A5C" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Cumulatieve cashflow</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => euro(v)}
                  contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cumulatief" name="Cumulatief saldo" stroke="#C9A84C"
                  strokeWidth={2.5} dot={{ r: 4, fill: "#C9A84C", stroke: "white", strokeWidth: 2 }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top uitgavenposten */}
      {uitgavenCategorieen.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-5">Top uitgavenposten — {jaar}</h3>
          <div className="space-y-3">
            {uitgavenCategorieen.map((k, i) => (
              <div key={k.name}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 truncate">{k.name}</span>
                  <span className="text-sm font-bold text-navy-700 flex-shrink-0">{euro(k.value)}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 w-10 text-right">
                    {totaalUitgaven > 0 ? `${((k.value / totaalUitgaven) * 100).toFixed(0)}%` : ""}
                  </span>
                </div>
                <div className="ml-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(k.value / uitgavenCategorieen[0].value) * 100}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                </div>
              </div>
            ))}
          </div>

          {/* Beste / slechtste maand */}
          {cashflowData.length > 1 && (
            <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Beste maand</div>
                <div className="text-lg font-bold text-navy-700">{besteMaand?.maand}</div>
                <div className="text-sm text-emerald-600 font-semibold">{euro(besteMaand?.netto ?? 0)}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1">Zwaarste maand</div>
                <div className="text-lg font-bold text-navy-700">{slechteMaand?.maand}</div>
                <div className="text-sm text-red-500 font-semibold">{euro(slechteMaand?.netto ?? 0)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {cashflowData.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <p>Geen cashflow data gevonden voor {jaar} in Exact Online.</p>
        </div>
      )}

      {/* AI Chatbot */}
      {cashflowData.length > 0 && (
        <DashboardChat context={[
          `Cashflow data Attiva Zorg — jaar ${jaar} (bron: Exact Online, real-time):`,
          `- Totaal ontvangen: ${euro(totaalInkomsten)}`,
          `- Totaal uitgegeven: ${euro(totaalUitgaven)}`,
          `- Netto cashflow: ${euro(nettoCashflow)} (${totaalInkomsten > 0 ? ((nettoCashflow / totaalInkomsten) * 100).toFixed(1) : 0}% van inkomsten)`,
          `- Cumulatief eindsaldo: ${euro(eindSaldo)}`,
          ``,
          `Cashflow per maand (wat daadwerkelijk binnenkwam en uitging):`,
          ...cashflowData.map(m =>
            `- ${m.maand}: ontvangen ${euro(m.inkomsten)}, uitgegeven ${euro(m.uitgaven)}, netto ${euro(m.netto)}, cumulatief ${euro(m.cumulatief)}`
          ),
          ...(vorigCashflowData.length > 0 ? [
            ``,
            `Vorig jaar (${jaar - 1}) per maand:`,
            ...vorigCashflowData.map(m =>
              `- ${m.maand}: ontvangen ${euro(m.inkomsten)}, uitgegeven ${euro(m.uitgaven)}, netto ${euro(m.netto)}`
            ),
          ] : []),
          ``,
          `Top uitgavenposten ${jaar}:`,
          ...uitgavenCategorieen.map(k =>
            `- ${k.name}: ${euro(k.value)} (${totaalUitgaven > 0 ? ((k.value / totaalUitgaven) * 100).toFixed(0) : 0}% van totale uitgaven)`
          ),
          ...(besteMaand ? [``, `Beste maand qua cashflow: ${besteMaand.maand} (${euro(besteMaand.netto)})`] : []),
          ...(slechteMaand ? [`Zwaarste maand qua cashflow: ${slechteMaand.maand} (${euro(slechteMaand.netto)})`] : []),
          ...(declaraties ? [
            ``,
            `--- DECLARATIEOVERZICHT (wat gedeclareerd/uitbetaald is via SVB/PGB) ---`,
            `BELANGRIJK: "Declaraties" = wat uitbetaald is via SVB/PGB budgetten. "Cashflow inkomsten" = wat daadwerkelijk op de bankrekening binnenkwam. Als declaraties hoger zijn dan cashflow inkomsten, zijn er nog openstaande betalingen.`,
            ``,
            `Totaal gedeclareerd/uitbetaald ${jaar}: ${euro(declaraties.totaal)}`,
            `Totaal daadwerkelijk ontvangen (cashflow) ${jaar}: ${euro(totaalInkomsten)}`,
            `Verschil (openstaand/timing): ${euro(declaraties.totaal - totaalInkomsten)}`,
            ``,
            `Declaraties per maand ${jaar} vs daadwerkelijk ontvangen:`,
            ...cashflowData.map(m => {
              const maandNum = String(MAANDEN.indexOf(m.maand) + 1).padStart(2, "0");
              const declMaand = declaraties.perMaand.find(d => MAANDEN_NL[d.maand.slice(5, 7)] === m.maand || d.maand.slice(5, 7) === maandNum);
              const declBedrag = declMaand?.bedrag ?? 0;
              const verschil = m.inkomsten - declBedrag;
              return `- ${m.maand}: gedeclareerd ${euro(declBedrag)}, ontvangen ${euro(m.inkomsten)}, verschil ${euro(verschil)}`;
            }),
            ``,
            `Declaraties per soort:`,
            ...declaraties.perSoort.map(s => `- ${s.soort}: ${euro(s.bedrag)}`),
            ``,
            `Declaraties per cliënt:`,
            ...declaraties.perPersoon.map(p => `- ${p.naam}: ${euro(p.bedrag)}`),
          ] : []),
        ].join("\n")} />
      )}
    </div>
  );
}

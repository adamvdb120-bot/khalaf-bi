"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, AlertCircle, AlertTriangle, Wallet, Users, Clock } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";
import PinnedChartsSection from "@/components/portal/PinnedChartsSection";
import ExportButton from "@/components/portal/ExportButton";

interface Crediteur {
  Name: string;
  AccountCode?: string;
  Age0to30: number;
  Age31to60: number;
  Age61to90: number;
  Age90Plus: number;
}
interface RawFactuur {
  AccountName: string;
  AccountCode: string;
  Description: string;
  Amount: number;
  DueDate: string | null;
  InvoiceDate: string | null;
  EntryDate: string | null;
  InvoiceNumber: number | string | null;
  YourRef: string | null;
}
interface ExactData {
  jaar: number;
  crediteuren: Crediteur[] | null;
  crediteurenRaw?: RawFactuur[] | null;
}
interface LevResult {
  jaar: number;
  totaal: number;
  aantalLeveranciers: number;
  leveranciers: { naam: string; totaal: number }[];
}

function euro(v: number | string | undefined) {
  return `€ ${Number(v ?? 0).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);

const AGING_COLORS = {
  "0-30": "#10b981",   // groen
  "31-60": "#eab308",  // geel
  "61-90": "#f97316",  // oranje
  "90+": "#ef4444",    // rood
};

function totaal(c: Crediteur) {
  return (c.Age0to30 ?? 0) + (c.Age31to60 ?? 0) + (c.Age61to90 ?? 0) + (c.Age90Plus ?? 0);
}

function AgedBar({ c }: { c: Crediteur }) {
  const t = totaal(c);
  if (t === 0) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full">
      {[
        { v: c.Age0to30, color: AGING_COLORS["0-30"] },
        { v: c.Age31to60, color: AGING_COLORS["31-60"] },
        { v: c.Age61to90, color: AGING_COLORS["61-90"] },
        { v: c.Age90Plus, color: AGING_COLORS["90+"] },
      ].map(({ v, color }, i) =>
        v > 0 ? <div key={i} style={{ width: `${(v / t) * 100}%`, backgroundColor: color }} /> : null
      )}
    </div>
  );
}

export default function CrediteurenSection() {
  const [data, setData] = useState<ExactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState<number>(HUIDIG_JAAR);
  const [pinnedRefresh, setPinnedRefresh] = useState(0);
  const [detailCred, setDetailCred] = useState<{ name: string; code: string } | null>(null);
  // "exact" = openstaande crediteuren (aging); "bankimport" = top leveranciers (betaald)
  const [bron, setBron] = useState<"exact" | "bankimport">("exact");
  // Top leveranciers per jaar uit Exact (kosten per tegenpartij) + vorig jaar voor de vergelijking
  const [lev, setLev] = useState<LevResult | null>(null);
  const [levVorig, setLevVorig] = useState<LevResult | null>(null);

  async function load(j: number, forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      // Crediteuren-data uit Exact PayablesList is real-time (niet jaar-afhankelijk),
      // maar we delen de cache met de Financieel-tab via dezelfde cache-key
      const res = await fetch(`/api/exact/data?jaar=${j}&jaarVorig=${j - 1}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const huidig = json.huidig ?? json;
      // Zelfde bron-logica als het Financieel-tab: heeft Exact geen omzet voor dit
      // jaar, val terug op de tijdelijke bankimport (toont 'top leveranciers betaald').
      const exactPl: { IsRevenue?: boolean; Amount?: number }[] = Array.isArray(huidig?.pl) ? huidig.pl : [];
      const exactOmzet = exactPl.filter(r => r.IsRevenue).reduce((s, r) => s + (r.Amount ?? 0), 0);
      if (exactPl.length === 0 || exactOmzet <= 0) {
        try {
          const bres = await fetch(`/api/attiva/bankdata?jaar=${j}`);
          if (bres.ok) {
            const bjson = await bres.json();
            const bh = bjson?.huidig ?? bjson;
            if (Array.isArray(bh?.crediteuren) && bh.crediteuren.length > 0) {
              setBron("bankimport");
              setData(bh);
              return;
            }
          }
        } catch { /* val terug op Exact */ }
      }
      setBron("exact");
      // Top leveranciers per jaar uit Exact (huidig + vorig jaar voor de vergelijking).
      // Best-effort: als de uitvraag faalt, valt de tab terug op de openstaande-crediteurenweergave.
      const [levR, levVorigR] = await Promise.all([
        fetch(`/api/exact/leveranciers-per-jaar?jaar=${j}${forceRefresh ? "&refresh=1" : ""}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/exact/leveranciers-per-jaar?jaar=${j - 1}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setLev(levR && Array.isArray(levR.leveranciers) ? levR : null);
      setLevVorig(levVorigR && Array.isArray(levVorigR.leveranciers) ? levVorigR : null);
      setData(huidig);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(jaar); }, [jaar]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse h-72 flex items-center justify-center gap-3 text-gray-300">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm">Crediteuren ophalen uit Exact Online...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-navy-700">Fout bij ophalen crediteuren</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button onClick={() => load(jaar)} className="bg-navy-700 text-white px-6 py-2 rounded-xl text-sm hover:bg-navy-600 transition-colors">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ─── Bankimport-modus: top leveranciers (betaald), geen openstaande/aging ───
  if (bron === "bankimport") {
    const leveranciers = (data.crediteuren ?? [])
      .map(c => ({ Name: c.Name, bedrag: totaal(c) }))
      .filter(l => l.bedrag > 0)
      .sort((a, b) => b.bedrag - a.bedrag);
    const totaalBetaald = leveranciers.reduce((s, l) => s + l.bedrag, 0);
    const grootste = leveranciers[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-1.5">
            <Wallet size={13} className="text-gray-500" />
            <span className="text-sm text-gray-600">
              Grootste leveranciers — <strong className="text-navy-700">betaald in {data.jaar}</strong>
            </span>
          </div>
          <button onClick={() => load(data.jaar, true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw size={12} /> Vernieuwen
          </button>
        </div>

        {/* KPI's */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="card border-t-4 border-t-navy-700">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center mb-3"><Wallet size={16} className="text-navy-700" /></div>
            <p className="text-sm text-gray-400 mb-1">Totaal betaald</p>
            <p className="text-2xl font-bold text-navy-700">{euro(totaalBetaald)}</p>
          </div>
          <div className="card border-t-4 border-t-gold-500">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center mb-3"><Users size={16} className="text-gold-500" /></div>
            <p className="text-sm text-gray-400 mb-1">Aantal leveranciers</p>
            <p className="text-2xl font-bold text-navy-700">{leveranciers.length}</p>
          </div>
          <div className="card border-t-4 border-t-emerald-500">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3"><AlertTriangle size={16} className="text-emerald-600" /></div>
            <p className="text-sm text-gray-400 mb-1">Grootste leverancier</p>
            <p className="text-lg font-bold text-navy-700 truncate" title={grootste?.Name}>{grootste?.Name ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-1">{euro(grootste?.bedrag ?? 0)}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-1">Grootste leveranciers (betaald in {data.jaar})</h3>
          <p className="text-xs text-gray-400 mb-4">Op basis van uitgaande betalingen uit de bankmutaties — geen openstaande facturen.</p>
          <ResponsiveContainer width="100%" height={Math.max(280, leveranciers.length * 42)}>
            <BarChart data={leveranciers} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="Name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={150}
                tickFormatter={(s: string) => s.length > 20 ? s.slice(0, 20) + "…" : s} />
              <Tooltip formatter={(v) => euro(v as number)}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="bedrag" fill="#1B3A5C" radius={[0, 5, 5, 0]} name="Betaald" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabel */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy-700">Alle leveranciers ({leveranciers.length})</h3>
            <ExportButton
              filename={`Attiva-Leveranciers-${data.jaar}`}
              sheetName="Leveranciers"
              rows={leveranciers.map((l, i) => ({ Rang: i + 1, Leverancier: l.Name, "Betaald in jaar": l.bedrag }))}
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left font-medium pb-2 w-10">#</th>
                <th className="text-left font-medium pb-2">Leverancier</th>
                <th className="text-right font-medium pb-2">Betaald in {data.jaar}</th>
              </tr>
            </thead>
            <tbody>
              {leveranciers.map((l, i) => (
                <tr key={l.Name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5">
                    <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold inline-flex items-center justify-center">{i + 1}</span>
                  </td>
                  <td className="py-2.5 font-medium text-navy-700">{l.Name}</td>
                  <td className="py-2.5 text-right font-bold text-navy-700">{euro(l.bedrag)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-navy-700">
                <td />
                <td className="pt-3">Totaal</td>
                <td className="pt-3 text-right">{euro(totaalBetaald)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // ─── Exact-modus met leveranciers-data: top leveranciers + jaarvergelijking ──
  if (bron === "exact" && lev && lev.leveranciers.length > 0) {
    const top = lev.leveranciers.slice(0, 12);
    const vorigMap = new Map((levVorig?.leveranciers ?? []).map(l => [l.naam, l.totaal]));
    const yoy = lev.leveranciers.slice(0, 15).map(l => {
      const v = vorigMap.get(l.naam) ?? 0;
      return { naam: l.naam, nu: l.totaal, vorig: v, delta: l.totaal - v, deltaPct: v > 0 ? ((l.totaal - v) / v) * 100 : null };
    });
    const grootste = lev.leveranciers[0];
    const totaalNu = lev.totaal;
    const totaalVorig = levVorig?.totaal ?? 0;
    const totaalDelta = totaalNu - totaalVorig;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Jaar:</span>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {JAREN.map(j => (
                <button key={j} onClick={() => setJaar(j)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"}`}>{j}</button>
              ))}
            </div>
          </div>
          <button onClick={() => load(jaar, true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw size={12} /> Vernieuwen
          </button>
        </div>

        {/* KPI's */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="card border-t-4 border-t-navy-700">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center mb-3"><Wallet size={16} className="text-navy-700" /></div>
            <p className="text-sm text-gray-400 mb-1">Totaal via leveranciers {jaar}</p>
            <p className="text-2xl font-bold text-navy-700">{euro(totaalNu)}</p>
            {totaalVorig > 0 && <p className="text-xs text-gray-400 mt-1">{jaar - 1}: {euro(totaalVorig)}</p>}
          </div>
          <div className="card border-t-4 border-t-gold-500">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center mb-3"><Users size={16} className="text-gold-500" /></div>
            <p className="text-sm text-gray-400 mb-1">Aantal leveranciers</p>
            <p className="text-2xl font-bold text-navy-700">{lev.aantalLeveranciers}</p>
            {grootste && <p className="text-xs text-gray-400 mt-1 truncate" title={grootste.naam}>Grootste: {grootste.naam}</p>}
          </div>
          <div className={`card border-t-4 ${totaalDelta >= 0 ? "border-t-red-400" : "border-t-emerald-500"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${totaalDelta >= 0 ? "bg-red-50" : "bg-emerald-50"}`}><AlertTriangle size={16} className={totaalDelta >= 0 ? "text-red-500" : "text-emerald-600"} /></div>
            <p className="text-sm text-gray-400 mb-1">Verschil t.o.v. {jaar - 1}</p>
            <p className={`text-2xl font-bold ${totaalDelta >= 0 ? "text-red-600" : "text-emerald-600"}`}>
              {totaalVorig > 0 ? `${totaalDelta >= 0 ? "+" : "−"}${euro(Math.abs(totaalDelta))}` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">meer kosten = rood</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-1">Grootste leveranciers — {jaar}</h3>
          <p className="text-xs text-gray-400 mb-4">Geboekte kosten per tegenpartij (Exact Online, grootboek 4000–7999)</p>
          <ResponsiveContainer width="100%" height={Math.max(280, top.length * 42)}>
            <BarChart data={top} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="naam" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={150}
                tickFormatter={(s: string) => s.length > 20 ? s.slice(0, 20) + "…" : s} />
              <Tooltip formatter={(v) => euro(v as number)}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="totaal" fill="#1B3A5C" radius={[0, 5, 5, 0]} name="Geboekte kosten" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Jaarvergelijking */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-navy-700">Jaarvergelijking — {jaar - 1} vs {jaar}</h3>
            <ExportButton
              filename={`Attiva-Leveranciers-${jaar - 1}-vs-${jaar}`}
              sheetName="Leveranciers"
              rows={yoy.map((r, i) => ({
                Rang: i + 1, Leverancier: r.naam,
                [`${jaar - 1}`]: r.vorig, [`${jaar}`]: r.nu,
                "Verschil (EUR)": r.delta,
                "Verschil (%)": r.deltaPct !== null ? Math.round(r.deltaPct) : "",
              }))}
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">Top {yoy.length} leveranciers van {jaar}, met het bedrag van {jaar - 1} ernaast.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left font-medium pb-2 w-10">#</th>
                  <th className="text-left font-medium pb-2">Leverancier</th>
                  <th className="text-right font-medium pb-2">{jaar - 1}</th>
                  <th className="text-right font-medium pb-2">{jaar}</th>
                  <th className="text-right font-medium pb-2 pl-6">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {yoy.map((r, i) => (
                  <tr key={r.naam} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5"><span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold inline-flex items-center justify-center">{i + 1}</span></td>
                    <td className="py-2.5 font-medium text-navy-700">{r.naam}</td>
                    <td className="py-2.5 text-right text-gray-500">{r.vorig > 0 ? euro(r.vorig) : "—"}</td>
                    <td className="py-2.5 text-right font-semibold text-navy-700">{euro(r.nu)}</td>
                    <td className={`py-2.5 text-right pl-6 font-semibold ${r.delta > 0 ? "text-red-600" : r.delta < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {r.vorig === 0
                        ? "nieuw"
                        : `${r.delta > 0 ? "+" : r.delta < 0 ? "−" : ""}${euro(Math.abs(r.delta))}${r.deltaPct !== null ? ` (${r.deltaPct >= 0 ? "+" : ""}${r.deltaPct.toFixed(0)}%)` : ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">Bron: kosten per tegenpartij uit Exact Online (geboekte bedragen per jaar).</p>
        </div>
      </div>
    );
  }

  const crediteuren = (data.crediteuren ?? [])
    .map(c => ({ ...c, totaal: totaal(c) }))
    .filter(c => c.totaal > 0)
    .sort((a, b) => b.totaal - a.totaal);

  const totaalOpenstaand = crediteuren.reduce((s, c) => s + c.totaal, 0);
  const aantal = crediteuren.length;

  const totaal0_30 = crediteuren.reduce((s, c) => s + (c.Age0to30 ?? 0), 0);
  const totaal31_60 = crediteuren.reduce((s, c) => s + (c.Age31to60 ?? 0), 0);
  const totaal61_90 = crediteuren.reduce((s, c) => s + (c.Age61to90 ?? 0), 0);
  const totaal90Plus = crediteuren.reduce((s, c) => s + (c.Age90Plus ?? 0), 0);

  const urgentPct = totaalOpenstaand > 0 ? (totaal90Plus / totaalOpenstaand) * 100 : 0;

  // Gewogen gemiddelde leeftijd (midden van bucket * bedrag)
  const gemLeeftijd = totaalOpenstaand > 0
    ? Math.round(
        (totaal0_30 * 15 + totaal31_60 * 45 + totaal61_90 * 75 + totaal90Plus * 120) / totaalOpenstaand
      )
    : 0;

  const top10 = crediteuren.slice(0, 10);

  const agingPieData = [
    { name: "0-30 dagen", value: Math.round(totaal0_30), color: AGING_COLORS["0-30"] },
    { name: "31-60 dagen", value: Math.round(totaal31_60), color: AGING_COLORS["31-60"] },
    { name: "61-90 dagen", value: Math.round(totaal61_90), color: AGING_COLORS["61-90"] },
    { name: ">90 dagen", value: Math.round(totaal90Plus), color: AGING_COLORS["90+"] },
  ].filter(d => d.value > 0);

  const chatContext = [
    `Crediteuren-overzicht Attiva Zorg — peildatum nu (bron: Exact Online):`,
    `- Totaal openstaand: ${euro(totaalOpenstaand)} bij ${aantal} crediteuren`,
    `- 0-30 dagen: ${euro(totaal0_30)} (${totaalOpenstaand > 0 ? ((totaal0_30/totaalOpenstaand)*100).toFixed(0) : 0}%)`,
    `- 31-60 dagen: ${euro(totaal31_60)} (${totaalOpenstaand > 0 ? ((totaal31_60/totaalOpenstaand)*100).toFixed(0) : 0}%)`,
    `- 61-90 dagen: ${euro(totaal61_90)} (${totaalOpenstaand > 0 ? ((totaal61_90/totaalOpenstaand)*100).toFixed(0) : 0}%)`,
    `- >90 dagen (urgent): ${euro(totaal90Plus)} (${urgentPct.toFixed(0)}%)`,
    `- Gewogen gemiddelde ouderdom: ${gemLeeftijd} dagen`,
    ``,
    `Top crediteuren (open bedrag, gesorteerd):`,
    ...top10.map((c, i) =>
      `${i+1}. ${c.Name}: ${euro(c.totaal)} ` +
      `(0-30: ${euro(c.Age0to30)}, 31-60: ${euro(c.Age31to60)}, ` +
      `61-90: ${euro(c.Age61to90)}, >90: ${euro(c.Age90Plus)})`
    ),
  ].join("\n");

  return (
    <div className="space-y-6">
      {/* Filterbalk — geen jaar-pills want crediteuren is real-time peildatum */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-1.5">
          <Clock size={13} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            Peildatum: <strong className="text-navy-700">{new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </span>
        </div>
        <button onClick={() => load(jaar, true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={12} /> Vernieuwen
        </button>
      </div>

      {crediteuren.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet size={26} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-navy-700">Geen openstaande crediteuren</p>
            <p className="text-sm text-gray-400 mt-1">
              Volgens Exact Online staan er nu geen onbetaalde crediteurenfacturen open.
            </p>
          </div>
          <button onClick={() => load(jaar, true)}
            className="inline-flex items-center gap-2 text-sm bg-navy-700 hover:bg-navy-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
            <RefreshCw size={14} /> Forceer vernieuwen
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card border-t-4 border-t-navy-700">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
                  <Wallet size={16} className="text-navy-700" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Totaal openstaand</p>
              <p className="text-2xl font-bold text-navy-700">{euro(totaalOpenstaand)}</p>
            </div>

            <div className="card border-t-4 border-t-gold-500">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
                  <Users size={16} className="text-gold-500" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Aantal crediteuren</p>
              <p className="text-2xl font-bold text-navy-700">{aantal}</p>
            </div>

            <div className={`card border-t-4 ${urgentPct > 20 ? "border-t-red-500" : "border-t-emerald-500"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${urgentPct > 20 ? "bg-red-50" : "bg-emerald-50"}`}>
                  <AlertTriangle size={16} className={urgentPct > 20 ? "text-red-500" : "text-emerald-500"} />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">{">"}90 dagen (urgent)</p>
              <p className={`text-2xl font-bold ${urgentPct > 20 ? "text-red-500" : "text-navy-700"}`}>
                {euro(totaal90Plus)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{urgentPct.toFixed(0)}% van totaal</p>
            </div>

            <div className="card border-t-4 border-t-navy-700">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
                  <Clock size={16} className="text-navy-700" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">Gem. ouderdom</p>
              <p className="text-2xl font-bold text-navy-700">{gemLeeftijd} <span className="text-sm font-medium text-gray-400">dagen</span></p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Top 10 crediteuren */}
            <div className="card lg:col-span-2">
              <h3 className="font-bold text-navy-700 mb-5">Top {top10.length} crediteuren — open bedrag</h3>
              <ResponsiveContainer width="100%" height={Math.max(280, top10.length * 36)}>
                <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="Name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={140}
                    tickFormatter={(s: string) => s.length > 18 ? s.slice(0, 18) + "…" : s} />
                  <Tooltip formatter={(v) => euro(v as number)}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="totaal" fill="#1B3A5C" radius={[0, 5, 5, 0]} name="Open bedrag">
                    {top10.map((c, i) => (
                      <Cell key={i} fill={c.Age90Plus > c.totaal * 0.3 ? "#ef4444" : c.Age61to90 > c.totaal * 0.3 ? "#f97316" : "#1B3A5C"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-navy-700 rounded-full inline-block"/>Op tijd</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full inline-block"/>61-90 dagen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"/>{">"}90 dagen</span>
              </p>
            </div>

            {/* Aging donut */}
            <div className="card">
              <h3 className="font-bold text-navy-700 mb-5">Aging verdeling</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={agingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {agingPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => euro(v as number)}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volledige tabel */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-navy-700">Alle crediteuren ({crediteuren.length})</h3>
              <ExportButton
                filename={`Attiva-Crediteuren-${new Date().toISOString().slice(0, 10)}`}
                sheetName="Crediteuren"
                rows={crediteuren.map((c) => ({
                  Crediteur: c.Name,
                  "0-30 dagen": c.Age0to30 ?? 0,
                  "31-60 dagen": c.Age31to60 ?? 0,
                  "61-90 dagen": c.Age61to90 ?? 0,
                  "Meer dan 90 dagen": c.Age90Plus ?? 0,
                  Totaal: c.totaal,
                  Urgent: (c.Age90Plus ?? 0) > 0 ? "Ja" : "Nee",
                }))}
              />
            </div>
            <p className="text-xs text-gray-400 mb-3">Klik op een crediteur voor de openstaande facturen</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left font-medium pb-2">Crediteur</th>
                    <th className="text-right font-medium pb-2">0-30</th>
                    <th className="text-right font-medium pb-2">31-60</th>
                    <th className="text-right font-medium pb-2">61-90</th>
                    <th className="text-right font-medium pb-2">{">"}90</th>
                    <th className="text-right font-medium pb-2 pl-6">Totaal</th>
                    <th className="text-left font-medium pb-2 pl-6 w-32">Verdeling</th>
                  </tr>
                </thead>
                <tbody>
                  {crediteuren.map((c) => {
                    const isUrgent = c.Age90Plus > 0;
                    return (
                      <tr
                        key={c.Name}
                        onClick={() => setDetailCred({ name: c.Name, code: c.AccountCode ?? "" })}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 font-medium text-navy-700 truncate max-w-xs" title={c.Name}>
                          {c.Name}
                          {isUrgent && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>}
                        </td>
                        <td className="text-right text-gray-600">{c.Age0to30 > 0 ? euro(c.Age0to30) : "—"}</td>
                        <td className="text-right text-yellow-600">{c.Age31to60 > 0 ? euro(c.Age31to60) : "—"}</td>
                        <td className="text-right text-orange-600">{c.Age61to90 > 0 ? euro(c.Age61to90) : "—"}</td>
                        <td className="text-right text-red-600 font-semibold">{c.Age90Plus > 0 ? euro(c.Age90Plus) : "—"}</td>
                        <td className="text-right pl-6 font-bold text-navy-700">{euro(c.totaal)}</td>
                        <td className="pl-6"><AgedBar c={c} /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold text-navy-700">
                    <td className="pt-3">Totaal</td>
                    <td className="pt-3 text-right">{euro(totaal0_30)}</td>
                    <td className="pt-3 text-right">{euro(totaal31_60)}</td>
                    <td className="pt-3 text-right">{euro(totaal61_90)}</td>
                    <td className="pt-3 text-right text-red-600">{euro(totaal90Plus)}</td>
                    <td className="pt-3 text-right pl-6">{euro(totaalOpenstaand)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pinned + Chat */}
          <PinnedChartsSection tab="crediteuren" refresh={pinnedRefresh} />
          <DashboardChat
            context={chatContext}
            tab="crediteuren"
            onChartPinned={() => setPinnedRefresh(r => r + 1)}
          />
        </>
      )}

      {/* Detail modal: openstaande facturen per crediteur */}
      {detailCred && (
        <CrediteurFacturenModal
          crediteur={detailCred.name}
          accountCode={detailCred.code}
          facturen={data.crediteurenRaw ?? []}
          onClose={() => setDetailCred(null)}
        />
      )}
    </div>
  );
}

// ─── Crediteur facturen modal ─────────────────────────────────────────────────
function parseExactDate(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /\/Date\((-?\d+)\)\//.exec(s);
  if (m) return parseInt(m[1], 10);
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

function fmtDate(s: string | null | undefined): string {
  const ms = parseExactDate(s);
  if (ms === null) return "—";
  return new Date(ms).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function CrediteurFacturenModal({
  crediteur, accountCode, facturen, onClose,
}: {
  crediteur: string;
  accountCode: string;
  facturen: RawFactuur[];
  onClose: () => void;
}) {
  const [jaarFilter, setJaarFilter] = useState<number | "alle">("alle");

  // Filter facturen voor deze crediteur — primair op AccountCode, fallback op naam
  const eigenFacturen = facturen.filter(f => {
    if (accountCode && f.AccountCode) return f.AccountCode === accountCode;
    return f.AccountName === crediteur;
  });

  // Verrijk met dagen-open + factuurjaar
  const today = Date.now();
  const alleVerrijkt = eigenFacturen.map(f => {
    const dueMs = parseExactDate(f.DueDate ?? f.InvoiceDate ?? f.EntryDate);
    const factuurMs = parseExactDate(f.InvoiceDate ?? f.EntryDate ?? f.DueDate);
    const daysOverdue = dueMs !== null ? Math.floor((today - dueMs) / 86400000) : 0;
    const jaar = factuurMs !== null ? new Date(factuurMs).getFullYear() : null;
    return { ...f, daysOverdue, jaar };
  });

  // Beschikbare jaren (gesorteerd desc)
  const beschikbareJaren = Array.from(
    new Set(alleVerrijkt.map(f => f.jaar).filter((j): j is number => j !== null))
  ).sort((a, b) => b - a);

  // Tellingen per jaar voor pill-badges
  const aantalPerJaar: Record<number, number> = {};
  for (const f of alleVerrijkt) {
    if (f.jaar !== null) aantalPerJaar[f.jaar] = (aantalPerJaar[f.jaar] ?? 0) + 1;
  }

  // Toepassen filter
  const verrijkt = (jaarFilter === "alle"
    ? alleVerrijkt
    : alleVerrijkt.filter(f => f.jaar === jaarFilter)
  ).sort((a, b) => b.daysOverdue - a.daysOverdue);

  const totaal = verrijkt.reduce((s, f) => s + Math.abs(f.Amount), 0);
  const aantal = verrijkt.length;
  const urgent = verrijkt.filter(f => f.daysOverdue > 90).length;

  function bucketKleur(dagen: number) {
    if (dagen > 90) return { bg: "bg-red-50", text: "text-red-600", label: ">90 dagen" };
    if (dagen > 60) return { bg: "bg-orange-50", text: "text-orange-600", label: "61-90 dagen" };
    if (dagen > 30) return { bg: "bg-yellow-50", text: "text-yellow-600", label: "31-60 dagen" };
    if (dagen >= 0) return { bg: "bg-emerald-50", text: "text-emerald-600", label: "0-30 dagen" };
    return { bg: "bg-blue-50", text: "text-blue-600", label: "Niet vervallen" };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0 pr-3">
            <h2 className="font-bold text-navy-700 text-lg truncate">{crediteur}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Openstaande facturen — peildatum {new Date().toLocaleDateString("nl-NL")}
              {accountCode && <> · code {accountCode}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExportButton
              filename={`Attiva-Facturen-${crediteur.replace(/[^a-zA-Z0-9-]/g, "_")}`}
              sheetName={crediteur.slice(0, 28)}
              disabled={verrijkt.length === 0}
              rows={verrijkt.map(f => ({
                Factuurnummer: f.InvoiceNumber ?? "",
                Omschrijving: f.Description ?? "",
                Factuurdatum: fmtDate(f.InvoiceDate),
                Vervaldatum: fmtDate(f.DueDate),
                "Dagen open": f.daysOverdue,
                Bedrag: Math.abs(f.Amount),
                Jaar: f.jaar ?? "",
                Crediteur: crediteur,
                Status: f.daysOverdue > 90 ? ">90 dagen" : f.daysOverdue > 60 ? "61-90 dagen" : f.daysOverdue > 30 ? "31-60 dagen" : "0-30 dagen",
              }))}
            />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Jaar-filter pills (alleen tonen als facturen uit meerdere jaren komen) */}
        {beschikbareJaren.length > 1 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <span className="text-xs text-gray-400 font-medium">Filter:</span>
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setJaarFilter("alle")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  jaarFilter === "alle" ? "bg-navy-700 text-white" : "text-gray-500 hover:text-navy-700"
                }`}
              >
                Alle ({alleVerrijkt.length})
              </button>
              {beschikbareJaren.map((j) => (
                <button
                  key={j}
                  onClick={() => setJaarFilter(j)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    jaarFilter === j ? "bg-navy-700 text-white" : "text-gray-500 hover:text-navy-700"
                  }`}
                >
                  {j} ({aantalPerJaar[j]})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-50">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Totaal open</p>
            <p className="text-base font-bold text-navy-700">{euro(totaal)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Facturen</p>
            <p className="text-base font-bold text-navy-700">{aantal}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${urgent > 0 ? "bg-red-50" : "bg-gray-50"}`}>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">{">"} 90 dagen</p>
            <p className={`text-base font-bold ${urgent > 0 ? "text-red-600" : "text-navy-700"}`}>{urgent}</p>
          </div>
        </div>

        {/* Facturen lijst */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {verrijkt.length === 0 ? (
            facturen.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-6 text-center space-y-2">
                <p className="text-sm font-semibold text-amber-800">Factuurdetails nog niet geladen</p>
                <p className="text-xs text-amber-700">
                  De gecachete data bevat geen factuur-uitsplitsing. Klik <strong>Vernieuwen</strong> rechtsboven
                  (naast de jaartallen) om verse data uit Exact op te halen.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen facturen gevonden voor deze crediteur (filter op {accountCode ? `code ${accountCode}` : `naam "${crediteur}"`}).
              </p>
            )
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left font-medium pb-2">Factuurnr</th>
                  <th className="text-left font-medium pb-2">Omschrijving</th>
                  <th className="text-left font-medium pb-2">Factuurdatum</th>
                  <th className="text-left font-medium pb-2">Vervaldatum</th>
                  <th className="text-right font-medium pb-2">Status</th>
                  <th className="text-right font-medium pb-2">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {verrijkt.map((f, i) => {
                  const k = bucketKleur(f.daysOverdue);
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="py-2.5 font-medium text-navy-700">
                        <div className="flex items-center gap-2">
                          <span>{f.InvoiceNumber || f.YourRef || "—"}</span>
                          {f.jaar !== null && (
                            <span className="text-[9px] font-semibold bg-navy-700/10 text-navy-700 px-1.5 py-0.5 rounded">
                              {f.jaar}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-gray-600 truncate max-w-[200px]" title={f.Description}>
                        {f.Description || "—"}
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">{fmtDate(f.InvoiceDate)}</td>
                      <td className="py-2.5 text-gray-500 text-xs">{fmtDate(f.DueDate)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${k.bg} ${k.text}`}>
                          {f.daysOverdue >= 0 ? `${f.daysOverdue}d` : k.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-navy-700">
                        {euro(Math.abs(f.Amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold text-navy-700">
                  <td colSpan={5} className="pt-3 text-right text-sm">Totaal</td>
                  <td className="pt-3 text-right">{euro(totaal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

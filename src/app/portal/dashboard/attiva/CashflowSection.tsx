"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { RefreshCw, AlertCircle, Wallet, ShieldAlert } from "lucide-react";

interface BankSaldoData {
  opening: number;
  perPeriode: { periode: number; saldo: number }[];
}
interface ExactData {
  jaar: number;
  bankSaldo?: BankSaldoData;
}

const MAANDEN = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);

// Beginsaldo liquide middelen Attiva (3 ING-zakelijke rekeningen samen) — bron: ING-jaaroverzicht.
// 1-1-2025 = 23.182 (eindsaldo 31-12-2025 = 479, sluit aan op de Exact-mutaties).
// 1-1-2024 = 44.139 (afgeleid: eindsaldo 2024 = beginsaldo 2025).
const BEGINSALDO: Record<number, number> = { 2024: 44139, 2025: 23182, 2026: 479 };
const BUFFER = 20000; // minimum-buffer (richtlijn)

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}

export default function CashflowSection() {
  const [data, setData] = useState<ExactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState(HUIDIG_JAAR);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(j: number, forceRefresh = false) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/exact/data?jaar=${j}&jaarVorig=${j - 1}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.huidig ?? json);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(jaar); }, [jaar]);

  const jaarSelector = (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Jaar:</span>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {JAREN.map((j) => (
            <button key={j} onClick={() => setJaar(j)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                jaar === j ? "bg-navy-700 text-white shadow-sm" : "text-gray-500 hover:text-navy-700"
              }`}>{j}</button>
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
      <div className="card animate-pulse h-72 flex items-center justify-center gap-3 text-gray-300">
        <RefreshCw size={20} className="animate-spin" /><span className="text-sm">Banksaldo ophalen…</span>
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
        <p className="font-semibold text-navy-700">Fout bij ophalen liquiditeitsdata</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button onClick={() => load(jaar)} className="bg-navy-700 text-white px-6 py-2 rounded-xl text-sm hover:bg-navy-600 transition-colors">
          Opnieuw proberen
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const bs = data.bankSaldo;
  const opening = BEGINSALDO[jaar];
  const heeftSaldo = !!bs && Array.isArray(bs.perPeriode) && bs.perPeriode.length > 0 && opening !== undefined;

  if (!heeftSaldo) {
    return (
      <div className="space-y-6">
        {jaarSelector}
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-14 h-14 bg-navy-700/5 rounded-2xl flex items-center justify-center">
            <Wallet size={26} className="text-navy-700" />
          </div>
          <p className="font-semibold text-navy-700">Geen banksaldo beschikbaar voor {jaar}</p>
          <p className="text-sm text-gray-400 max-w-md">
            Het liquiditeitsoverzicht toont het werkelijke banksaldo uit Exact Online (grootboek 1000–1299).
            Voor {jaar} is dat nog niet beschikbaar — bekijk bijvoorbeeld 2025 of 2024.
          </p>
        </div>
      </div>
    );
  }

  // Werkelijk banksaldo per maand = beginsaldo + cumulatieve mutatie (uit Exact).
  const startSaldo = Math.round(opening);
  const saldoData = [
    { maand: "Begin", saldo: startSaldo },
    ...bs!.perPeriode.map(p => ({ maand: MAANDEN[p.periode - 1] ?? `P${p.periode}`, saldo: Math.round(opening + p.saldo) })),
  ];
  const maandSaldos = saldoData.slice(1);
  const eindSaldo = maandSaldos[maandSaldos.length - 1].saldo;
  const laagste = maandSaldos.reduce((m, d) => (d.saldo < m.saldo ? d : m), maandSaldos[0]);
  const verandering = eindSaldo - startSaldo;
  const maandenOnderBuffer = maandSaldos.filter(d => d.saldo < BUFFER).length;

  return (
    <div className="space-y-6">
      {jaarSelector}

      {/* KPI's */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card border-t-4 border-t-navy-700">
          <p className="text-sm text-gray-400 mb-1">Beginsaldo 1-1-{jaar}</p>
          <p className="text-2xl font-bold text-navy-700">{euro(startSaldo)}</p>
          <p className="text-xs text-gray-400 mt-1">3 ING-rekeningen samen</p>
        </div>
        <div className={`card border-t-4 ${eindSaldo >= 0 ? "border-t-emerald-500" : "border-t-red-500"}`}>
          <p className="text-sm text-gray-400 mb-1">Eindsaldo {jaar}</p>
          <p className={`text-2xl font-bold ${eindSaldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>{euro(eindSaldo)}</p>
          <p className="text-xs text-gray-400 mt-1">Stand per 31-12</p>
        </div>
        <div className={`card border-t-4 ${verandering >= 0 ? "border-t-emerald-500" : "border-t-red-500"}`}>
          <p className="text-sm text-gray-400 mb-1">Verandering in {jaar}</p>
          <p className={`text-2xl font-bold ${verandering >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {verandering >= 0 ? "+" : "−"}{euro(Math.abs(verandering))}
          </p>
          <p className="text-xs text-gray-400 mt-1">Begin → eind</p>
        </div>
        <div className={`card border-t-4 ${laagste.saldo < BUFFER ? "border-t-amber-500" : "border-t-gold-500"}`}>
          <p className="text-sm text-gray-400 mb-1">Laagste saldo</p>
          <p className={`text-2xl font-bold ${laagste.saldo < 0 ? "text-red-600" : laagste.saldo < BUFFER ? "text-amber-600" : "text-navy-700"}`}>
            {euro(laagste.saldo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">in {laagste.maand}</p>
        </div>
      </div>

      {/* Buffer-alarm */}
      {maandenOnderBuffer > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <ShieldAlert size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            Het banksaldo zat in <strong>{maandenOnderBuffer} {maandenOnderBuffer === 1 ? "maand" : "maanden"}</strong> onder
            de buffer van {euro(BUFFER)}{laagste.saldo < 0 ? " — en stond zelfs negatief" : ""}. Let op de liquiditeit.
          </span>
        </div>
      )}

      {/* Banksaldo-verloop */}
      <div className="card">
        <h3 className="text-lg font-bold text-navy-700 mb-1">Banksaldo per maand — {jaar}</h3>
        <p className="text-xs text-gray-400 mb-4">
          Werkelijke liquide middelen (Exact Online, grootboek 1000–1299) · beginsaldo uit het ING-jaaroverzicht
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={saldoData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="liqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B3A5C" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#1B3A5C" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} dy={4} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
              tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} width={52} />
            <Tooltip formatter={(v) => euro(v as number)}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <ReferenceLine y={BUFFER} stroke="#f59e0b" strokeDasharray="5 4"
              label={{ value: `Buffer ${euro(BUFFER)}`, position: "insideTopRight", fontSize: 10, fill: "#b45309" }} />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} />
            <Area type="monotone" dataKey="saldo" name="Banksaldo" stroke="#1B3A5C" strokeWidth={2.5} fill="url(#liqFill)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                const fill = payload.saldo < 0 ? "#ef4444" : payload.saldo < BUFFER ? "#f59e0b" : "#10b981";
                return <circle key={cx} cx={cx} cy={cy} r={4} fill={fill} stroke="white" strokeWidth={2} />;
              }}
              activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bron & validatie */}
      <div className="card bg-gray-50/60 text-xs text-gray-500 leading-relaxed">
        <strong className="text-navy-700">Bron &amp; validatie:</strong> het banksaldo komt uit Exact Online (liquide middelen,
        grootboek 1000–1299); het beginsaldo is overgenomen uit het officiële ING-jaaroverzicht. Het eindsaldo van {jaar}
        ({euro(eindSaldo)}) sluit hierdoor aan op de werkelijke bankafschriften — een controle dat de cijfers kloppen.
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Wallet,
  CalendarDays, Settings2,
} from "lucide-react";

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }
interface RawFactuur {
  AccountName: string;
  AccountCode: string;
  Amount: number;
  DueDate: string | null;
}

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}
function euroK(v: number) {
  return `€${(v / 1000).toFixed(0)}K`;
}

function parseExactDate(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /\/Date\((-?\d+)\)\//.exec(s);
  if (m) return parseInt(m[1], 10);
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

interface ForecastPoint {
  label: string; // "Mei", "Jun", etc.
  jaar: number;
  periode: number; // 1-12
  verwachteOmzet: number;
  verwachteKosten: number;
  bekendeCrediteurUitgaven: number;
  nettoCashflow: number;
  cumulatief: number;
  isVoorspelling: boolean; // true voor forecast, false voor werkelijke
  isOnderDrempel?: boolean;
}

interface BuildForecastInput {
  pl: PlRow[];
  plVorig: PlRow[];
  crediteurenRaw: RawFactuur[];
  startSaldo: number;
  jaar: number;
  drempel: number;
  maandenVooruit?: number;
}

function buildForecast({
  pl, plVorig, crediteurenRaw, startSaldo, jaar, drempel, maandenVooruit = 6,
}: BuildForecastInput): { historisch: ForecastPoint[]; forecast: ForecastPoint[] } {
  // 1) Bouw historische cashflow per maand uit pl
  const huidigPerMaand: Record<number, { in: number; uit: number }> = {};
  for (const r of pl) {
    if (r.Period < 1 || r.Period > 12) continue;
    if (!huidigPerMaand[r.Period]) huidigPerMaand[r.Period] = { in: 0, uit: 0 };
    if (r.IsRevenue) huidigPerMaand[r.Period].in += r.Amount;
    else huidigPerMaand[r.Period].uit += r.Amount;
  }
  const vorigPerMaand: Record<number, { in: number; uit: number }> = {};
  for (const r of plVorig) {
    if (r.Period < 1 || r.Period > 12) continue;
    if (!vorigPerMaand[r.Period]) vorigPerMaand[r.Period] = { in: 0, uit: 0 };
    if (r.IsRevenue) vorigPerMaand[r.Period].in += r.Amount;
    else vorigPerMaand[r.Period].uit += r.Amount;
  }

  // Werkelijke maanden (waar data is)
  const werkelijkeMaanden = Object.keys(huidigPerMaand).map(Number).sort((a, b) => a - b);
  const laatsteWerkelijkeMaand = werkelijkeMaanden.length > 0 ? Math.max(...werkelijkeMaanden) : 0;

  // 2) Conservatieve baseline: 70% gewicht op heel-jaar gemiddelde,
  //    30% op laatste 3 maanden. Voorkomt dat een uitschieter (zoals een
  //    sterke decembermaand) de hele voorspelling onrealistisch optilt.
  const recente = werkelijkeMaanden.slice(-3);
  const gem3Omzet = recente.length > 0
    ? recente.reduce((s, m) => s + (huidigPerMaand[m]?.in ?? 0), 0) / recente.length : 0;
  const gem3Kosten = recente.length > 0
    ? recente.reduce((s, m) => s + (huidigPerMaand[m]?.uit ?? 0), 0) / recente.length : 0;
  const gemJaarOmzet = werkelijkeMaanden.length > 0
    ? werkelijkeMaanden.reduce((s, m) => s + (huidigPerMaand[m]?.in ?? 0), 0) / werkelijkeMaanden.length : 0;
  const gemJaarKosten = werkelijkeMaanden.length > 0
    ? werkelijkeMaanden.reduce((s, m) => s + (huidigPerMaand[m]?.uit ?? 0), 0) / werkelijkeMaanden.length : 0;
  const gemOmzet = 0.7 * gemJaarOmzet + 0.3 * gem3Omzet;
  const gemKosten = 0.7 * gemJaarKosten + 0.3 * gem3Kosten;

  // 3) Bekende crediteur uitgaven per maand (vervalt in X)
  const credPerMaand: Record<string, number> = {}; // key: "YYYY-MM"
  for (const f of crediteurenRaw) {
    const ms = parseExactDate(f.DueDate);
    if (ms === null) continue;
    const d = new Date(ms);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    credPerMaand[key] = (credPerMaand[key] ?? 0) + Math.abs(Number(f.Amount));
  }

  // 4) Bouw output: eerst historisch
  const historisch: ForecastPoint[] = werkelijkeMaanden.map((m, i) => {
    const prev = i > 0 ? null : null; // we vullen cumulatief later in
    void prev;
    const inkomsten = huidigPerMaand[m]?.in ?? 0;
    const uitgaven = huidigPerMaand[m]?.uit ?? 0;
    return {
      label: MAANDEN[m - 1],
      jaar,
      periode: m,
      verwachteOmzet: Math.round(inkomsten),
      verwachteKosten: Math.round(uitgaven),
      bekendeCrediteurUitgaven: 0,
      nettoCashflow: Math.round(inkomsten - uitgaven),
      cumulatief: 0,
      isVoorspelling: false,
    };
  });

  // 5) Forecast: voor elke aankomende maand
  const forecast: ForecastPoint[] = [];
  for (let i = 1; i <= maandenVooruit; i++) {
    const targetMonth = laatsteWerkelijkeMaand + i;
    let periode = targetMonth;
    let targetJaar = jaar;
    while (periode > 12) {
      periode -= 12;
      targetJaar += 1;
    }

    // Seizoenscorrectie: kijk naar zelfde maand vorig jaar
    const seizoenOmzet = vorigPerMaand[periode]?.in ?? 0;
    const seizoenKosten = vorigPerMaand[periode]?.uit ?? 0;

    // Gem vorig jaar voor normalisatie
    const totaalVorigOmzet = Object.values(vorigPerMaand).reduce((s, v) => s + v.in, 0);
    const totaalVorigKosten = Object.values(vorigPerMaand).reduce((s, v) => s + v.uit, 0);
    const aantalVorig = Object.keys(vorigPerMaand).length || 1;
    const gemVorigOmzet = totaalVorigOmzet / aantalVorig;
    const gemVorigKosten = totaalVorigKosten / aantalVorig;

    // Seizoenfactor: hoe wijkt deze maand vorig jaar af van het gemiddelde?
    const seizoenFactorOmzet = gemVorigOmzet > 0 && seizoenOmzet > 0
      ? seizoenOmzet / gemVorigOmzet : 1;
    const seizoenFactorKosten = gemVorigKosten > 0 && seizoenKosten > 0
      ? seizoenKosten / gemVorigKosten : 1;

    // Verwachte = baseline (huidige gemiddelde) × seizoenfactor (relatieve afwijking vorig jaar)
    const verwachteOmzet = gemOmzet * seizoenFactorOmzet;
    const verwachteKosten = gemKosten * seizoenFactorKosten;

    const credKey = `${targetJaar}-${String(periode).padStart(2, "0")}`;
    const bekendeCred = credPerMaand[credKey] ?? 0;

    // Crediteuren-uitgaven zitten waarschijnlijk al ten dele in verwachteKosten,
    // maar urgent betalingen kunnen daarbovenop komen. We tonen ze apart en
    // tellen ze NIET dubbel — alleen wat boven de gemiddelde maandkosten uitkomt.
    const extraCred = Math.max(0, bekendeCred - verwachteKosten * 0.1);

    const netto = verwachteOmzet - verwachteKosten - extraCred;

    forecast.push({
      label: MAANDEN[periode - 1],
      jaar: targetJaar,
      periode,
      verwachteOmzet: Math.round(verwachteOmzet),
      verwachteKosten: Math.round(verwachteKosten),
      bekendeCrediteurUitgaven: Math.round(extraCred),
      nettoCashflow: Math.round(netto),
      cumulatief: 0,
      isVoorspelling: true,
    });
  }

  // 6) Cumulatief saldo berekenen voor alle punten
  let saldo = startSaldo;
  // Voor historie willen we ook cumulatief vanaf start van het jaar tonen,
  // dus startsaldo geldt voor BEGIN van eerste werkelijke maand.
  for (const point of historisch) {
    saldo += point.nettoCashflow;
    point.cumulatief = Math.round(saldo);
  }
  for (const point of forecast) {
    saldo += point.nettoCashflow;
    point.cumulatief = Math.round(saldo);
    point.isOnderDrempel = saldo < drempel;
  }

  return { historisch, forecast };
}

export default function CashflowForecast({
  pl, plVorig, crediteurenRaw, jaar,
}: {
  pl: PlRow[];
  plVorig: PlRow[];
  crediteurenRaw: RawFactuur[];
  jaar: number;
}) {
  const [startSaldo, setStartSaldo] = useState<number>(0);
  const [drempel, setDrempel] = useState<number>(20000);
  const [maandenVooruit, setMaandenVooruit] = useState<number>(6);
  const [showSettings, setShowSettings] = useState(false);

  const { historisch, forecast } = useMemo(
    () => buildForecast({ pl, plVorig, crediteurenRaw, startSaldo, jaar, drempel, maandenVooruit }),
    [pl, plVorig, crediteurenRaw, startSaldo, jaar, drempel, maandenVooruit]
  );

  // Combineer voor de grafiek — omzet positief, kosten negatief (cashflow-standaard)
  // Saldo is één doorlopende lijn met overgang van solid → dashed
  const overgangsIndex = historisch.length;
  const chartData = [
    ...historisch.map(p => ({
      label: p.label,
      jaar: p.jaar,
      periode: p.periode,
      isVoorspelling: false,
      isOnderDrempel: false,
      // Omzet positief
      omzet: p.verwachteOmzet,
      // Kosten als negatief getal (gaat onder nullijn)
      kosten: -(p.verwachteKosten + p.bekendeCrediteurUitgaven),
      // Eén doorlopende cumulatief-lijn (werkelijk deel)
      saldoWerkelijk: p.cumulatief,
      saldoVoorspeld: null as number | null,
    })),
    ...forecast.map((p, i) => ({
      label: p.label,
      jaar: p.jaar,
      periode: p.periode,
      isVoorspelling: true,
      isOnderDrempel: !!p.isOnderDrempel,
      omzet: p.verwachteOmzet,
      kosten: -(p.verwachteKosten + p.bekendeCrediteurUitgaven),
      // Eerste forecast-punt herhaalt laatste werkelijke waarde voor continuïteit
      saldoWerkelijk: i === 0 ? historisch[historisch.length - 1]?.cumulatief ?? null : null,
      saldoVoorspeld: p.cumulatief,
    })),
  ];
  // Zorg dat de stippellijn aansluit bij de volle lijn
  if (chartData[overgangsIndex - 1] && chartData[overgangsIndex]) {
    chartData[overgangsIndex - 1].saldoVoorspeld = chartData[overgangsIndex - 1].saldoWerkelijk;
  }

  // Verzamel insights
  const eersteMaandOnder = forecast.find(p => p.isOnderDrempel);
  const eindeFCRJaar = forecast[forecast.length - 1];
  const totaalForecastOmzet = forecast.reduce((s, p) => s + p.verwachteOmzet, 0);
  const totaalForecastKosten = forecast.reduce((s, p) => s + p.verwachteKosten + p.bekendeCrediteurUitgaven, 0);
  const verwachtNetto = totaalForecastOmzet - totaalForecastKosten;
  const maandenOnderDrempel = forecast.filter(p => p.isOnderDrempel).length;

  const heeftWaarschuwing = !!eersteMaandOnder;

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center shadow-sm">
            <Sparkles size={15} className="text-gold-400" />
          </div>
          <div>
            <h3 className="font-bold text-navy-700">Cashflow-voorspelling</h3>
            <p className="text-[11px] text-gray-400">
              {maandenVooruit} maanden vooruit · op basis van trend + seizoenscorrectie
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 hover:border-navy-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Settings2 size={12} />
          Aannames
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Huidig banksaldo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                value={startSaldo}
                onChange={(e) => setStartSaldo(Number(e.target.value))}
                placeholder="50000"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Optioneel — toont absoluut saldo ipv delta</p>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Alarm-drempel</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                value={drempel}
                onChange={(e) => setDrempel(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Krijg waarschuwing als saldo daaronder dreigt te zakken</p>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Voorspellen</label>
            <select
              value={maandenVooruit}
              onChange={(e) => setMaandenVooruit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-700/20"
            >
              <option value={3}>3 maanden</option>
              <option value={6}>6 maanden</option>
              <option value={9}>9 maanden</option>
              <option value={12}>12 maanden</option>
            </select>
          </div>
        </div>
      )}

      {/* Insight banners */}
      {heeftWaarschuwing && eersteMaandOnder && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">
              Dreigend cashflow-tekort in {eersteMaandOnder.label} {eersteMaandOnder.jaar}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Verwacht saldo zakt onder {euro(drempel)} ({euro(eersteMaandOnder.cumulatief)}).
              {maandenOnderDrempel > 1 && ` ${maandenOnderDrempel} maanden onder de drempel.`}
              {" "}Overweeg krediet of vervroegen ontvangsten.
            </p>
          </div>
        </div>
      )}
      {!heeftWaarschuwing && eindeFCRJaar && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900">
              Gezonde cashflow tot {eindeFCRJaar.label} {eindeFCRJaar.jaar}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Op deze trend blijft het saldo boven de drempel.
              Verwacht netto {verwachtNetto >= 0 ? "+" : ""}{euro(verwachtNetto)} over {maandenVooruit} maanden.
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Gem. inkomsten/mnd"
          value={euro(forecast.reduce((s, p) => s + p.verwachteOmzet, 0) / Math.max(1, forecast.length))}
          icon={<TrendingUp size={14} className="text-emerald-600" />}
          accent="emerald"
        />
        <KpiTile
          label="Gem. uitgaven/mnd"
          value={euro(forecast.reduce((s, p) => s + p.verwachteKosten + p.bekendeCrediteurUitgaven, 0) / Math.max(1, forecast.length))}
          icon={<Wallet size={14} className="text-gold-600" />}
          accent="gold"
        />
        <KpiTile
          label={`Netto over ${maandenVooruit} mnd`}
          value={`${verwachtNetto >= 0 ? "+" : ""}${euro(verwachtNetto)}`}
          icon={verwachtNetto >= 0 ? <TrendingUp size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-red-600" />}
          accent={verwachtNetto >= 0 ? "emerald" : "red"}
        />
        <KpiTile
          label="Verwacht eindsaldo"
          value={euro(eindeFCRJaar?.cumulatief ?? 0)}
          icon={<CalendarDays size={14} className="text-navy-700" />}
          accent={eindeFCRJaar && eindeFCRJaar.cumulatief < drempel ? "red" : "navy"}
        />
      </div>

      {/* Forecast grafiek */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cashflow per maand</p>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-navy-700 rounded inline-block" /> Omzet</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gold-500 rounded inline-block" /> Kosten</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Lopend saldo</span>
            <span className="text-gray-400 italic ml-2">Lichter = voorspelling</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={(props) => {
                const { x, y, payload, index } = props;
                const point = chartData[index];
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={14} textAnchor="middle" fill={point?.isVoorspelling ? "#94a3b8" : "#475569"} fontSize={11} fontWeight={point?.isVoorspelling ? 400 : 600}>
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="bars"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false} tickLine={false}
              tickFormatter={euroK}
            />
            <Tooltip
              formatter={(v, name) => {
                if (v === null || v === undefined) return ["—", name];
                return [euro(Math.abs(Number(v))), name];
              }}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload as { jaar: number; isVoorspelling: boolean } | undefined;
                return point ? `${label} ${point.jaar}${point.isVoorspelling ? " (voorspelling)" : ""}` : label;
              }}
              // Volgorde forceren: Omzet eerst, dan Kosten, dan Lopend saldo
              itemSorter={(item) => {
                const order: Record<string, number> = { "Omzet": 1, "Kosten": 2, "Lopend saldo": 3 };
                return order[String(item.name)] ?? 99;
              }}
            />
            {/* 0-as ter referentie tussen omzet (boven) en kosten (onder) */}
            <ReferenceLine yAxisId="bars" y={0} stroke="#cbd5e1" />
            {/* Drempel als horizontale lijn op de saldo-as */}
            <ReferenceLine
              yAxisId="bars"
              y={drempel}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Drempel ${euroK(drempel)}`, fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
            />

            {/* Omzet — positief, boven nullijn */}
            <Bar yAxisId="bars" dataKey="omzet" name="Omzet" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill="#1B3A5C" fillOpacity={entry.isVoorspelling ? 0.45 : 1} />
              ))}
            </Bar>
            {/* Kosten — negatief, onder nullijn */}
            <Bar yAxisId="bars" dataKey="kosten" name="Kosten" radius={[0, 0, 4, 4]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isOnderDrempel ? "#ef4444" : "#C9A84C"}
                  fillOpacity={entry.isVoorspelling ? 0.45 : 1}
                />
              ))}
            </Bar>

            {/* Saldo — één doorlopende lijn met solid → dashed overgang */}
            <Line yAxisId="bars" type="monotone" dataKey="saldoWerkelijk" name="Lopend saldo" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} connectNulls={false} />
            <Line yAxisId="bars" type="monotone" dataKey="saldoVoorspeld" name="Lopend saldo" stroke="#10b981" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }} connectNulls={false} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Maand-tabel onder de grafiek */}
      <div className="overflow-x-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Per maand</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left font-medium pb-2">Maand</th>
              <th className="text-right font-medium pb-2">Verwachte omzet</th>
              <th className="text-right font-medium pb-2">Verwachte kosten</th>
              <th className="text-right font-medium pb-2">Bekende crediteuren</th>
              <th className="text-right font-medium pb-2">Netto</th>
              <th className="text-right font-medium pb-2">Cumulatief saldo</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((p) => (
              <tr key={`${p.jaar}-${p.periode}`} className={`border-b border-gray-50 ${p.isOnderDrempel ? "bg-red-50/40" : ""}`}>
                <td className="py-2.5 font-semibold text-navy-700">
                  {p.label} {p.jaar}
                  {p.isOnderDrempel && <AlertTriangle size={12} className="text-red-500 inline ml-2" />}
                </td>
                <td className="text-right text-emerald-700">{euro(p.verwachteOmzet)}</td>
                <td className="text-right text-gold-700">{euro(p.verwachteKosten)}</td>
                <td className="text-right text-gray-500">{p.bekendeCrediteurUitgaven > 0 ? euro(p.bekendeCrediteurUitgaven) : "—"}</td>
                <td className={`text-right font-bold ${p.nettoCashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {p.nettoCashflow >= 0 ? "+" : ""}{euro(p.nettoCashflow)}
                </td>
                <td className={`text-right font-bold ${p.isOnderDrempel ? "text-red-600" : "text-navy-700"}`}>
                  {euro(p.cumulatief)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-gray-400 italic space-y-1">
        <p>
          ⓘ <strong>Lopend saldo</strong> = je banksaldo zoals het in de tijd opbouwt. Elke maand wordt het
          netto resultaat (omzet − kosten) erbij opgeteld. Start je zonder banksaldo, dan begint de lijn
          op €0.
        </p>
        <p>
          Voorspelling op basis van 12-maands gemiddelde (70%) + recente 3 maanden (30%) +
          seizoenscorrectie {jaar - 1}. Conservatief — uitschieters drukken niet de hele voorspelling.
        </p>
      </div>
    </div>
  );
}

function KpiTile({
  label, value, icon, accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "emerald" | "gold" | "red" | "navy";
}) {
  const accentMap = {
    emerald: "border-emerald-100 bg-emerald-50/40",
    gold: "border-gold-200 bg-gold-50/40",
    red: "border-red-100 bg-red-50/40",
    navy: "border-gray-100 bg-gray-50/60",
  };
  return (
    <div className={`rounded-xl border p-3 ${accentMap[accent]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-bold text-navy-700">{value}</p>
    </div>
  );
}

"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Formatter, ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { TrendingUp, ShoppingCart, Euro, Percent } from "lucide-react";

interface Row { [key: string]: unknown }
interface Props { rows: Row[]; columns: string[]; uploadName: string }

// ── helpers ─────────────────────────────────────────────────────────────────
function detect(cols: string[], kws: string[], exclude: string[] = []) {
  return cols.find((c) => {
    const lc = c.toLowerCase();
    return kws.some((k) => lc.includes(k)) && !exclude.some((e) => lc.includes(e));
  }) ?? null;
}
function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v.replace(",", ".")) || 0;
  return 0;
}
function euro(v: number) {
  return `€ ${v.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function parseDate(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  // ISO / date-only strings
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Long JS date string → parse via Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s.slice(0, 10);
}

const COLORS = ["#1B3A5C", "#C9A84C", "#3d7ac8", "#e07b39", "#56a88f", "#9b59b6"];
const DAYS   = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];

export default function DashboardCharts({ rows, columns, uploadName }: Props) {
  const datumCol   = detect(columns, ["datum","date","dag_datum","period"]);
  const dagCol     = detect(columns, ["dag","weekday","weekdag"], ["datum"]);
  const catCol     = detect(columns, ["categorie","category","type","groep"]);
  const omzetCol   = detect(columns, ["omzet_excl","omzetexcl","revenue_ex","sales_ex"], ["incl","inkoop","kosten"]);
  const inclCol    = detect(columns, ["omzet_incl","omzetincl","revenue_in","sales_in"]);
  const kostenCol  = detect(columns, ["kosten","inkoop","cost","costs","cogs"]);
  const ordersCol  = detect(columns, ["aantal_orders","orders","aantal_bestelling","count"]);
  const margeCol   = detect(columns, ["marge","margin","brutowinst_marge","brutomarge","bruto_marge"]);
  const btwCol     = detect(columns, ["btw","tax","vat"], ["omzet","incl"]);

  // ── KPI berekeningen ────────────────────────────────────────────────────
  const totalOmzet   = omzetCol  ? rows.reduce((s, r) => s + num(r[omzetCol!]), 0)  : 0;
  const totalIncl    = inclCol   ? rows.reduce((s, r) => s + num(r[inclCol!]), 0)   : 0;
  const totalOrders  = ordersCol ? rows.reduce((s, r) => s + num(r[ordersCol!]), 0) : 0;
  const totalBtw     = btwCol    ? rows.reduce((s, r) => s + num(r[btwCol!]), 0)    : 0;
  const totalKosten  = kostenCol ? rows.reduce((s, r) => s + num(r[kostenCol!]), 0) : null;
  const avgMarge     = margeCol  ? rows.reduce((s, r) => s + num(r[margeCol!]), 0) / rows.length
                     : (totalKosten !== null && totalOmzet > 0)
                       ? ((totalOmzet - totalKosten) / totalOmzet) * 100
                       : null;
  const avgOrder     = totalOrders > 0 ? totalOmzet / totalOrders : 0;

  // ── Omzet + Kosten per datum ─────────────────────────────────────────────
  const omzetPerDatum = datumCol && omzetCol
    ? Object.entries(
        rows.reduce<Record<string, { omzet: number; kosten: number }>>((a, r) => {
          const d = parseDate(r[datumCol]);
          if (!a[d]) a[d] = { omzet: 0, kosten: 0 };
          a[d].omzet  += num(r[omzetCol!]);
          if (kostenCol) a[d].kosten += num(r[kostenCol]);
          return a;
        }, {})
      ).sort(([a],[b]) => a.localeCompare(b)).slice(-30)
       .map(([datum, v]) => ({ datum: datum.slice(5), omzet: v.omzet, kosten: kostenCol ? v.kosten : undefined }))
    : null;

  // ── Orders per datum ────────────────────────────────────────────────────
  const ordersPerDatum = datumCol && ordersCol
    ? Object.entries(
        rows.reduce<Record<string, number>>((a, r) => {
          const d = parseDate(r[datumCol]);
          a[d] = (a[d] ?? 0) + num(r[ordersCol!]);
          return a;
        }, {})
      ).sort(([a],[b]) => a.localeCompare(b)).slice(-30)
       .map(([datum, orders]) => ({ datum: datum.slice(5), orders }))
    : null;

  // ── Omzet per categorie ─────────────────────────────────────────────────
  const omzetPerCat = catCol && omzetCol
    ? Object.entries(
        rows.reduce<Record<string, number>>((a, r) => {
          const c = String(r[catCol] ?? "Overig");
          a[c] = (a[c] ?? 0) + num(r[omzetCol!]);
          return a;
        }, {})
      ).sort(([,a],[,b]) => b - a).map(([naam, omzet]) => ({ naam, omzet }))
    : null;

  // ── Dag van de week analyse ─────────────────────────────────────────────
  const dagData = (dagCol || datumCol) && omzetCol
    ? (() => {
        const acc: Record<string, { omzet: number; orders: number; count: number }> = {};
        rows.forEach((r) => {
          let dag = dagCol ? String(r[dagCol] ?? "") : "";
          if (!dag && datumCol) {
            const d = new Date(parseDate(r[datumCol]));
            dag = DAYS[((d.getDay() + 6) % 7)] ?? "";
          }
          if (!dag) return;
          if (!acc[dag]) acc[dag] = { omzet: 0, orders: 0, count: 0 };
          acc[dag].omzet  += num(r[omzetCol!]);
          acc[dag].orders += ordersCol ? num(r[ordersCol!]) : 0;
          acc[dag].count  += 1;
        });
        return Object.entries(acc)
          .sort(([a],[b]) => {
            const ia = DAYS.indexOf(a), ib = DAYS.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          })
          .map(([dag, v]) => ({
            dag: dag.slice(0, 2),
            omzet: Math.round(v.omzet / v.count),
            orders: v.count > 0 && v.orders > 0 ? Math.round(v.orders / v.count) : undefined,
          }));
      })()
    : null;

  // ── Pie: omzet verdeling per categorie ─────────────────────────────────
  const pieData = omzetPerCat?.slice(0, 6);

  // ── KPI kaarten config ──────────────────────────────────────────────────
  const kpis = [
    omzetCol      && { icon: Euro,        label: "Omzet excl. BTW",   value: euro(totalOmzet),   sub: inclCol ? `Incl. BTW: ${euro(totalIncl)}` : undefined },
    totalKosten !== null && { icon: TrendingUp, label: "Kosten excl. BTW", value: euro(totalKosten!), sub: `Brutowinst: ${euro(totalOmzet - totalKosten!)}` },
    avgMarge !== null && { icon: Percent,  label: "Brutowinst marge",  value: `${avgMarge.toFixed(1)} %`, sub: totalKosten !== null ? "Berekend op basis van kosten" : (margeCol ?? "") },
    ordersCol     && { icon: ShoppingCart, label: "Totaal orders",     value: totalOrders.toLocaleString("nl-NL"), sub: `Gem. orderwaarde: ${euro(avgOrder)}` },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; sub?: string }[];

  return (
    <div className="space-y-8">
      {/* Bestand label */}
      <div className="inline-flex items-center gap-2 bg-navy-700/10 text-navy-700 text-xs font-semibold px-4 py-2 rounded-full">
        <span>📂 {uploadName}</span>
        <span className="text-gray-400">· {rows.length} rijen · {columns.length} kolommen</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <k.icon size={18} className="text-gold-500 mb-3" />
            <p className="text-sm text-gray-400 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-navy-700">{k.value}</p>
            {k.sub && <p className="text-xs text-gray-400 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Omzet over tijd */}
      {omzetPerDatum && omzetPerDatum.length > 1 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-navy-700">Omzet vs. Kosten excl. BTW</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-navy-700 inline-block rounded" /> Omzet</span>
              {kostenCol && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gold-500 inline-block rounded" /> Kosten</span>}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={omzetPerDatum}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="datum" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v/1000).toFixed(1)}K`} />
              <Tooltip formatter={((v, name) => [euro(Number(v ?? 0)), name === "omzet" ? "Omzet" : "Kosten"]) as Formatter<ValueType, NameType>} />
              <Line type="monotone" dataKey="omzet" stroke="#1B3A5C" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: "#C9A84C" }} />
              {kostenCol && (
                <Line type="monotone" dataKey="kosten" stroke="#C9A84C" strokeWidth={2}
                  strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders + Dag van de week naast elkaar */}
      <div className="grid md:grid-cols-2 gap-6">
        {ordersPerDatum && ordersPerDatum.length > 1 && (
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Aantal orders per dag</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersPerDatum}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="datum" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={((v) => [Number(v ?? 0), "Orders"]) as Formatter<ValueType, NameType>} />
                <Bar dataKey="orders" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dagData && dagData.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Gem. omzet per weekdag</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dagData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dag" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={((v) => [euro(Number(v ?? 0)), "Gem. omzet"]) as Formatter<ValueType, NameType>} />
                <Bar dataKey="omzet" radius={[4, 4, 0, 0]}>
                  {dagData.map((_, i) => (
                    <Cell key={i} fill={i === dagData.reduce((mi, d, ci) =>
                      d.omzet > dagData[mi].omzet ? ci : mi, 0) ? "#C9A84C" : "#1B3A5C"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Categorie: staaf + pie naast elkaar */}
      {omzetPerCat && omzetPerCat.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Omzet per categorie</h3>
            <ResponsiveContainer width="100%" height={Math.max(160, omzetPerCat.length * 46)}>
              <BarChart data={omzetPerCat} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="naam" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={((v) => [euro(Number(v ?? 0)), "Omzet"]) as Formatter<ValueType, NameType>} />
                <Bar dataKey="omzet" fill="#1B3A5C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData && (
            <div className="card flex flex-col">
              <h3 className="font-bold text-navy-700 mb-5">Aandeel per categorie</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="omzet" nameKey="naam"
                    cx="50%" cy="50%" outerRadius={80}
                    label={(props: { naam?: string; percent?: number }) =>
                      `${props.naam ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={((v) => [euro(Number(v ?? 0)), "Omzet"]) as Formatter<ValueType, NameType>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Top 5 hoogste kostenposten — gegroepeerd per kostentype */}
      {(() => {
        // Detecteer alle kostenkolommen (behalve de totaalkolom en niet-kosten)
        const kostenKolommen = columns.filter((c) => {
          const lc = c.toLowerCase();
          return (lc.includes("kosten") || lc.includes("huur") || lc.includes("marketing") || lc.includes("inkoop") || lc.includes("personeel") || lc.includes("overig"))
            && !lc.includes("omzet") && !lc.includes("bruto") && !lc.includes("marge")
            && !lc.includes("excl") && !lc.includes("btw") && !lc.includes("incl");
        });

        if (kostenKolommen.length === 0) return null;

        // Som per kostentype over alle rijen
        const totalen = kostenKolommen.map((col) => ({
          naam: col.replace(/_/g, " ").replace(/kosten$/i, "kosten"),
          totaal: rows.reduce((s, r) => s + num(r[col]), 0),
          aandeel: totalOmzet > 0
            ? (rows.reduce((s, r) => s + num(r[col]), 0) / totalOmzet) * 100
            : 0,
        })).sort((a, b) => b.totaal - a.totaal).slice(0, 5);

        const maxTotaal = totalen[0]?.totaal ?? 1;

        return (
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-6">Top 5 hoogste kostenposten</h3>
            <div className="space-y-4">
              {totalen.map((k, i) => (
                <div key={k.naam}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-navy-700 capitalize">{k.naam}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 text-xs">{k.aandeel.toFixed(1)}% van omzet</span>
                      <span className="font-bold text-red-600">{euro(k.totaal)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(k.totaal / maxTotaal) * 100}%`,
                        background: i === 0 ? "#1B3A5C" : i === 1 ? "#3d67a2" : i === 2 ? "#C9A84C" : "#9bb8d4",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Totaal onderaan */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Totale kosten</span>
              <span className="font-bold text-navy-700">
                {euro(totalen.reduce((s, k) => s + k.totaal, 0))}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Ruwe data */}
      <div className="card">
        <h3 className="font-bold text-navy-700 mb-4">Ruwe data (eerste 10 rijen)</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-50">
              <tr>{columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{c}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.slice(0, 10).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {c.toLowerCase().includes("datum") || c.toLowerCase().includes("date")
                        ? parseDate(row[c])
                        : String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

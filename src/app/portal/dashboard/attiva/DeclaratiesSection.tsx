"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, AlertCircle, Users, Wallet, Heart } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";
import DownloadPDFButton from "@/components/portal/DownloadPDFButton";

interface DeclaratieData {
  totaal: number;
  perMaand: { maand: string; bedrag: number }[];
  perSoort: { soort: string; bedrag: number }[];
  perPersoon: { naam: string; bedrag: number }[];
}

function euro(v: number) {
  return `€ ${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

const MAANDEN_NL: Record<string, string> = {
  "01":"Jan","02":"Feb","03":"Mrt","04":"Apr","05":"Mei","06":"Jun",
  "07":"Jul","08":"Aug","09":"Sep","10":"Okt","11":"Nov","12":"Dec",
};

const SOORT_COLORS: Record<string, string> = {
  "Geleverde zorg": "#1B3A5C",
  "Maandloon": "#C9A84C",
};

const AVATAR_COLORS = [
  "#1B3A5C","#264D73","#3B6EA5","#C9A84C","#D4A843",
  "#4A7FB5","#0F2A45","#E8B84B","#B8962E","#F0C75A",
];

const HUIDIG_JAAR = new Date().getFullYear();
const JAREN = Array.from({ length: HUIDIG_JAAR - 2023 }, (_, i) => 2024 + i);

function initials(naam: string) {
  return naam.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default function DeclaratiesSection() {
  const [data, setData] = useState<DeclaratieData | null>(null);
  const [vorigData, setVorigData] = useState<DeclaratieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jaar, setJaar] = useState<number>(HUIDIG_JAAR);

  async function load(j: number) {
    setLoading(true);
    setError(null);
    try {
      const [res, resVorig] = await Promise.all([
        fetch(`/api/attiva/declaraties?jaar=${j}`),
        fetch(`/api/attiva/declaraties?jaar=${j - 1}`),
      ]);
      if (!res.ok) throw new Error(await res.text());
      const [d, dv] = await Promise.all([res.json(), resVorig.ok ? resVorig.json() : null]);
      setData(d);
      setVorigData(dv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(jaar); }, [jaar]);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
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
      <div className="flex items-center gap-2">
        <button onClick={() => load(jaar)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw size={12} /> Vernieuwen
        </button>
        <DownloadPDFButton
          targetId="attiva-declaraties-export"
          filename={`Attiva-Zorg-Declaraties-${jaar}`}
          label="PDF"
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-5">
      {header}
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => <div key={i} className="card animate-pulse h-24" />)}
      </div>
      <div className="card animate-pulse h-56" />
    </div>
  );

  if (error) return (
    <div className="space-y-5">
      {header}
      <div className="card flex items-center gap-3 py-8 justify-center">
        <AlertCircle size={20} className="text-red-400" />
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    </div>
  );

  if (!data || data.perMaand.length === 0) return (
    <div className="space-y-5">
      {header}
      <div className="card text-center py-12 text-gray-400 text-sm">Geen declaratiedata voor {jaar}.</div>
    </div>
  );

  const maandGrafiek = data.perMaand.map(r => ({
    maand: MAANDEN_NL[r.maand.slice(5, 7)] ?? r.maand,
    ...Object.fromEntries(
      data.perSoort.map(s => [s.soort, 0])
    ),
    bedrag: r.bedrag,
  }));

  const zorgItem = data.perSoort.find(s => s.soort === "Geleverde zorg");
  const loonItem = data.perSoort.find(s => s.soort === "Maandloon");
  const maxBedrag = data.perPersoon[0]?.bedrag ?? 1;

  const vorigZorg = vorigData?.perSoort.find(s => s.soort === "Geleverde zorg");
  const vorigLoon = vorigData?.perSoort.find(s => s.soort === "Maandloon");

  const chatContext = [
    `Declaratieoverzicht Attiva Zorg — jaar ${jaar}:`,
    `- Totaal uitbetaald: ${euro(data.totaal)}${vorigData ? ` (vorig jaar ${jaar-1}: ${euro(vorigData.totaal)})` : ""}`,
    `- Geleverde zorg: ${euro(zorgItem?.bedrag ?? 0)}${vorigZorg ? ` (vorig jaar: ${euro(vorigZorg.bedrag)})` : ""}`,
    `- Maandloon: ${euro(loonItem?.bedrag ?? 0)}${vorigLoon ? ` (vorig jaar: ${euro(vorigLoon.bedrag)})` : ""}`,
    `- Aantal cliënten/budgethouders: ${data.perPersoon.length}`,
    ``,
    `Uitbetaald per cliënt (${jaar}):`,
    ...data.perPersoon.map(p => `- ${p.naam}: ${euro(p.bedrag)} (${data.totaal > 0 ? ((p.bedrag/data.totaal)*100).toFixed(1) : 0}%)`),
    ``,
    `Uitbetaald per maand (${jaar}):`,
    ...data.perMaand.map(m => `- ${MAANDEN_NL[m.maand.slice(5,7)] ?? m.maand}: ${euro(m.bedrag)}`),
    ...(vorigData ? [
      ``,
      `Uitbetaald per maand (${jaar - 1}):`,
      ...vorigData.perMaand.map(m => `- ${MAANDEN_NL[m.maand.slice(5,7)] ?? m.maand}: ${euro(m.bedrag)}`),
      ``,
      `Cliënten vorig jaar (${jaar - 1}):`,
      ...vorigData.perPersoon.map(p => `- ${p.naam}: ${euro(p.bedrag)}`),
    ] : []),
  ].join("\n");

  return (
    <div className="space-y-6">
      {header}

      <div id="attiva-declaraties-export" className="space-y-6 bg-white">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card border-t-4 border-t-navy-700">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
              <Wallet size={16} className="text-navy-700" />
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{jaar}</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Totaal uitbetaald</p>
          <p className="text-2xl font-bold text-navy-700">{euro(data.totaal)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.perPersoon.length} budgethouders</p>
        </div>

        <div className="card border-t-4 border-t-[#1B3A5C]">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-navy-700/10 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-navy-700" />
            </div>
            {zorgItem && data.totaal > 0 && (
              <span className="text-xs font-semibold text-navy-700 bg-navy-700/8 px-2 py-1 rounded-lg">
                {((zorgItem.bedrag / data.totaal) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Geleverde zorg</p>
          <p className="text-2xl font-bold text-navy-700">{euro(zorgItem?.bedrag ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Incl. reiskosten</p>
        </div>

        <div className="card border-t-4 border-t-gold-500">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
              <Users size={16} className="text-gold-500" />
            </div>
            {loonItem && data.totaal > 0 && (
              <span className="text-xs font-semibold text-gold-500 bg-gold-500/10 px-2 py-1 rounded-lg">
                {((loonItem.bedrag / data.totaal) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Maandloon</p>
          <p className="text-2xl font-bold text-navy-700">{euro(loonItem?.bedrag ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Vaste loonkosten</p>
        </div>
      </div>

      {/* Maand grafiek + donut */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-2">
          <h3 className="font-bold text-navy-700 mb-5">Uitbetalingen per maand — {jaar}</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={maandGrafiek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="bedrag" name="Uitbetaald" fill="#1B3A5C" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col justify-between">
          <h3 className="font-bold text-navy-700 mb-2">Verdeling</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={data.perSoort} dataKey="bedrag" nameKey="soort" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                {data.perSoort.map((s) => (
                  <Cell key={s.soort} fill={SOORT_COLORS[s.soort] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {data.perSoort.map((s) => (
              <div key={s.soort} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SOORT_COLORS[s.soort] ?? "#94a3b8" }} />
                <span className="text-sm text-gray-600 flex-1">{s.soort}</span>
                <span className="text-sm font-bold text-navy-700">{euro(s.bedrag)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientenoverzicht */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-navy-700">Clientenoverzicht</h3>
            <p className="text-xs text-gray-400 mt-0.5">Uitbetaald per budgethouder — {jaar}</p>
          </div>
          <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
            {data.perPersoon.length} cliënten
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          {data.perPersoon.map((p, i) => (
            <div key={p.naam} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {initials(p.naam)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-navy-700 truncate">{p.naam}</span>
                  <span className="text-sm font-bold text-navy-700 ml-2 flex-shrink-0">{euro(p.bedrag)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(p.bedrag / maxBedrag) * 100}%`,
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {data.totaal > 0 ? `${((p.bedrag / data.totaal) * 100).toFixed(1)}% van totaal` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jaarvergelijking */}
      {vorigData && vorigData.perMaand.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {/* Per maand */}
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Uitbetaald per maand — {jaar - 1} vs {jaar}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const vorigMap = Object.fromEntries(vorigData.perMaand.map(r => [MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand, r.bedrag]));
                return data.perMaand.map(r => {
                  const m = MAANDEN_NL[r.maand.slice(5,7)] ?? r.maand;
                  return { maand: m, [jaar]: r.bedrag, [jaar - 1]: vorigMap[m] ?? 0 };
                });
              })()} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey={jaar - 1} name={`${jaar - 1}`} fill="#cbd5e1" radius={[4,4,0,0]} />
                <Bar dataKey={jaar} name={`${jaar}`} fill="#1B3A5C" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per soort vergelijking */}
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-5">Soort vergelijking — {jaar - 1} vs {jaar}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const soorten = ["Maandloon", "Geleverde zorg"];
                return soorten.map(s => ({
                  soort: s,
                  [jaar - 1]: vorigData.perSoort.find(r => r.soort === s)?.bedrag ?? 0,
                  [jaar]: data.perSoort.find(r => r.soort === s)?.bedrag ?? 0,
                }));
              })()} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="soort" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => euro(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey={jaar - 1} name={`${jaar - 1}`} fill="#cbd5e1" radius={[4,4,0,0]} />
                <Bar dataKey={jaar} name={`${jaar}`} fill="#1B3A5C" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      </div>

      <DashboardChat context={chatContext} />
    </div>
  );
}

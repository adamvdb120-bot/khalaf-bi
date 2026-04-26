"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { Euro, Users, TrendingUp, Heart } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import DashboardChat from "@/components/portal/DashboardChat";

// ── Hardcoded Ramadan 2026 data ───────────────────────────────────────────────
const leveranciers = [
  { naam: "Emin Food Cash en Carry", bedrag: 10623.68 },
  { naam: "Salaris", bedrag: 10000 },
  { naam: "RAE Trading BV", bedrag: 5274.49 },
  { naam: "Afval", bedrag: 2457.38 },
  { naam: "Threestarr", bedrag: 2805.38 },
  { naam: "jawda", bedrag: 2060.61 },
  { naam: "Lidl", bedrag: 1616.65 },
  { naam: "Heman", bedrag: 1393.01 },
  { naam: "Onvoorziene kosten", bedrag: 1000 },
  { naam: "Makro", bedrag: 700.78 },
  { naam: "Banketbakkerij", bedrag: 585 },
  { naam: "Master Car Rent", bedrag: 447 },
  { naam: "Schoonmaak Tapijt", bedrag: 400 },
  { naam: "Heijman Schoonmaak", bedrag: 338.23 },
  { naam: "Sanvir Groenten", bedrag: 316.56 },
  { naam: "Tango", bedrag: 291.15 },
  { naam: "Hooyo Kitchen", bedrag: 220 },
  { naam: "Action", bedrag: 63.11 },
  { naam: "AH", bedrag: 75.76 },
  { naam: "Kruidvat", bedrag: 166.5 },
  { naam: "Jumbo", bedrag: 839.19 },
  { naam: "Media Markt", bedrag: 66.99 },
  { naam: "Autokosten", bedrag: 154.2 },
  { naam: "Ikea", bedrag: 57.91 },
  { naam: "Hornbach", bedrag: 68.8 },
  { naam: "AGF Overtoom", bedrag: 266.6 },
  { naam: "ABC", bedrag: 84 },
  { naam: "Aldi", bedrag: 174.64 },
  { naam: "Suhoor", bedrag: 29.94 },
  { naam: "Hanos", bedrag: 24.08 },
  { naam: "Overig kosten", bedrag: 32.5 },
].sort((a, b) => b.bedrag - a.bedrag);

const bezoekers = [
  { datum: "18 feb", mannen: 210, vrouwen: 50 },
  { datum: "19 feb", mannen: 240, vrouwen: 40 },
  { datum: "20 feb", mannen: 285, vrouwen: 70 },
  { datum: "21 feb", mannen: 300, vrouwen: 105 },
  { datum: "22 feb", mannen: 290, vrouwen: 95 },
  { datum: "23 feb", mannen: 276, vrouwen: 116 },
  { datum: "24 feb", mannen: 275, vrouwen: 80 },
  { datum: "25 feb", mannen: 250, vrouwen: 45 },
  { datum: "26 feb", mannen: 280, vrouwen: 165 },
  { datum: "27 feb", mannen: 275, vrouwen: 65 },
  { datum: "28 feb", mannen: 282, vrouwen: 175 },
  { datum: "1 mrt",  mannen: 270, vrouwen: 75 },
  { datum: "2 mrt",  mannen: 226, vrouwen: 56 },
  { datum: "3 mrt",  mannen: 214, vrouwen: 55 },
  { datum: "4 mrt",  mannen: 217, vrouwen: 45 },
  { datum: "5 mrt",  mannen: 226, vrouwen: 75 },
  { datum: "6 mrt",  mannen: 272, vrouwen: 70 },
  { datum: "7 mrt",  mannen: 275, vrouwen: 101 },
  { datum: "8 mrt",  mannen: 251, vrouwen: 70 },
  { datum: "9 mrt",  mannen: 240, vrouwen: 60 },
  { datum: "10 mrt", mannen: 221, vrouwen: 60 },
  { datum: "11 mrt", mannen: 225, vrouwen: 70 },
  { datum: "12 mrt", mannen: 260, vrouwen: 75 },
  { datum: "13 mrt", mannen: 285, vrouwen: 105 },
  { datum: "14 mrt", mannen: 290, vrouwen: 80 },
  { datum: "15 mrt", mannen: 295, vrouwen: 135 },
  { datum: "16 mrt", mannen: 230, vrouwen: 65 },
  { datum: "17 mrt", mannen: 245, vrouwen: 65 },
  { datum: "18 mrt", mannen: 275, vrouwen: 67 },
  { datum: "19 mrt", mannen: 225, vrouwen: 50 },
];

const totaleKosten = leveranciers.reduce((s, l) => s + l.bedrag, 0);
const totaleBezoekers = bezoekers.reduce((s, d) => s + d.mannen + d.vrouwen, 0);

function euro(v: number) {
  return `€ ${v.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
      <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function MarkazQubaDashboard() {
  const top10 = leveranciers.slice(0, 10);
  const maxBedrag = top10[0]?.bedrag ?? 1;

  return (
    <div className="space-y-8">
      <Link href="/portal/admin" className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors">
        <ChevronLeft size={16} /> Terug naar klantenbeheer
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/quba.svg" alt="Markaz Quba" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Markaz Quba</h1>
          <p className="text-gray-400 text-sm">Islamitisch Centrum Quba — Ramadan 2026 overzicht</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: Euro,     label: "Totale kosten",       value: euro(totaleKosten),      sub: "Ramadan 2026" },
          { icon: Users,    label: "Totale bezoekers",    value: totaleBezoekers.toLocaleString("nl-NL"), sub: "30 iftaravonden" },
          { icon: Heart,    label: "Iftar ingezameld",    value: euro(43500),             sub: `Doel: ${euro(45000)}` },
          { icon: TrendingUp,label:"Project Quba",        value: euro(64258),             sub: `Doel: ${euro(100000)}` },
        ].map((k) => (
          <div key={k.label} className="card">
            <k.icon size={18} className="text-gold-500 mb-3" />
            <p className="text-sm text-gray-400 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-navy-700">{k.value}</p>
            {k.sub && <p className="text-xs text-gray-400 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Inzameling progress cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="card">
          <h3 className="font-bold text-navy-700 mb-1">Iftar Inzameling</h3>
          <p className="text-xs text-gray-400 mb-3">Ramadan 2026</p>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-navy-700">{euro(43500)} ingezameld</span>
            <span className="text-gray-400">{euro(45000)} doel</span>
          </div>
          <ProgressBar value={43500} max={45000} color="#C9A84C" />
          <p className="text-xs text-gray-400 mt-2">96.7% — nog {euro(1500)} te gaan</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-navy-700 mb-1">Project Quba</h3>
          <p className="text-xs text-gray-400 mb-3">Renovatiefonds</p>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-navy-700">{euro(64258)} ingezameld</span>
            <span className="text-gray-400">{euro(100000)} doel</span>
          </div>
          <ProgressBar value={64258} max={100000} color="#1B3A5C" />
          <p className="text-xs text-gray-400 mt-2">64.3% — nog {euro(35742)} te gaan</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-navy-700 mb-1">Dawah Dragers</h3>
          <p className="text-xs text-gray-400 mb-3">Vrijwilligers</p>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-navy-700">68 aangemeld</span>
            <span className="text-gray-400">500 doel</span>
          </div>
          <ProgressBar value={68} max={500} color="#3d7ac8" />
          <p className="text-xs text-gray-400 mt-2">13.6% — nog 432 te gaan</p>
        </div>
      </div>

      {/* Bezoekers per avond */}
      <div className="card">
        <h3 className="font-bold text-navy-700 mb-5">Bezoekers per iftaravond</h3>
        <div className="flex items-center gap-6 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-navy-700 inline-block rounded" /> Mannen</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gold-500 inline-block rounded" /> Vrouwen</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={bezoekers}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="datum" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="mannen" name="Mannen" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#C9A84C" }} />
            <Line type="monotone" dataKey="vrouwen" name="Vrouwen" stroke="#C9A84C" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 kosten per leverancier */}
      <div className="card">
        <h3 className="font-bold text-navy-700 mb-6">Top 10 kosten per leverancier</h3>
        <div className="space-y-3">
          {top10.map((l, i) => (
            <div key={l.naam}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-navy-700">{l.naam}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 text-xs">{((l.bedrag / totaleKosten) * 100).toFixed(1)}%</span>
                  <span className="font-bold text-red-600">{euro(l.bedrag)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{
                  width: `${(l.bedrag / maxBedrag) * 100}%`,
                  background: i === 0 ? "#1B3A5C" : i === 1 ? "#3d67a2" : i === 2 ? "#C9A84C" : "#9bb8d4",
                }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-400 font-medium">Totale kosten (alle {leveranciers.length} posten)</span>
          <span className="font-bold text-navy-700">{euro(totaleKosten)}</span>
        </div>
      </div>

      {/* AI Chatbot */}
      <div>
        <h2 className="text-xl font-bold text-navy-700 mb-4">BI Assistent — Stel een vraag over de data</h2>
        <DashboardChat
          uploadIds={["abe94fbd-04b5-46b6-96bc-f40f9970975a", "84a78625-fb63-497a-935a-e50d1ff2924a"]}
          context={`Inzamelingsdata Ramadan 2026:
- Iftar Inzameling: € 43.500 ingezameld van € 45.000 doel (96.7%, nog € 1.500 te gaan)
- Project Quba (renovatiefonds): € 64.258 ingezameld van € 100.000 doel (64.3%, nog € 35.742 te gaan)
- Dawah Dragers (vrijwilligers): 68 aangemeld van 500 doel (13.6%, nog 432 te gaan)`}
        />
      </div>

      {/* Alle leveranciers tabel */}
      <div className="card">
        <h3 className="font-bold text-navy-700 mb-4">Alle kostenposten Ramadan 2026</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Leverancier</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">Bedrag</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">% van totaal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leveranciers.map((l) => (
                <tr key={l.naam} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700 font-medium">{l.naam}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{euro(l.bedrag)}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{((l.bedrag / totaleKosten) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-3 py-2 text-navy-700">Totaal</td>
                <td className="px-3 py-2 text-right text-navy-700">{euro(totaleKosten)}</td>
                <td className="px-3 py-2 text-right text-navy-700">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DemoDashboardChat from "@/components/marketing/DemoDashboardChat";

const omzetPerKlant = [
  { naam: "Klant A - Retail BV", omzet: 87000 },
  { naam: "Klant B - Tech Corp", omzet: 74000 },
  { naam: "Klant C - Horeca NL", omzet: 65000 },
  { naam: "Klant D - Bouw & Co", omzet: 52000 },
  { naam: "Klant E - Zorg Plus", omzet: 41000 },
  { naam: "Overig", omzet: 38000 },
];

const maandOmzet = [
  { maand: "Jan", omzet: 35000, vorig: 28000 },
  { maand: "Feb", omzet: 38000, vorig: 31000 },
  { maand: "Mrt", omzet: 44000, vorig: 35000 },
  { maand: "Apr", omzet: 47000, vorig: 38000 },
  { maand: "Mei", omzet: 52000, vorig: 42000 },
  { maand: "Jun", omzet: 55000, vorig: 44000 },
  { maand: "Jul", omzet: 41000, vorig: 36000 },
  { maand: "Aug", omzet: 38000, vorig: 33000 },
  { maand: "Sep", omzet: 49000, vorig: 40000 },
  { maand: "Okt", omzet: 56000, vorig: 46000 },
  { maand: "Nov", omzet: 59000, vorig: 48000 },
  { maand: "Dec", omzet: 46000, vorig: 39000 },
];

function euro(v: number) {
  return `€${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function axisFmt(v: number) {
  return v >= 1000 ? `€${(v / 1000).toFixed(0)}K` : `€${v}`;
}

const kpiCards = [
  { label: "Totale omzet", value: "€560.000", sub: "Januari – December 2025" },
  { label: "Aantal klanten", value: "6", sub: "Actieve accounts" },
  { label: "Grootste klant", value: "€87.000", sub: "Retail BV" },
  { label: "Groei t.o.v. 2024", value: "+21%", sub: "Jaar-op-jaar" },
];

const DEMO_CONTEXT = `Sales demo dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | Aantal klanten: 6 | Grootste klant: Retail BV €87.000 | Groei t.o.v. 2024: +21%
Omzet per klant: Klant A - Retail BV €87.000, Klant B - Tech Corp €74.000, Klant C - Horeca NL €65.000, Klant D - Bouw & Co €52.000, Klant E - Zorg Plus €41.000, Overig €38.000
Omzet 2025 per maand: Jan €35.000, Feb €38.000, Mrt €44.000, Apr €47.000, Mei €52.000, Jun €55.000, Jul €41.000, Aug €38.000, Sep €49.000, Okt €56.000, Nov €59.000, Dec €46.000
Omzet 2024 per maand: Jan €28.000, Feb €31.000, Mrt €35.000, Apr €38.000, Mei €42.000, Jun €44.000, Jul €36.000, Aug €33.000, Sep €40.000, Okt €46.000, Nov €48.000, Dec €39.000`;

const SUGGESTIONS = [
  "Welke klant draagt het meest bij aan de omzet?",
  "Maak een grafiek van omzet 2025 vs 2024",
  "Toon omzet per klant als staafdiagram",
  "Hoe groot is de afhankelijkheid van de grootste klant?",
  "Welke maanden waren de topmaanden?",
];

export default function SalesDemoPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link href="/dashboards" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3A5C] mb-6 transition-colors">
          <ArrowLeft size={16} /> Terug naar dashboards
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="inline-block bg-[#1B3A5C]/8 text-[#1B3A5C] text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Demo — Voorbeeld BV 2025
          </div>
          <h1 className="text-3xl font-bold text-[#1B3A5C] mb-2">Sales Dashboard</h1>
          <p className="text-gray-500">Klantomzet, pipeline en conversie — interactief voorbeeld</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
              <p className="text-3xl font-bold text-[#1B3A5C]">{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Bar chart: omzet per klant */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Omzet per klant</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={omzetPerKlant} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <YAxis type="category" dataKey="naam" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={130} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="omzet" fill="#1B3A5C" name="Omzet" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart: omzet 2025 vs 2024 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Omzet 2025 vs 2024</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={maandOmzet}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="omzet" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Omzet 2025" />
              <Line type="monotone" dataKey="vorig" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 5 }} name="Omzet 2024" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Wat haal je uit dit dashboard?</h2>
          <ul className="space-y-3">
            {[
              "Welke klanten het meest bijdragen aan je omzet — prioriteer je salesaandacht",
              "Of je te afhankelijk bent van één grote klant — Retail BV is goed voor 15,5%",
              "Hoe je groei verloopt t.o.v. vorig jaar — dit jaar +21% over het hele jaar",
              "Welke maanden topmaanden zijn — handig voor capaciteitsplanning",
              "Waar je salesfocus moet liggen voor verdere diversificatie",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">Stel een vraag aan de AI-assistent</h2>
          <p className="text-sm text-gray-500 mb-4">
            De assistent kent alle bovenstaande salesdata en kan grafieken genereren op basis van jouw vragen.
          </p>
          <DemoDashboardChat context={DEMO_CONTEXT} suggestions={SUGGESTIONS} />
        </div>
      </div>
    </div>
  );
}

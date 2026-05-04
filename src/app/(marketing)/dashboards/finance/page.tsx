"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DemoDashboardChat from "@/components/marketing/DemoDashboardChat";

const maandData = [
  { maand: "Jan", omzet: 35000, kosten: 22000, marge: 13000 },
  { maand: "Feb", omzet: 38000, kosten: 23500, marge: 14500 },
  { maand: "Mrt", omzet: 44000, kosten: 26000, marge: 18000 },
  { maand: "Apr", omzet: 47000, kosten: 28000, marge: 19000 },
  { maand: "Mei", omzet: 52000, kosten: 30000, marge: 22000 },
  { maand: "Jun", omzet: 55000, kosten: 31500, marge: 23500 },
  { maand: "Jul", omzet: 41000, kosten: 27000, marge: 14000 },
  { maand: "Aug", omzet: 38000, kosten: 25000, marge: 13000 },
  { maand: "Sep", omzet: 49000, kosten: 29500, marge: 19500 },
  { maand: "Okt", omzet: 56000, kosten: 33000, marge: 23000 },
  { maand: "Nov", omzet: 59000, kosten: 34500, marge: 24500 },
  { maand: "Dec", omzet: 46000, kosten: 28000, marge: 18000 },
];

const kostenCategorieen = [
  { name: "Personeel", value: 198000 },
  { name: "Inkoop", value: 85000 },
  { name: "Huisvesting", value: 42000 },
  { name: "Marketing", value: 28000 },
  { name: "Overig", value: 34500 },
];

const PIE_COLORS = ["#1B3A5C", "#C9A84C", "#3d7ac8", "#e07b39", "#56a88f"];

function euro(v: number) {
  return `€${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function axisFmt(v: number) {
  return v >= 1000 ? `€${(v / 1000).toFixed(0)}K` : `€${v}`;
}

const kpiCards = [
  { label: "Totale omzet", value: "€560.000", sub: "Januari – December 2025" },
  { label: "Totale kosten", value: "€338.000", sub: "Alle categorieën" },
  { label: "Brutomarge", value: "39,6%", sub: "Gemiddeld over het jaar" },
  { label: "Nettoresultaat", value: "€222.000", sub: "Na alle kosten" },
];

const DEMO_CONTEXT = `Finance demo dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | Totale kosten: €338.000 | Brutomarge: 39.6% | Nettoresultaat: €222.000
Omzet per maand: Jan €35.000, Feb €38.000, Mrt €44.000, Apr €47.000, Mei €52.000, Jun €55.000, Jul €41.000, Aug €38.000, Sep €49.000, Okt €56.000, Nov €59.000, Dec €46.000
Kosten per maand: Jan €22.000, Feb €23.500, Mrt €26.000, Apr €28.000, Mei €30.000, Jun €31.500, Jul €27.000, Aug €25.000, Sep €29.500, Okt €33.000, Nov €34.500, Dec €28.000
Kosten per categorie: Personeel €198.000, Inkoop €85.000, Huisvesting €42.000, Marketing €28.000, Overig €34.500`;

const SUGGESTIONS = [
  "Welke maand had de hoogste marge?",
  "Maak een grafiek van omzet vs kosten",
  "Toon de kosten per categorie als taartdiagram",
  "Hoe ontwikkelt de brutomarge zich over het jaar?",
  "Wanneer was het beste moment om te investeren?",
];

export default function FinanceDemoPage() {
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
          <h1 className="text-3xl font-bold text-[#1B3A5C] mb-2">Finance Dashboard</h1>
          <p className="text-gray-500">Omzet, kosten, marge en winstgevendheid — interactief voorbeeld</p>
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

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar chart: omzet vs kosten */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Omzet vs Kosten per maand</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={maandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
                <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="omzet" fill="#1B3A5C" name="Omzet" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kosten" fill="#C9A84C" name="Kosten" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart: kosten per categorie */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Kosten per categorie</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={kostenCategorieen}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {kostenCategorieen.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line chart: marge */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Brutomarge per maand</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={maandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="marge" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Marge" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Wat haal je uit dit dashboard?</h2>
          <ul className="space-y-3">
            {[
              "Welke maanden de hoogste en laagste marge hadden — handig voor seizoensplanning",
              "Of kosten in lijn zijn met de omzetgroei — of je efficiënt schaalt",
              "Welke kostenpost het zwaarst weegt — personeel, inkoop of huisvesting",
              "Hoe het nettoresultaat zich verhoudt tot de omzetdoelstelling",
              "Wanneer het beste moment is om te investeren of reserves op te bouwen",
              "Seizoenspatronen in omzet en kosten — zomer vs. winter, Q4-piek",
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
            De assistent kent alle bovenstaande data en kan grafieken genereren op basis van jouw vragen.
          </p>
          <DemoDashboardChat context={DEMO_CONTEXT} suggestions={SUGGESTIONS} />
        </div>
      </div>
    </div>
  );
}

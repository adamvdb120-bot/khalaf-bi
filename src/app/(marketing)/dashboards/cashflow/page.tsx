"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DemoDashboardChat from "@/components/marketing/DemoDashboardChat";

const cashflowData = [
  { maand: "Jan", inkomsten: 32000, uitgaven: 28000, netto: 4000, cumulatief: 4000 },
  { maand: "Feb", inkomsten: 35000, uitgaven: 31000, netto: 4000, cumulatief: 8000 },
  { maand: "Mrt", inkomsten: 41000, uitgaven: 29000, netto: 12000, cumulatief: 20000 },
  { maand: "Apr", inkomsten: 44000, uitgaven: 35000, netto: 9000, cumulatief: 29000 },
  { maand: "Mei", inkomsten: 49000, uitgaven: 32000, netto: 17000, cumulatief: 46000 },
  { maand: "Jun", inkomsten: 53000, uitgaven: 38000, netto: 15000, cumulatief: 61000 },
  { maand: "Jul", inkomsten: 38000, uitgaven: 34000, netto: 4000, cumulatief: 65000 },
  { maand: "Aug", inkomsten: 36000, uitgaven: 33000, netto: 3000, cumulatief: 68000 },
  { maand: "Sep", inkomsten: 47000, uitgaven: 31000, netto: 16000, cumulatief: 84000 },
  { maand: "Okt", inkomsten: 54000, uitgaven: 36000, netto: 18000, cumulatief: 102000 },
  { maand: "Nov", inkomsten: 57000, uitgaven: 39000, netto: 18000, cumulatief: 120000 },
  { maand: "Dec", inkomsten: 43000, uitgaven: 35000, netto: 8000, cumulatief: 128000 },
];

function euro(v: number) {
  return `€${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function axisFmt(v: number) {
  return v >= 1000 ? `€${(v / 1000).toFixed(0)}K` : `€${v}`;
}

const kpiCards = [
  { label: "Totaal ontvangen", value: "€529.000", sub: "Alle inkomsten 2025" },
  { label: "Totaal uitgegeven", value: "€401.000", sub: "Alle uitgaven 2025" },
  { label: "Netto cashflow", value: "€128.000", sub: "Positief saldo" },
  { label: "Eindbalans", value: "€128.000", sub: "Per 31 december 2025" },
];

const DEMO_CONTEXT = `Cashflow demo dashboard — Voorbeeld BV 2025
Totaal ontvangen: €529.000 | Totaal uitgegeven: €401.000 | Netto cashflow: €128.000 | Eindbalans: €128.000
Inkomsten per maand: Jan €32.000, Feb €35.000, Mrt €41.000, Apr €44.000, Mei €49.000, Jun €53.000, Jul €38.000, Aug €36.000, Sep €47.000, Okt €54.000, Nov €57.000, Dec €43.000
Uitgaven per maand: Jan €28.000, Feb €31.000, Mrt €29.000, Apr €35.000, Mei €32.000, Jun €38.000, Jul €34.000, Aug €33.000, Sep €31.000, Okt €36.000, Nov €39.000, Dec €35.000
Netto per maand: Jan €4.000, Feb €4.000, Mrt €12.000, Apr €9.000, Mei €17.000, Jun €15.000, Jul €4.000, Aug €3.000, Sep €16.000, Okt €18.000, Nov €18.000, Dec €8.000
Cumulatieve cashflow: Jan €4.000, Feb €8.000, Mrt €20.000, Apr €29.000, Mei €46.000, Jun €61.000, Jul €65.000, Aug €68.000, Sep €84.000, Okt €102.000, Nov €120.000, Dec €128.000`;

const SUGGESTIONS = [
  "Welke maanden had ik de minste cashflow?",
  "Maak een grafiek van inkomsten vs uitgaven",
  "Toon de cumulatieve cashflow als lijndiagram",
  "Wanneer kon ik het veiligst investeren?",
  "Wat is het gemiddelde netto per maand?",
];

export default function CashflowDemoPage() {
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
          <h1 className="text-3xl font-bold text-[#1B3A5C] mb-2">Cashflow Dashboard</h1>
          <p className="text-gray-500">Liquiditeit, inkomsten en uitgaven — interactief voorbeeld</p>
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

        {/* Bar chart: inkomsten vs uitgaven */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Inkomsten vs Uitgaven per maand</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashflowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="inkomsten" fill="#1B3A5C" name="Inkomsten" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uitgaven" fill="#C9A84C" name="Uitgaven" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart: cumulatief */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Cumulatieve cashflow</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashflowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={[0, "auto"]} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="cumulatief" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Cumulatief" />
              <Line type="monotone" dataKey="netto" stroke="#C9A84C" strokeWidth={2} dot={false} activeDot={{ r: 5 }} name="Netto" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">Wat haal je uit dit dashboard?</h2>
          <ul className="space-y-3">
            {[
              "Wanneer je krap bij kas zit — lage netto maanden zoals augustus (€3.000)",
              "Of je genoeg buffer hebt voor grote uitgaven en onverwachte kosten",
              "Seizoenspatronen in geldstromen — zomerdip en Q4-herstel duidelijk zichtbaar",
              "Of je inkomsten en uitgaven goed op elkaar aansluiten maand voor maand",
              "Wanneer je veilig kunt investeren — hoge netto maanden als oktober en november",
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
            De assistent kent alle bovenstaande cashflowdata en kan grafieken genereren op basis van jouw vragen.
          </p>
          <DemoDashboardChat context={DEMO_CONTEXT} suggestions={SUGGESTIONS} />
        </div>
      </div>
    </div>
  );
}

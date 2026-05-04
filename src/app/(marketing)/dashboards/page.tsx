"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DemoDashboardChat from "@/components/marketing/DemoDashboardChat";
import { BarChart2, TrendingUp, ShoppingCart } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#1B3A5C", "#C9A84C", "#3d7ac8", "#e07b39", "#56a88f"];
function euro(v: number) {
  return `€${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
function axisFmt(v: number) {
  return v >= 1000 ? `€${(v / 1000).toFixed(0)}K` : `€${v}`;
}
function pctFmt(v: number) {
  return `${v}%`;
}

// ─── Finance data (P&L) ───────────────────────────────────────────────────────
const plMaand = [
  { maand: "Jan", omzet: 35000, cogs: 14000, bruto: 21000, opex: 10500, netto: 10500 },
  { maand: "Feb", omzet: 38000, cogs: 15200, bruto: 22800, opex: 11000, netto: 11800 },
  { maand: "Mrt", omzet: 44000, cogs: 17600, bruto: 26400, opex: 11500, netto: 14900 },
  { maand: "Apr", omzet: 47000, cogs: 18800, bruto: 28200, opex: 11800, netto: 16400 },
  { maand: "Mei", omzet: 52000, cogs: 20800, bruto: 31200, opex: 12000, netto: 19200 },
  { maand: "Jun", omzet: 55000, cogs: 22000, bruto: 33000, opex: 12200, netto: 20800 },
  { maand: "Jul", omzet: 41000, cogs: 16400, bruto: 24600, opex: 11800, netto: 12800 },
  { maand: "Aug", omzet: 38000, cogs: 15200, bruto: 22800, opex: 11500, netto: 11300 },
  { maand: "Sep", omzet: 49000, cogs: 19600, bruto: 29400, opex: 12000, netto: 17400 },
  { maand: "Okt", omzet: 56000, cogs: 22400, bruto: 33600, opex: 12500, netto: 21100 },
  { maand: "Nov", omzet: 59000, cogs: 23600, bruto: 35400, opex: 12800, netto: 22600 },
  { maand: "Dec", omzet: 46000, cogs: 18400, bruto: 27600, opex: 12000, netto: 15600 },
].map((r) => ({ ...r, margePercent: Math.round((r.bruto / r.omzet) * 100) }));

const plMaandMetRolling = plMaand.map((r, i, arr) => {
  const window = arr.slice(Math.max(0, i - 2), i + 1);
  const rolling = Math.round(window.reduce((s, x) => s + x.omzet, 0) / window.length);
  return { ...r, rolling };
});

// ─── Balance sheet ────────────────────────────────────────────────────────────
const balans = {
  activa: {
    vlottend: [
      { naam: "Liquide middelen",  bedrag: 128000 },
      { naam: "Debiteuren",        bedrag: 85000  },
      { naam: "Voorraad",          bedrag: 42000  },
      { naam: "Overige vlottende", bedrag: 18000  },
    ],
    vast: [
      { naam: "Inventaris",        bedrag: 95000  },
      { naam: "Machines",          bedrag: 78000  },
      { naam: "Immaterieel",       bedrag: 42000  },
    ],
  },
  passiva: {
    kortlopend: [
      { naam: "Crediteuren",       bedrag: 38000  },
      { naam: "Kortlopend krediet",bedrag: 25000  },
      { naam: "Belastingen",       bedrag: 19000  },
    ],
    langlopend: [
      { naam: "Bankschuld",        bedrag: 120000 },
      { naam: "Overig LT",         bedrag: 15000  },
    ],
    eigen: [
      { naam: "Aandelenkapitaal",  bedrag: 50000  },
      { naam: "Reserves",          bedrag: 121400 },
      { naam: "Resultaat boekjaar",bedrag: 75600  },
    ],
  },
};
const totalActiva = 488000;
const totalPassiva = 464000;
const balansBars = [
  { name: "Vlottende activa", bedrag: 273000 },
  { name: "Vaste activa",     bedrag: 215000 },
  { name: "Eigen vermogen",   bedrag: 247000 },
];

// ─── Cashflow ─────────────────────────────────────────────────────────────────
const cashflowMaand = [
  { maand: "Jan", inkomsten: 32000, uitgaven: 28000, netto: 4000,  cumulatief: 4000   },
  { maand: "Feb", inkomsten: 35000, uitgaven: 31000, netto: 4000,  cumulatief: 8000   },
  { maand: "Mrt", inkomsten: 41000, uitgaven: 29000, netto: 12000, cumulatief: 20000  },
  { maand: "Apr", inkomsten: 44000, uitgaven: 35000, netto: 9000,  cumulatief: 29000  },
  { maand: "Mei", inkomsten: 49000, uitgaven: 32000, netto: 17000, cumulatief: 46000  },
  { maand: "Jun", inkomsten: 53000, uitgaven: 38000, netto: 15000, cumulatief: 61000  },
  { maand: "Jul", inkomsten: 38000, uitgaven: 34000, netto: 4000,  cumulatief: 65000  },
  { maand: "Aug", inkomsten: 36000, uitgaven: 33000, netto: 3000,  cumulatief: 68000  },
  { maand: "Sep", inkomsten: 47000, uitgaven: 31000, netto: 16000, cumulatief: 84000  },
  { maand: "Okt", inkomsten: 54000, uitgaven: 36000, netto: 18000, cumulatief: 102000 },
  { maand: "Nov", inkomsten: 57000, uitgaven: 39000, netto: 18000, cumulatief: 120000 },
  { maand: "Dec", inkomsten: 43000, uitgaven: 35000, netto: 8000,  cumulatief: 128000 },
];

// ─── Debiteuren & Crediteuren ─────────────────────────────────────────────────
const debiteurenAging = [
  { bucket: "0-30 d",   debiteuren: 45000, crediteuren: 18000 },
  { bucket: "31-60 d",  debiteuren: 22000, crediteuren: 12000 },
  { bucket: "61-90 d",  debiteuren: 12000, crediteuren: 6000  },
  { bucket: "90+ d",    debiteuren: 6000,  crediteuren: 2000  },
];
const debiteurenPerKlant = [
  { naam: "Retail BV", bedrag: 28000, dagen: 18 },
  { naam: "Tech Corp", bedrag: 22000, dagen: 35 },
  { naam: "Horeca NL", bedrag: 18000, dagen: 12 },
  { naam: "Bouw & Co", bedrag: 12000, dagen: 55 },
  { naam: "Zorg Plus", bedrag: 5000,  dagen: 78 },
];
const crediteurenPerLeverancier = [
  { naam: "Leverancier A", bedrag: 15000, dagen: 22 },
  { naam: "Leverancier B", bedrag: 12000, dagen: 14 },
  { naam: "Leverancier C", bedrag: 8000,  dagen: 45 },
  { naam: "Leverancier D", bedrag: 3000,  dagen: 62 },
];

// ─── Prognose ─────────────────────────────────────────────────────────────────
const prognoseMaand = [
  { maand: "Jan", werkelijk: 35000, prognose: null },
  { maand: "Feb", werkelijk: 38000, prognose: null },
  { maand: "Mrt", werkelijk: 44000, prognose: null },
  { maand: "Apr", werkelijk: 47000, prognose: null },
  { maand: "Mei", werkelijk: 52000, prognose: null },
  { maand: "Jun", werkelijk: 55000, prognose: null },
  { maand: "Jul", werkelijk: 41000, prognose: null },
  { maand: "Aug", werkelijk: 38000, prognose: null },
  { maand: "Sep", werkelijk: 49000, prognose: 49000 },
  { maand: "Okt", werkelijk: null,  prognose: 54000 },
  { maand: "Nov", werkelijk: null,  prognose: 57000 },
  { maand: "Dec", werkelijk: null,  prognose: 48000 },
];

// ─── Existing data kept for Sales & Cashflow tabs ────────────────────────────
const omzetPerKlant = [
  { naam: "Retail BV", omzet: 87000 },
  { naam: "Tech Corp", omzet: 74000 },
  { naam: "Horeca NL", omzet: 65000 },
  { naam: "Bouw & Co", omzet: 52000 },
  { naam: "Zorg Plus", omzet: 41000 },
  { naam: "Overig",    omzet: 38000 },
];
const salesMaand = [
  { maand: "Jan", huidig: 35000, vorig: 28000 },
  { maand: "Feb", huidig: 38000, vorig: 31000 },
  { maand: "Mrt", huidig: 44000, vorig: 35000 },
  { maand: "Apr", huidig: 47000, vorig: 38000 },
  { maand: "Mei", huidig: 52000, vorig: 42000 },
  { maand: "Jun", huidig: 55000, vorig: 44000 },
  { maand: "Jul", huidig: 41000, vorig: 36000 },
  { maand: "Aug", huidig: 38000, vorig: 33000 },
  { maand: "Sep", huidig: 49000, vorig: 40000 },
  { maand: "Okt", huidig: 56000, vorig: 46000 },
  { maand: "Nov", huidig: 59000, vorig: 48000 },
  { maand: "Dec", huidig: 46000, vorig: 39000 },
];

// ─── Context strings ──────────────────────────────────────────────────────────
const FINANCE_CONTEXT = `Finance dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | COGS: €224.000 | Brutomarge: 60% | OPEX: €141.600 | Nettoresultaat: €194.400
Maanddata (omzet / cogs / bruto / netto): Jan €35k/€14k/€21k/€10,5k | Feb €38k/€15,2k/€22,8k/€11,8k | Mrt €44k/€17,6k/€26,4k/€14,9k
Apr €47k/€18,8k/€28,2k/€16,4k | Mei €52k/€20,8k/€31,2k/€19,2k | Jun €55k/€22k/€33k/€20,8k
Jul €41k/€16,4k/€24,6k/€12,8k | Aug €38k/€15,2k/€22,8k/€11,3k | Sep €49k/€19,6k/€29,4k/€17,4k
Okt €56k/€22,4k/€33,6k/€21,1k | Nov €59k/€23,6k/€35,4k/€22,6k | Dec €46k/€18,4k/€27,6k/€15,6k
Balans totaal activa €488k | Totaal passiva+EV €464k | Eigen vermogen €247k
Cashflow eindstand €128k | Debiteuren openstaand €85k | Crediteuren te betalen €38k
Jaarverwachting prognose: €619.000`;
const FINANCE_SUGGESTIONS = [
  "Welke maand had de hoogste nettomarge?",
  "Analyseer de brutomarge trend",
  "Hoe sterk is de balans van Voorbeeld BV?",
  "Wanneer verwacht je de €619k jaardoelstelling te halen?",
  "Vergelijk OPEX ratio met de brutomarge",
];
const CASHFLOW_CONTEXT = `Cashflow dashboard — Voorbeeld BV 2025
Totaal ontvangen: €529.000 | Totaal uitgegeven: €401.000 | Netto cashflow: €128.000 | Eindbalans: €128.000
Per maand: Jan €32k/€28k/+€4k | Feb €35k/€31k/+€4k | Mrt €41k/€29k/+€12k | Apr €44k/€35k/+€9k
Mei €49k/€32k/+€17k | Jun €53k/€38k/+€15k | Jul €38k/€34k/+€4k | Aug €36k/€33k/+€3k
Sep €47k/€31k/+€16k | Okt €54k/€36k/+€18k | Nov €57k/€39k/+€18k | Dec €43k/€35k/+€8k`;
const CASHFLOW_SUGGESTIONS = [
  "Welke maand had de laagste cashflow?",
  "Wanneer kon ik het best investeren?",
  "Zijn er maanden waarbij ik krap bij kas zat?",
  "Toon de cumulatieve cashflow als lijndiagram",
  "Maak een grafiek van inkomsten vs uitgaven",
];
const SALES_CONTEXT = `Sales dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | Aantal klanten: 6 | Grootste klant: Retail BV €87.000 | Groei t.o.v. vorig jaar: +21%
Omzet per klant: Retail BV €87k, Tech Corp €74k, Horeca NL €65k, Bouw & Co €52k, Zorg Plus €41k, Overig €38k`;
const SALES_SUGGESTIONS = [
  "Welke klant levert de meeste omzet?",
  "Ben ik te afhankelijk van één klant?",
  "Vergelijk omzet 2025 met 2024",
  "Welke maanden waren de topmaanden?",
  "Maak een grafiek van omzet per klant",
];

// ─── Tabs config ──────────────────────────────────────────────────────────────
type MainTab = "finance" | "cashflow" | "sales";
type FinanceSub = "overview" | "balans" | "cashflow" | "debcred" | "prognose" | "kosten" | "benchmark" | "breakeven";

const MAIN_TABS: { id: MainTab; label: string; icon: React.ReactNode; sub: string }[] = [
  { id: "finance",  label: "Finance",      icon: <BarChart2 size={16} />,    sub: "P&L · Balans · Prognose" },
  { id: "cashflow", label: "Liquiditeit",  icon: <TrendingUp size={16} />,   sub: "Cashflow · Inkomsten" },
  { id: "sales",    label: "Sales",        icon: <ShoppingCart size={16} />, sub: "Klanten · Groei" },
];
const FINANCE_SUBS: { id: FinanceSub; label: string }[] = [
  { id: "overview",  label: "Overview" },
  { id: "balans",    label: "Balance Sheet" },
  { id: "cashflow",  label: "Cash Flow" },
  { id: "debcred",   label: "Debiteuren & Crediteuren" },
  { id: "prognose",  label: "Prognose" },
  { id: "kosten",    label: "Kostenanalyse" },
  { id: "benchmark", label: "Benchmarking" },
  { id: "breakeven", label: "Break-even" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardsPage() {
  const [activeTab, setActiveTab]       = useState<MainTab>("finance");
  const [financeSub, setFinanceSub]     = useState<FinanceSub>("overview");

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A5C] text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="inline-block bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            Live demo · Voorbeeld BV 2025
          </div>
          <h1 className="text-4xl font-bold mb-3">Interactief demo dashboard</h1>
          <p className="text-white/60 max-w-xl">
            Bekijk hoe Khalaf BI jouw data omzet naar bruikbare inzichten. Wissel tussen tabbladen en stel vragen aan de AI-assistent.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {MAIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === t.id
                    ? "border-[#1B3A5C] text-[#1B3A5C]"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                <span className={`hidden sm:block text-xs font-normal ${activeTab === t.id ? "text-[#1B3A5C]/50" : "text-gray-300"}`}>
                  · {t.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "finance" && (
          <FinanceTab financeSub={financeSub} setFinanceSub={setFinanceSub} />
        )}
        {activeTab === "cashflow" && <CashflowTab />}
        {activeTab === "sales"    && <SalesTab />}

        {/* CTA */}
        <div className="bg-[#1B3A5C] rounded-2xl p-8 text-center text-white mt-8">
          <h2 className="text-2xl font-bold mb-2">Klaar voor uw eigen data?</h2>
          <p className="text-white/60 mb-6">Khalaf BI bouwt dashboards op maat — inclusief AI-assistent en live koppelingen.</p>
          <Link href="/contact" className="inline-block bg-[#C9A84C] hover:bg-[#b8973e] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Neem contact op
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Finance tab (3-column sidebar layout) ────────────────────────────────────
function FinanceTab({
  financeSub,
  setFinanceSub,
}: {
  financeSub: FinanceSub;
  setFinanceSub: (s: FinanceSub) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 3-column layout */}
      <div className="flex gap-0 min-h-[600px]">
        {/* Left sidebar */}
        <div className="w-[220px] flex-shrink-0 bg-white border-r border-gray-100 rounded-l-2xl shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Secties</p>
          <nav className="space-y-1">
            {FINANCE_SUBS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setFinanceSub(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                  financeSub === s.id
                    ? "border-l-4 border-[#1B3A5C] text-[#1B3A5C] font-semibold bg-[#1B3A5C]/5 pl-2"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`text-xs font-mono ${financeSub === s.id ? "text-[#C9A84C]" : "text-gray-300"}`}>
                  {i + 1}.
                </span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-gray-50 p-6 min-w-0">
          {financeSub === "overview"  && <OverviewSection />}
          {financeSub === "balans"    && <BalansSection />}
          {financeSub === "cashflow"  && <CashflowSection />}
          {financeSub === "debcred"   && <DebCredSection />}
          {financeSub === "prognose"  && <PrognoseSection />}
          {financeSub === "kosten"    && <KostenSection />}
          {financeSub === "benchmark" && <BenchmarkSection />}
          {financeSub === "breakeven" && <BreakevenSection />}
        </div>

        {/* Right panel: Smart Inzichten */}
        <div className="w-[280px] flex-shrink-0 bg-white border-l border-gray-100 rounded-r-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-[#1B3A5C] uppercase tracking-widest mb-1">Smart Inzichten</p>
          <p className="text-[11px] text-gray-400 mb-4">Automatisch gegenereerd op basis van uw data</p>
          <div className="space-y-3">
            {[
              { icon: "🏆", text: "Juni was de beste maand met €55.000 omzet en €20.800 nettoresultaat." },
              { icon: "📊", text: "De brutomarge is stabiel rond 60% — kosten schalen mee met omzet." },
              { icon: "⚠️", text: "€18.000 aan debiteuren staat langer dan 60 dagen open — actie aanbevolen." },
              { icon: "🌤️", text: "Q3 (jul-sep) laat een seizoensdip zien — plan cashreserves voor de zomer." },
              { icon: "📈", text: "Jaarverwachting €619.000 ligt 10,5% boven vorig jaar (€560.000 tot nu)." },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs leading-relaxed text-gray-700">
                  <span className="mr-1">{item.icon}</span>
                  <strong className="text-[#1B3A5C]">{item.text.split("—")[0].trim()}</strong>
                  {item.text.includes("—") && (
                    <span className="text-gray-500"> — {item.text.split("—")[1]}</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Financieel overzicht</p>
            {[
              { label: "Omzet",     value: "€560k", color: "#1B3A5C" },
              { label: "COGS",      value: "€224k", color: "#94a3b8" },
              { label: "Brutomarge",value: "€336k", color: "#C9A84C" },
              { label: "OPEX",      value: "€142k", color: "#94a3b8" },
              { label: "Netto",     value: "€194k", color: "#56a88f" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-1.5 text-xs border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{r.label}</span>
                <span className="font-bold" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat below */}
      <div>
        <div className="mb-3">
          <h3 className="font-bold text-[#1B3A5C]">Stel een vraag aan de AI-assistent</h3>
          <p className="text-sm text-gray-400 mt-1">De assistent kent alle financiële data en kan grafieken en analyses genereren op basis van jouw vragen.</p>
        </div>
        <DemoDashboardChat context={FINANCE_CONTEXT} suggestions={FINANCE_SUGGESTIONS} />
      </div>
    </div>
  );
}

// ─── 1. Overview (P&L) ────────────────────────────────────────────────────────
function OverviewSection() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Resultatenrekening 2025</h2>

      {/* KPI cards with sparklines */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Omzet",          value: "€560.000", data: plMaand.map((r) => ({ v: r.omzet })),  color: "#1B3A5C" },
          { label: "COGS",           value: "€224.000", data: plMaand.map((r) => ({ v: r.cogs })),   color: "#C9A84C" },
          { label: "Brutomarge",     value: "60%",      data: plMaand.map((r) => ({ v: r.margePercent })), color: "#56a88f" },
          { label: "Nettoresultaat", value: "€194.400", data: plMaand.map((r) => ({ v: r.netto })),  color: "#3d7ac8" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold mb-2" style={{ color: k.color }}>{k.value}</p>
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={k.data}>
                <Line type="monotone" dataKey="v" stroke={k.color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Gauge row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Brutowinstmarge", value: 60,   color: "#56a88f" },
          { label: "OPEX ratio",      value: 25.3, color: "#C9A84C" },
          { label: "Nettomarge",      value: 34.7, color: "#3d7ac8" },
        ].map((g) => (
          <div key={g.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 text-center">{g.label}</p>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie
                  data={[{ v: g.value }, { v: 100 - g.value }]}
                  dataKey="v"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="58%"
                  outerRadius="80%"
                  cx="50%"
                  cy="100%"
                >
                  <Cell fill={g.color} />
                  <Cell fill="#f0f0f0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <p className="text-lg font-bold -mt-4" style={{ color: g.color }}>{g.value}%</p>
          </div>
        ))}
      </div>

      {/* Extra KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "DSO",                value: "32 dagen", sub: "Gem. betaaltermijn klanten", color: "#1B3A5C" },
          { label: "Current Ratio",      value: "2.1",      sub: "Vlottend / kortlopend schuld", color: "#56a88f" },
          { label: "Werkkapitaal",       value: "€191.000", sub: "Vlottend activa – kortlopend", color: "#3d7ac8" },
          { label: "EBITDA",             value: "€221.000", sub: "Winst voor rente & afschr.", color: "#C9A84C" },
          { label: "Kosten/€ omzet",     value: "€0,65",    sub: "Per euro omzet aan kosten",  color: "#e07b39" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ComposedChart: bars + line */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Omzet, COGS & Brutomarge %</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={plMaandMetRolling}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={pctFmt} domain={[0, 100]} />
            <Tooltip
              formatter={(v, name) => name === "Marge %" ? `${v}%` : euro(v as number)}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="omzet" fill="#1B3A5C" name="Omzet" radius={[3,3,0,0]} />
            <Bar yAxisId="left" dataKey="cogs"  fill="#C9A84C" name="COGS"  radius={[3,3,0,0]} />
            <Line yAxisId="right" type="monotone" dataKey="margePercent" stroke="#56a88f" strokeWidth={2} dot={false} name="Marge %" />
            <Line yAxisId="left" type="monotone" dataKey="rolling" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="3-mnd gem." />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Income statement breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Resultatenrekening samenvatting</h3>
        <div className="space-y-3">
          {[
            { label: "Omzet",          bedrag: 560000, pct: 100,  color: "#1B3A5C", indent: false },
            { label: "– COGS",         bedrag: 224000, pct: 40,   color: "#C9A84C", indent: true  },
            { label: "= Brutomarge",   bedrag: 336000, pct: 60,   color: "#56a88f", indent: false },
            { label: "– OPEX",         bedrag: 141600, pct: 25.3, color: "#e07b39", indent: true  },
            { label: "= Nettoresultaat",bedrag: 194400, pct: 34.7, color: "#3d7ac8", indent: false },
          ].map((r) => (
            <div key={r.label} className={`flex items-center gap-3 ${r.indent ? "pl-4" : ""}`}>
              <div className="w-32 shrink-0">
                <p className="text-xs text-gray-600 font-medium">{r.label}</p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                />
              </div>
              <div className="w-20 text-right shrink-0">
                <p className="text-xs font-bold" style={{ color: r.color }}>{euro(r.bedrag)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waterfall chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-1 text-sm">Watervaldiagram — waar blijft het geld?</h3>
        <p className="text-xs text-gray-400 mb-4">Van omzet naar nettoresultaat — elke stap laat zien wat er afvalt</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={[
              { name: "Omzet",           base: 0,      value: 560000, fill: "#1B3A5C" },
              { name: "– COGS",          base: 336000,  value: 224000, fill: "#e07b39" },
              { name: "Brutomarge",      base: 0,      value: 336000, fill: "#56a88f" },
              { name: "– OPEX",          base: 194400,  value: 141600, fill: "#C9A84C" },
              { name: "Nettoresultaat",  base: 0,      value: 194400, fill: "#3d7ac8" },
            ]}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip
              formatter={(v: unknown, name: unknown) => (name as string) === "base" ? null : euro(v as number)}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[4,4,0,0]}
              label={{ position: "top", formatter: (v: unknown) => euro(v as number), fontSize: 10, fill: "#374151" }}>
              {[
                { fill: "#1B3A5C" },
                { fill: "#e07b39" },
                { fill: "#56a88f" },
                { fill: "#C9A84C" },
                { fill: "#3d7ac8" },
              ].map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-1 text-sm">Prestatie heatmap per maand</h3>
        <p className="text-xs text-gray-400 mb-4">Groen = boven gemiddelde · Rood = onder gemiddelde</p>
        <div className="grid grid-cols-12 gap-1.5">
          {plMaand.map((r) => {
            const avg = 560000 / 12; // ~46.667
            const pct = (r.omzet - avg) / avg;
            const bg = pct >= 0.1 ? "#dcfce7" : pct >= 0 ? "#f0fdf4" : pct >= -0.1 ? "#fff7ed" : "#fee2e2";
            const text = pct >= 0.1 ? "#166534" : pct >= 0 ? "#15803d" : pct >= -0.1 ? "#9a3412" : "#991b1b";
            return (
              <div key={r.maand} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-lg p-2 text-center"
                  style={{ backgroundColor: bg }}
                >
                  <p className="text-[10px] font-bold" style={{ color: text }}>{r.maand}</p>
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: text }}>
                    {(r.omzet / 1000).toFixed(0)}K
                  </p>
                  <p className="text-[9px]" style={{ color: text }}>
                    {pct >= 0 ? "+" : ""}{(pct * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#dcfce7] inline-block"/>+10% of meer</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#f0fdf4] inline-block"/>0–10%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#fff7ed] inline-block"/>0 tot -10%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#fee2e2] inline-block"/>-10% of meer</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Balance Sheet ─────────────────────────────────────────────────────────
function BalansSection() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Balans per 31-12-2025</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Activa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#1B3A5C] text-sm">Activa</h3>
            <span className="text-sm font-bold text-[#1B3A5C]">€488.000</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vlottende activa</p>
          <div className="space-y-1.5 mb-4">
            {balans.activa.vlottend.map((r) => (
              <BalansRow key={r.naam} naam={r.naam} bedrag={r.bedrag} total={totalActiva} color="#1B3A5C" />
            ))}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vaste activa</p>
          <div className="space-y-1.5">
            {balans.activa.vast.map((r) => (
              <BalansRow key={r.naam} naam={r.naam} bedrag={r.bedrag} total={totalActiva} color="#3d7ac8" />
            ))}
          </div>
        </div>

        {/* Passiva */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#1B3A5C] text-sm">Passiva</h3>
            <span className="text-sm font-bold text-[#1B3A5C]">€464.000</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kortlopend</p>
          <div className="space-y-1.5 mb-4">
            {balans.passiva.kortlopend.map((r) => (
              <BalansRow key={r.naam} naam={r.naam} bedrag={r.bedrag} total={totalPassiva} color="#e07b39" />
            ))}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Langlopend</p>
          <div className="space-y-1.5 mb-4">
            {balans.passiva.langlopend.map((r) => (
              <BalansRow key={r.naam} naam={r.naam} bedrag={r.bedrag} total={totalPassiva} color="#C9A84C" />
            ))}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Eigen vermogen</p>
          <div className="space-y-1.5">
            {balans.passiva.eigen.map((r) => (
              <BalansRow key={r.naam} naam={r.naam} bedrag={r.bedrag} total={totalPassiva} color="#56a88f" />
            ))}
          </div>
        </div>
      </div>

      {/* Balans barchart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Balansoverzicht</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={balansBars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Bar dataKey="bedrag" radius={[5,5,0,0]} name="Bedrag">
              <Cell fill="#1B3A5C" />
              <Cell fill="#C9A84C" />
              <Cell fill="#56a88f" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BalansRow({ naam, bedrag, total, color }: { naam: string; bedrag: number; total: number; color: string }) {
  const pct = Math.round((bedrag / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0">
        <p className="text-[11px] text-gray-600 truncate">{naam}</p>
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-16 text-right shrink-0">
        <p className="text-[11px] font-semibold text-gray-700">{euro(bedrag)}</p>
      </div>
    </div>
  );
}

// ─── 3. Cash Flow section ─────────────────────────────────────────────────────
function CashflowSection() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Cashflow 2025</h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Totaal ontvangen",  value: "€529.000" },
          { label: "Totaal uitgegeven", value: "€401.000" },
          { label: "Netto cashflow",    value: "€128.000" },
          { label: "Eindbalans dec.",   value: "€128.000" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold text-[#1B3A5C]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Inkomsten vs Uitgaven per maand</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cashflowMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="inkomsten" fill="#1B3A5C" name="Inkomsten" radius={[3,3,0,0]} />
            <Bar dataKey="uitgaven"  fill="#C9A84C" name="Uitgaven"  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Cumulatieve cashflow & netto per maand</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={cashflowMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto","auto"]} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cumulatief" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Cumulatief" />
            <Line type="monotone" dataKey="netto"      stroke="#C9A84C" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} name="Netto per maand" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 4. Debiteuren & Crediteuren ──────────────────────────────────────────────
function DebCredSection() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Debiteuren & Crediteuren</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Totaal openstaand",     value: "€85.000",  color: "#1B3A5C" },
          { label: "Gem. betalingstermijn", value: "32 dagen", color: "#C9A84C" },
          { label: "Verlopen >60 dagen",    value: "€18.000",  color: "#e07b39" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Combined aging chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Aging overzicht — Debiteuren vs Crediteuren</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={debiteurenAging}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="debiteuren"  fill="#1B3A5C" name="Debiteuren"  radius={[3,3,0,0]} />
            <Bar dataKey="crediteuren" fill="#C9A84C" name="Crediteuren" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Debiteuren table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#1B3A5C] mb-3 text-sm">Debiteuren per klant</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Klant</th>
                <th className="text-right py-1.5 font-semibold">Bedrag</th>
                <th className="text-right py-1.5 font-semibold">Dagen</th>
                <th className="text-right py-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {debiteurenPerKlant.map((r) => (
                <tr key={r.naam} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-700 font-medium">{r.naam}</td>
                  <td className="py-2 text-right text-gray-700">{euro(r.bedrag)}</td>
                  <td className="py-2 text-right text-gray-500">{r.dagen}d</td>
                  <td className="py-2 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.dagen < 30 ? "bg-green-100 text-green-700" :
                      r.dagen <= 60 ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.dagen < 30 ? "Op tijd" : r.dagen <= 60 ? "Laat" : "Kritiek"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Crediteuren table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#1B3A5C] mb-3 text-sm">Crediteuren per leverancier</h3>
          <div className="mb-3">
            <p className="text-xs text-gray-500">Totaal te betalen: <strong className="text-[#1B3A5C]">€38.000</strong></p>
            <p className="text-xs text-gray-500">Gemiddeld: <strong className="text-[#C9A84C]">36 dagen</strong></p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-1.5 font-semibold">Leverancier</th>
                <th className="text-right py-1.5 font-semibold">Bedrag</th>
                <th className="text-right py-1.5 font-semibold">Dagen</th>
                <th className="text-right py-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {crediteurenPerLeverancier.map((r) => (
                <tr key={r.naam} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-700 font-medium">{r.naam}</td>
                  <td className="py-2 text-right text-gray-700">{euro(r.bedrag)}</td>
                  <td className="py-2 text-right text-gray-500">{r.dagen}d</td>
                  <td className="py-2 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.dagen < 30 ? "bg-green-100 text-green-700" :
                      r.dagen <= 60 ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.dagen < 30 ? "Op tijd" : r.dagen <= 60 ? "Laat" : "Kritiek"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Prognose ──────────────────────────────────────────────────────────────
function PrognoseSection() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Omzetprognose 2025</h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Werkelijk t/m sep",  value: "€399.000", color: "#1B3A5C" },
          { label: "Verwacht rest jaar", value: "€159.000", color: "#C9A84C" },
          { label: "Jaarverwachting",    value: "€619.000", color: "#56a88f" },
          { label: "vs vorig jaar",      value: "+10,5%",   color: "#3d7ac8" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Werkelijk vs Prognose omzet</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={prognoseMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={[25000, 65000]} />
            <Tooltip
              formatter={(v) => v !== null ? euro(v as number) : "—"}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="werkelijk"
              stroke="#1B3A5C"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              name="Werkelijk"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="prognose"
              stroke="#C9A84C"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4 }}
              name="Prognose"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/10 rounded-xl p-4">
        <p className="text-sm text-[#1B3A5C] font-medium">
          <span className="font-bold">Prognose inzicht:</span>{" "}
          Op basis van het huidige groeitempo verwachten we een omzet van €619.000 voor heel 2025.
          Dat is 10,5% boven de tot-nu-toe gerealiseerde €560.000.
        </p>
      </div>
    </div>
  );
}

// ─── Cashflow tab (Liquiditeit) ───────────────────────────────────────────────
function CashflowTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totaal ontvangen",  value: "€529.000", sub: "Alle inkomsten 2025" },
          { label: "Totaal uitgegeven", value: "€401.000", sub: "Alle uitgaven 2025" },
          { label: "Netto cashflow",    value: "€128.000", sub: "Ontvangen min uitgegeven" },
          { label: "Eindbalans",        value: "€128.000", sub: "Cumulatief december" },
        ].map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <ChartCard title="Inkomsten vs Uitgaven per maand">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashflowMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="inkomsten" fill="#1B3A5C" name="Inkomsten" radius={[4,4,0,0]} />
            <Bar dataKey="uitgaven"  fill="#C9A84C" name="Uitgaven"  radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Cumulatieve cashflow & netto per maand">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={cashflowMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto","auto"]} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="cumulatief" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Cumulatief" />
            <Line type="monotone" dataKey="netto"      stroke="#C9A84C" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} name="Netto per maand" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightsCard items={[
        "Wanneer je krap bij kas zit — augustus had de laagste netto cashflow (€3.000)",
        "Of je genoeg buffer hebt voor grote uitgaven of investeringen",
        "Seizoenspatronen in geldstromen — zomerdip zichtbaar in juli en augustus",
        "Of inkomsten en uitgaven goed op elkaar aansluiten per maand",
        "Wanneer je veilig kunt investeren op basis van de cumulatieve opbouw",
        "Hoe snel je cashpositie groeit over het jaar",
      ]} />

      <div>
        <div className="mb-3">
          <h3 className="font-bold text-[#1B3A5C]">Stel een vraag aan de AI-assistent</h3>
          <p className="text-sm text-gray-400 mt-1">De assistent kent alle bovenstaande data en genereert grafieken op basis van jouw vragen.</p>
        </div>
        <DemoDashboardChat context={CASHFLOW_CONTEXT} suggestions={CASHFLOW_SUGGESTIONS} />
      </div>
    </div>
  );
}

// ─── Sales tab ────────────────────────────────────────────────────────────────
function SalesTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totale omzet",           value: "€560.000", sub: "Januari – December 2025" },
          { label: "Aantal klanten",          value: "6",        sub: "Actieve klanten 2025" },
          { label: "Grootste klant",          value: "€87.000",  sub: "Retail BV" },
          { label: "Groei t.o.v. vorig jaar", value: "+21%",     sub: "2024 → 2025" },
        ].map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Omzet per klant">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={omzetPerKlant} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <YAxis dataKey="naam" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={72} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="omzet" fill="#1B3A5C" name="Omzet" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Omzet 2025 vs 2024">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesMaand}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto","auto"]} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="huidig" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="2025" />
              <Line type="monotone" dataKey="vorig"  stroke="#94a3b8" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} name="2024" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <InsightsCard items={[
        "Welke klanten het meest bijdragen aan je omzet — en of je te afhankelijk bent van één klant",
        "Hoe je groei verloopt t.o.v. vorig jaar — per maand en in totaal",
        "Welke maanden de topmaanden zijn voor sales — Q4 scoort het beste",
        "Of je klantenportfolio gespreid genoeg is om risico te beperken",
        "Waar je salesfocus moet liggen om groei te versnellen",
        "Welke klanten zijn gegroeid of juist gekrompen t.o.v. vorig jaar",
      ]} />

      <div>
        <div className="mb-3">
          <h3 className="font-bold text-[#1B3A5C]">Stel een vraag aan de AI-assistent</h3>
          <p className="text-sm text-gray-400 mt-1">De assistent kent alle bovenstaande data en genereert grafieken op basis van jouw vragen.</p>
        </div>
        <DemoDashboardChat context={SALES_CONTEXT} suggestions={SALES_SUGGESTIONS} />
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1B3A5C]">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-[#1B3A5C] mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InsightsCard({ items }: { items: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-[#1B3A5C] mb-4">Wat haal je uit dit dashboard?</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
            <span className="w-5 h-5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── 6. Kosten ────────────────────────────────────────────────────────────────
function KostenSection() {
  const kostenData = [
    { maand: "Jan", personeel: 6500, inkoop: 2800, huur: 1800, marketing: 800, overig: 600 },
    { maand: "Feb", personeel: 6500, inkoop: 3100, huur: 1800, marketing: 900, overig: 700 },
    { maand: "Mrt", personeel: 6800, inkoop: 3500, huur: 1800, marketing: 1100, overig: 800 },
    { maand: "Apr", personeel: 6800, inkoop: 3700, huur: 1800, marketing: 1200, overig: 900 },
    { maand: "Mei", personeel: 7000, inkoop: 4000, huur: 1800, marketing: 1300, overig: 900 },
    { maand: "Jun", personeel: 7000, inkoop: 4300, huur: 1800, marketing: 1400, overig: 900 },
    { maand: "Jul", personeel: 7200, inkoop: 3200, huur: 1800, marketing: 900, overig: 800 },
    { maand: "Aug", personeel: 7200, inkoop: 3000, huur: 1800, marketing: 700, overig: 800 },
    { maand: "Sep", personeel: 7200, inkoop: 3800, huur: 1800, marketing: 1100, overig: 900 },
    { maand: "Okt", personeel: 7500, inkoop: 4400, huur: 1800, marketing: 1400, overig: 900 },
    { maand: "Nov", personeel: 7500, inkoop: 4600, huur: 1800, marketing: 1500, overig: 1000 },
    { maand: "Dec", personeel: 7500, inkoop: 3600, huur: 1800, marketing: 1100, overig: 1100 },
  ];
  const totaalPerCat = [
    { name: "Personeel", value: 85700, pct: 60 },
    { name: "Inkoop",    value: 44000, pct: 31 },
    { name: "Huur",      value: 21600, pct: 15 },
    { name: "Marketing", value: 12400, pct: 9  },
    { name: "Overig",    value: 10100, pct: 7  },
  ];
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Kostenanalyse 2025</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Totale kosten",       value: "€365.800", sub: "Alle categorieën 2025" },
          { label: "Grootste kostenpost", value: "Personeel", sub: "60% van totale kosten" },
          { label: "Kosten/omzet ratio",  value: "65,3%",    sub: "Per euro omzet €0,65 kosten" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold text-[#1B3A5C]">{k.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Kosten per categorie per maand</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={kostenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="personeel" stackId="a" fill="#1B3A5C" name="Personeel" />
            <Bar dataKey="inkoop"    stackId="a" fill="#C9A84C" name="Inkoop" />
            <Bar dataKey="huur"      stackId="a" fill="#3d7ac8" name="Huur" />
            <Bar dataKey="marketing" stackId="a" fill="#e07b39" name="Marketing" />
            <Bar dataKey="overig"    stackId="a" fill="#56a88f" name="Overig" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Verdeling totale kosten</h3>
        <div className="space-y-3">
          {totaalPerCat.map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-xs text-gray-600 font-medium">{r.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full bg-[#1B3A5C]" style={{ width: `${r.pct}%` }} />
              </div>
              <div className="w-20 text-right text-xs font-bold text-[#1B3A5C]">{euro(r.value)}</div>
              <div className="w-8 text-right text-xs text-gray-400">{r.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 7. Benchmark ─────────────────────────────────────────────────────────────
function BenchmarkSection() {
  const benchmarkData = [
    { metric: "Brutomarge",   eigen: 60,  branche: 45, eenheid: "%" },
    { metric: "Nettomarge",   eigen: 34.7,branche: 12, eenheid: "%" },
    { metric: "OPEX ratio",   eigen: 25.3,branche: 33, eenheid: "%" },
    { metric: "DSO",          eigen: 32,  branche: 45, eenheid: " d" },
    { metric: "Current ratio",eigen: 2.1, branche: 1.5,eenheid: "x" },
  ];
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Benchmarking — jij vs. branchegemiddelde</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Beter dan gemiddelde", value: "4 van 5", sub: "KPI's boven branchenorm", color: "#56a88f" },
          { label: "Brutomarge voordeel",  value: "+15%",    sub: "Boven branchegemiddelde", color: "#56a88f" },
          { label: "Nettomarge voordeel",  value: "+22,7%",  sub: "Sterk bovengemiddeld",   color: "#56a88f" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Jij vs. branchegemiddelde per KPI</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={benchmarkData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="metric" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="eigen"   fill="#1B3A5C" name="Uw bedrijf"         radius={[0,4,4,0]} />
            <Bar dataKey="branche" fill="#94a3b8" name="Branchegemiddelde"  radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-4 text-sm">Gedetailleerde vergelijking</h3>
        <div className="space-y-4">
          {benchmarkData.map((r) => {
            const isBeter = r.metric === "DSO" || r.metric === "OPEX ratio"
              ? r.eigen < r.branche
              : r.eigen > r.branche;
            return (
              <div key={r.metric} className="flex items-center gap-4">
                <div className="w-28 shrink-0 text-xs font-medium text-gray-600">{r.metric}</div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1B3A5C]">{r.eigen}{r.eenheid}</span>
                  <span className="text-xs text-gray-400">vs. {r.branche}{r.eenheid} branche</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBeter ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {isBeter ? "✓ Beter" : "✗ Onder gem."}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 8. Break-even ────────────────────────────────────────────────────────────
function BreakevenSection() {
  const vaste = 163200; // huur + deel personeel + afschrijvingen
  const variabelePct = 0.40; // 40% van omzet zijn variabele kosten (COGS)
  const breakeven = Math.round(vaste / (1 - variabelePct)); // = 272.000
  const huidigeOmzet = 560000;
  const buffer = huidigeOmzet - breakeven;
  const breakevenData = [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 560000].map((omzet) => ({
    omzet,
    kosten: Math.round(vaste + omzet * variabelePct),
    omzetLijn: omzet,
  }));
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1B3A5C]">Break-even analyse 2025</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Break-even omzet",   value: "€272.000", sub: "Minimale omzet om quitte te spelen", color: "#e07b39" },
          { label: "Huidige omzet",      value: "€560.000", sub: "Werkelijke omzet 2025",             color: "#1B3A5C" },
          { label: "Veiligheidsmarge",   value: "€288.000", sub: "Buffer boven break-even (51%)",     color: "#56a88f" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-1 text-sm">Break-even grafiek</h3>
        <p className="text-xs text-gray-400 mb-4">Kruispunt = break-even punt. Rechts van het kruispunt = winst, links = verlies.</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={breakevenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="omzet" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="kosten"    stroke="#e07b39" strokeWidth={2.5} dot={false} name="Totale kosten" />
            <Line type="monotone" dataKey="omzetLijn" stroke="#1B3A5C" strokeWidth={2.5} dot={false} name="Omzet" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B3A5C] mb-3 text-sm">Kostenstructuur</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Vaste kosten</p>
            {[
              { naam: "Personeel (vast deel)", bedrag: 84000 },
              { naam: "Huur & huisvesting",    bedrag: 21600 },
              { naam: "Afschrijvingen",        bedrag: 32400 },
              { naam: "Overige vaste kosten",  bedrag: 25200 },
            ].map((r) => (
              <div key={r.naam} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                <span className="text-gray-600">{r.naam}</span>
                <span className="font-bold text-[#1B3A5C]">{euro(r.bedrag)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs py-2 font-bold">
              <span className="text-gray-700">Totaal vast</span>
              <span className="text-[#e07b39]">€163.200</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Variabele kosten</p>
            {[
              { naam: "Inkoop / COGS", bedrag: "40% van omzet" },
              { naam: "Variabel personeel", bedrag: "bij groei" },
              { naam: "Marketing variabel", bedrag: "bij campagnes" },
            ].map((r) => (
              <div key={r.naam} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                <span className="text-gray-600">{r.naam}</span>
                <span className="font-bold text-[#C9A84C]">{r.bedrag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

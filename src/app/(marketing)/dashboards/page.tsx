"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
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

// ─── Finance data ─────────────────────────────────────────────────────────────
const financeMaand = [
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
const kostenCat = [
  { name: "Personeel", value: 198000 },
  { name: "Inkoop", value: 85000 },
  { name: "Huisvesting", value: 42000 },
  { name: "Marketing", value: 28000 },
  { name: "Overig", value: 34500 },
];
const FINANCE_CONTEXT = `Finance dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | Totale kosten: €338.000 | Brutomarge: 39,6% | Nettoresultaat: €222.000
Omzet per maand: Jan €35.000, Feb €38.000, Mrt €44.000, Apr €47.000, Mei €52.000, Jun €55.000, Jul €41.000, Aug €38.000, Sep €49.000, Okt €56.000, Nov €59.000, Dec €46.000
Kosten per maand: Jan €22.000, Feb €23.500, Mrt €26.000, Apr €28.000, Mei €30.000, Jun €31.500, Jul €27.000, Aug €25.000, Sep €29.500, Okt €33.000, Nov €34.500, Dec €28.000
Kosten per categorie: Personeel €198.000, Inkoop €85.000, Huisvesting €42.000, Marketing €28.000, Overig €34.500`;
const FINANCE_SUGGESTIONS = [
  "Welke maand had de hoogste marge?",
  "Maak een grafiek van omzet vs kosten",
  "Toon de kosten per categorie als taartdiagram",
  "Hoe ontwikkelt de brutomarge zich?",
  "Wanneer was het beste moment om te investeren?",
];

// ─── Cashflow data ────────────────────────────────────────────────────────────
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
const CASHFLOW_CONTEXT = `Cashflow dashboard — Voorbeeld BV 2025
Totaal ontvangen: €529.000 | Totaal uitgegeven: €401.000 | Netto cashflow: €128.000 | Eindbalans: €128.000
Per maand — inkomsten / uitgaven / netto / cumulatief:
Jan €32.000 / €28.000 / €4.000 / €4.000 | Feb €35.000 / €31.000 / €4.000 / €8.000
Mrt €41.000 / €29.000 / €12.000 / €20.000 | Apr €44.000 / €35.000 / €9.000 / €29.000
Mei €49.000 / €32.000 / €17.000 / €46.000 | Jun €53.000 / €38.000 / €15.000 / €61.000
Jul €38.000 / €34.000 / €4.000 / €65.000 | Aug €36.000 / €33.000 / €3.000 / €68.000
Sep €47.000 / €31.000 / €16.000 / €84.000 | Okt €54.000 / €36.000 / €18.000 / €102.000
Nov €57.000 / €39.000 / €18.000 / €120.000 | Dec €43.000 / €35.000 / €8.000 / €128.000`;
const CASHFLOW_SUGGESTIONS = [
  "Welke maand had de laagste cashflow?",
  "Maak een grafiek van inkomsten vs uitgaven",
  "Toon de cumulatieve cashflow als lijndiagram",
  "Wanneer kon ik het best investeren?",
  "Zijn er maanden waarbij ik krap bij kas zat?",
];

// ─── Sales data ───────────────────────────────────────────────────────────────
const omzetPerKlant = [
  { naam: "Retail BV",  omzet: 87000 },
  { naam: "Tech Corp",  omzet: 74000 },
  { naam: "Horeca NL",  omzet: 65000 },
  { naam: "Bouw & Co",  omzet: 52000 },
  { naam: "Zorg Plus",  omzet: 41000 },
  { naam: "Overig",     omzet: 38000 },
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
const SALES_CONTEXT = `Sales dashboard — Voorbeeld BV 2025
Totale omzet: €560.000 | Aantal klanten: 6 | Grootste klant: Retail BV €87.000 | Groei t.o.v. vorig jaar: +21%
Omzet per klant: Retail BV €87.000, Tech Corp €74.000, Horeca NL €65.000, Bouw & Co €52.000, Zorg Plus €41.000, Overig €38.000
Omzet 2025 vs 2024 per maand: Jan €35k/€28k, Feb €38k/€31k, Mrt €44k/€35k, Apr €47k/€38k, Mei €52k/€42k, Jun €55k/€44k, Jul €41k/€36k, Aug €38k/€33k, Sep €49k/€40k, Okt €56k/€46k, Nov €59k/€48k, Dec €46k/€39k`;
const SALES_SUGGESTIONS = [
  "Welke klant levert de meeste omzet?",
  "Vergelijk omzet 2025 met 2024",
  "Maak een grafiek van omzet per klant",
  "Ben ik te afhankelijk van één klant?",
  "Welke maanden waren de topmaanden?",
];

// ─── Tabs config ──────────────────────────────────────────────────────────────
type Tab = "finance" | "cashflow" | "sales";
const TABS: { id: Tab; label: string; icon: React.ReactNode; sub: string }[] = [
  { id: "finance",  label: "Finance",  icon: <BarChart2 size={16} />,    sub: "Omzet · Kosten · Marge" },
  { id: "cashflow", label: "Cashflow", icon: <TrendingUp size={16} />,   sub: "Liquiditeit · Inkomsten" },
  { id: "sales",    label: "Sales",    icon: <ShoppingCart size={16} />, sub: "Klanten · Groei" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("finance");

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-[#1B3A5C] text-white py-14 px-4">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {TABS.map((t) => (
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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {activeTab === "finance"  && <FinanceTab />}
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

// ─── Finance tab ──────────────────────────────────────────────────────────────
function FinanceTab() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totale omzet",   value: "€560.000", sub: "Januari – December 2025" },
          { label: "Totale kosten",  value: "€338.000", sub: "Alle categorieën" },
          { label: "Brutomarge",     value: "39,6%",    sub: "Gemiddeld over het jaar" },
          { label: "Nettoresultaat", value: "€222.000", sub: "Na alle kosten" },
        ].map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Omzet vs Kosten per maand">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={financeMaand}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="omzet"  fill="#1B3A5C" name="Omzet"  radius={[4,4,0,0]} />
              <Bar dataKey="kosten" fill="#C9A84C" name="Kosten" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kosten per categorie">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={kostenCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {kostenCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Brutomarge per maand">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={financeMaand}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="maand" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto","auto"]} />
            <Tooltip formatter={(v) => euro(v as number)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Line type="monotone" dataKey="marge" stroke="#1B3A5C" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Marge" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightsCard items={[
        "Welke maanden de hoogste en laagste marge hadden — handig voor seizoensplanning",
        "Of kosten in lijn zijn met de omzetgroei — of je efficiënt schaalt",
        "Welke kostenpost het zwaarst weegt: personeel, inkoop of huisvesting",
        "Hoe het nettoresultaat zich verhoudt tot de omzetdoelstelling",
        "Wanneer het beste moment is om te investeren of reserves op te bouwen",
        "Seizoenspatronen in omzet en kosten — zomer vs. winter, Q4-piek",
      ]} />

      <ChatSection context={FINANCE_CONTEXT} suggestions={FINANCE_SUGGESTIONS} />
    </>
  );
}

// ─── Cashflow tab ─────────────────────────────────────────────────────────────
function CashflowTab() {
  return (
    <>
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

      <ChatSection context={CASHFLOW_CONTEXT} suggestions={CASHFLOW_SUGGESTIONS} />
    </>
  );
}

// ─── Sales tab ────────────────────────────────────────────────────────────────
function SalesTab() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totale omzet",           value: "€560.000", sub: "Januari – December 2025" },
          { label: "Aantal klanten",          value: "6",        sub: "Actieve klanten 2025" },
          { label: "Grootste klant",          value: "€87.000", sub: "Retail BV" },
          { label: "Groei t.o.v. vorig jaar", value: "+21%",    sub: "2024 → 2025" },
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

      <ChatSection context={SALES_CONTEXT} suggestions={SALES_SUGGESTIONS} />
    </>
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

function ChatSection({ context, suggestions }: { context: string; suggestions: string[] }) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="font-bold text-[#1B3A5C]">Stel een vraag aan de AI-assistent</h3>
        <p className="text-sm text-gray-400 mt-1">De assistent kent alle bovenstaande data en genereert grafieken op basis van jouw vragen.</p>
      </div>
      <DemoDashboardChat context={context} suggestions={suggestions} />
    </div>
  );
}

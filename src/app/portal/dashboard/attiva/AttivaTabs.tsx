"use client";

import { useState } from "react";
import { BarChart2, FileText, TrendingUp } from "lucide-react";
import AttivaCharts from "./AttivaCharts";
import DeclaratiesSection from "./DeclaratiesSection";
import CashflowSection from "./CashflowSection";

const TABS = [
  { id: "financieel", label: "Financieel overzicht", icon: BarChart2 },
  { id: "cashflow", label: "Cashflow", icon: TrendingUp },
  { id: "declaraties", label: "Declaratieoverzicht", icon: FileText },
];

export default function AttivaTabs({ isConnected }: { isConnected: boolean }) {
  const [active, setActive] = useState("financieel");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active === tab.id
                ? "bg-white text-navy-700 shadow-sm"
                : "text-gray-400 hover:text-navy-700"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "financieel" && (
        isConnected ? <AttivaCharts /> : (
          <div className="card text-center py-20 space-y-6">
            <div className="w-16 h-16 bg-navy-700/5 rounded-2xl flex items-center justify-center mx-auto">
              <BarChart2 size={28} className="text-navy-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-700 mb-2">Koppel Exact Online</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Verbind Exact Online met dit dashboard om financiële gegevens te bekijken.
              </p>
            </div>
            <a href="/api/exact/auth"
              className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Koppel Exact Online
            </a>
          </div>
        )
      )}

      {active === "cashflow" && (
        isConnected ? <CashflowSection /> : (
          <div className="card text-center py-20 space-y-6">
            <div className="w-16 h-16 bg-navy-700/5 rounded-2xl flex items-center justify-center mx-auto">
              <TrendingUp size={28} className="text-navy-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-700 mb-2">Koppel Exact Online</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Verbind Exact Online met dit dashboard om cashflow gegevens te bekijken.
              </p>
            </div>
            <a href="/api/exact/auth"
              className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Koppel Exact Online
            </a>
          </div>
        )
      )}

      {active === "declaraties" && <DeclaratiesSection />}
    </div>
  );
}

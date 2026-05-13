"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart2, FileText, TrendingUp, Wallet } from "lucide-react";
import AttivaCharts from "./AttivaCharts";
import DeclaratiesSection from "./DeclaratiesSection";
import CashflowSection from "./CashflowSection";
import CrediteurenSection from "./CrediteurenSection";

const TABS = [
  { id: "financieel", label: "Financieel overzicht", icon: BarChart2 },
  { id: "cashflow", label: "Cashflow", icon: TrendingUp },
  { id: "crediteuren", label: "Crediteuren", icon: Wallet },
  { id: "declaraties", label: "Declaratieoverzicht", icon: FileText },
];

export type AttivaTabId = "financieel" | "cashflow" | "crediteuren" | "declaraties";

export default function AttivaTabs({ isConnected }: { isConnected: boolean }) {
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab");
    if (t === "cashflow" || t === "crediteuren" || t === "declaraties") return t;
    return "financieel";
  })();
  const [active, setActive] = useState<AttivaTabId>(initialTab);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  // ?tab=… of #anchor in URL respecteren bij navigatie binnen de app
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "cashflow" || t === "crediteuren" || t === "declaraties" || t === "financieel") {
      setActive(t);
    }
  }, [searchParams]);

  // Hash (bv. #sectie-marge) → smooth scroll na laden
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(timer);
  }, [active]);

  // Cross-tab navigatie + smooth scroll naar sectie binnen de tab
  function navigate(tab: AttivaTabId, sectionId?: string) {
    setActive(tab);
    if (sectionId) {
      setScrollTarget(sectionId);
    }
  }

  useEffect(() => {
    if (!scrollTarget) return;
    // Wacht op render van nieuwe tab-content
    const timer = setTimeout(() => {
      const el = document.getElementById(scrollTarget);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollTarget(null);
    }, 200);
    return () => clearTimeout(timer);
  }, [active, scrollTarget]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id as AttivaTabId)}
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
        isConnected ? <AttivaCharts onNavigate={navigate} /> : (
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

      {active === "crediteuren" && (
        isConnected ? <CrediteurenSection /> : (
          <div className="card text-center py-20 space-y-6">
            <div className="w-16 h-16 bg-navy-700/5 rounded-2xl flex items-center justify-center mx-auto">
              <Wallet size={28} className="text-navy-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-700 mb-2">Koppel Exact Online</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Verbind Exact Online met dit dashboard om crediteuren en openstaande facturen te bekijken.
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

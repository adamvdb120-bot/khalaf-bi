"use client";

import { useEffect } from "react";
import { X, TrendingDown, TrendingUp, ArrowDown, ArrowUp } from "lucide-react";

export interface WaaromOorzaak {
  name: string;
  delta: number;   // bedrag (€), teken volgt de KPI-richting
  vorig: number;
  nu: number;
}

export interface WaaromData {
  titel: string;                // "Waarom is je resultaat gedaald?" / "...gestegen?"
  periode: string;              // bv. "vs zelfde periode 2024"
  netDelta: number;             // bv. -62.764 (negatief = verslechterd voor resultaat)
  omzetDelta: number;           // bv. -26.770
  kostenDelta: number;          // bv. +36.244 (positief = meer kosten = slechter voor resultaat)
  topKostenStijgers: WaaromOorzaak[];   // delta > 0, gesorteerd desc
  topOmzetDalers: WaaromOorzaak[];      // delta < 0, gesorteerd asc (meest negatief eerst)
  conclusie: string;            // 1-2 zinnen klare-taal samenvatting
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: WaaromData | null;
}

function euro(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : v > 0 ? "+" : "";
  return `${sign}€ ${Math.round(abs).toLocaleString("nl-NL")}`;
}

function euroAbs(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

export default function WaaromModal({ open, onClose, data }: Props) {
  // Close on Esc
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  const isVerslechtering = data.netDelta < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isVerslechtering ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : (
                <TrendingUp size={16} className="text-emerald-600" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Waarom-analyse
              </span>
            </div>
            <h2 className="text-xl font-bold text-navy-700">{data.titel}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{data.periode}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluit"
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Netto-effect blok */}
          <div className={`rounded-xl border p-4 ${
            isVerslechtering ? "border-red-100 bg-red-50/40" : "border-emerald-100 bg-emerald-50/40"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Netto-effect
            </p>
            <p className={`text-2xl font-bold ${isVerslechtering ? "text-red-700" : "text-emerald-700"}`}>
              {euro(data.netDelta)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Opgebouwd uit{" "}
              <strong>{euro(data.omzetDelta)}</strong> omzet en{" "}
              <strong>{euro(-data.kostenDelta)}</strong> kosten-effect
              <span className="text-gray-400"> (kosten zijn omgekeerd: een stijging drukt het resultaat)</span>
            </p>
          </div>

          {/* Top kostenstijgers */}
          {data.topKostenStijgers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUp size={13} className="text-red-600" />
                <h3 className="text-sm font-bold text-navy-700">Grootste kostenstijgers</h3>
              </div>
              <div className="space-y-2">
                {data.topKostenStijgers.map((o, i) => (
                  <OorzaakRij key={o.name} rank={i + 1} oorzaak={o} kleur="red" />
                ))}
              </div>
            </div>
          )}

          {/* Top omzetdalers */}
          {data.topOmzetDalers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowDown size={13} className="text-amber-600" />
                <h3 className="text-sm font-bold text-navy-700">Grootste omzetdalers</h3>
              </div>
              <div className="space-y-2">
                {data.topOmzetDalers.map((o, i) => (
                  <OorzaakRij key={o.name} rank={i + 1} oorzaak={o} kleur="amber" />
                ))}
              </div>
            </div>
          )}

          {/* Geen materiele oorzaken */}
          {data.topKostenStijgers.length === 0 && data.topOmzetDalers.length === 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
              <p className="text-sm text-gray-500">
                Geen materiele afwijkingen op postniveau gevonden voor deze periode.
              </p>
            </div>
          )}

          {/* Conclusie */}
          <div className="rounded-xl bg-navy-700/5 border border-navy-700/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-700 mb-2">
              Conclusie
            </p>
            <p className="text-sm text-navy-700 leading-relaxed">{data.conclusie}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-navy-700 transition-colors px-3 py-1.5"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

function OorzaakRij({
  rank,
  oorzaak,
  kleur,
}: {
  rank: number;
  oorzaak: WaaromOorzaak;
  kleur: "red" | "amber";
}) {
  const deltaColor = kleur === "red" ? "text-red-700" : "text-amber-700";
  const rankBg = kleur === "red" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
  const pct = oorzaak.vorig > 0 ? (oorzaak.delta / oorzaak.vorig) * 100 : null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white border border-gray-100 p-3">
      <div className={`w-6 h-6 rounded-full ${rankBg} text-[11px] font-bold flex items-center justify-center flex-shrink-0`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 truncate" title={oorzaak.name}>
          {oorzaak.name}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Was {euroAbs(oorzaak.vorig)} → nu {euroAbs(oorzaak.nu)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${deltaColor}`}>
          {euro(oorzaak.delta)}
        </p>
        {pct !== null && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {pct >= 0 ? "+" : ""}{pct.toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  );
}

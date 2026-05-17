"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X, TrendingDown, TrendingUp, ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";

export interface WaaromOorzaak {
  name: string;
  delta: number;   // bedrag (€); teken volgt de werkelijke richting van de post
  vorig: number;
  nu: number;
}

export type WaaromTone = "red" | "amber" | "emerald" | "navy";

export interface WaaromSection {
  label: string;                          // bv. "Grootste kostenstijgers"
  iconDirection: "up" | "down";           // pijl-richting van het icoon
  tone: WaaromTone;                       // accent-kleur van de sectie
  oorzaken: WaaromOorzaak[];              // gesorteerd op relevantie
  /**
   * Optioneel: maakt elke oorzaak-rij uitklapbaar (chevron-icoon). Bij klik
   * roept de modal deze functie aan om de detail-inhoud onder de rij te
   * renderen — bv. een lazy-fetched cliënt-drilldown.
   */
  expandRenderer?: (oorzaak: WaaromOorzaak) => ReactNode;
}

export interface WaaromHoofdMetric {
  label: string;            // bv. "Netto-effect", "Omzet-effect"
  waarde: number;           // bv. +53035 of -37366
  uitleg?: string;          // optionele tweede regel (bv. breakdown voor Resultaat)
  isPositief: boolean;      // bepaalt groen vs rood vs neutraal
}

export interface WaaromData {
  titel: string;                       // bv. "Waarom is je resultaat gedaald?"
  periode: string;                     // bv. "Vergelijking: 2025 (t/m maand 12) vs zelfde periode 2024"
  hoofdMetric?: WaaromHoofdMetric;     // optioneel; bij Resultaat verklarend, bij Omzet/Kosten cijfer-zelf
  sections: WaaromSection[];           // 0..N oorzaak-secties
  conclusie: string;                   // 1-2 zinnen klare-taal samenvatting
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
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  // Header-icon op basis van hoofdMetric (fallback naar neutraal)
  const headerIsPositief = data.hoofdMetric?.isPositief ?? true;

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
              {headerIsPositief ? (
                <TrendingUp size={16} className="text-emerald-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
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
          {/* HoofdMetric block (optioneel) */}
          {data.hoofdMetric && (
            <div className={`rounded-xl border p-4 ${
              data.hoofdMetric.isPositief
                ? "border-emerald-100 bg-emerald-50/40"
                : "border-red-100 bg-red-50/40"
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                {data.hoofdMetric.label}
              </p>
              <p className={`text-2xl font-bold ${
                data.hoofdMetric.isPositief ? "text-emerald-700" : "text-red-700"
              }`}>
                {euro(data.hoofdMetric.waarde)}
              </p>
              {data.hoofdMetric.uitleg && (
                <p className="text-xs text-gray-600 mt-2">{data.hoofdMetric.uitleg}</p>
              )}
            </div>
          )}

          {/* Secties */}
          {data.sections.map((section, idx) => (
            section.oorzaken.length > 0 && (
              <div key={`${section.label}-${idx}`}>
                <div className="flex items-center gap-2 mb-3">
                  {section.iconDirection === "up" ? (
                    <ArrowUp size={13} className={iconColorClass(section.tone)} />
                  ) : (
                    <ArrowDown size={13} className={iconColorClass(section.tone)} />
                  )}
                  <h3 className="text-sm font-bold text-navy-700">{section.label}</h3>
                </div>
                <div className="space-y-2">
                  {section.oorzaken.map((o, i) => (
                    <OorzaakRij
                      key={o.name}
                      rank={i + 1}
                      oorzaak={o}
                      tone={section.tone}
                      expandRenderer={section.expandRenderer}
                    />
                  ))}
                </div>
              </div>
            )
          ))}

          {/* Geen secties met inhoud → fallback */}
          {data.sections.every(s => s.oorzaken.length === 0) && (
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

function iconColorClass(tone: WaaromTone): string {
  switch (tone) {
    case "red": return "text-red-600";
    case "amber": return "text-amber-600";
    case "emerald": return "text-emerald-600";
    case "navy": return "text-navy-700";
  }
}

function OorzaakRij({
  rank,
  oorzaak,
  tone,
  expandRenderer,
}: {
  rank: number;
  oorzaak: WaaromOorzaak;
  tone: WaaromTone;
  expandRenderer?: (o: WaaromOorzaak) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable = !!expandRenderer;

  const deltaColor = {
    red: "text-red-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    navy: "text-navy-700",
  }[tone];

  const rankBg = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    navy: "bg-navy-700/10 text-navy-700",
  }[tone];

  const pct = oorzaak.vorig > 0 ? (oorzaak.delta / oorzaak.vorig) * 100 : null;

  const RowEl = isExpandable ? "button" : "div";

  return (
    <div>
      <RowEl
        onClick={isExpandable ? () => setExpanded((v) => !v) : undefined}
        className={`w-full flex items-center gap-3 rounded-lg bg-white border border-gray-100 p-3 text-left ${
          isExpandable ? "hover:border-navy-200 hover:bg-gray-50 transition-colors cursor-pointer" : ""
        }`}
      >
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
        {isExpandable && (
          <div className="flex-shrink-0 ml-1 text-gray-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </RowEl>
      {isExpandable && expanded && expandRenderer && expandRenderer(oorzaak)}
    </div>
  );
}

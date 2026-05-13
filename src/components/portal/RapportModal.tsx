"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, FileText, Calendar, BarChart3, TrendingUp, Wallet, Receipt, Loader2,
} from "lucide-react";
import { generateRapportPDF, type RapportType } from "@/lib/pdf-export";

interface Props {
  open: boolean;
  onClose: () => void;
  /** id van het DOM-element met de huidige dashboard-content */
  targetId: string;
  clientName: string;
  clientSlug: string;
  /** Default jaar van de dashboard-state */
  jaarDefault: number;
}

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const MAANDEN_VOL = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

const RAPPORT_TYPES: { value: RapportType; label: string; icon: typeof BarChart3; beschikbaar: boolean; tooltip: string }[] = [
  { value: "financieel", label: "Financieel overzicht", icon: BarChart3, beschikbaar: true, tooltip: "Omzet, kosten, marge, KPI's en grafieken" },
  { value: "cashflow", label: "Cashflow", icon: TrendingUp, beschikbaar: false, tooltip: "Binnenkort beschikbaar" },
  { value: "crediteuren", label: "Crediteuren", icon: Wallet, beschikbaar: false, tooltip: "Binnenkort beschikbaar" },
  { value: "declaraties", label: "Declaraties", icon: Receipt, beschikbaar: false, tooltip: "Binnenkort beschikbaar" },
];

export default function RapportModal({ open, onClose, targetId, clientName, clientSlug, jaarDefault }: Props) {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<RapportType>("financieel");
  const [periode, setPeriode] = useState<"jaar" | "kwartaal" | "maand">("jaar");
  const [jaar, setJaar] = useState<number>(jaarDefault);
  const [maandIdx, setMaandIdx] = useState<number>(new Date().getMonth());
  const [kwartaal, setKwartaal] = useState<1 | 2 | 3 | 4>(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setJaar(jaarDefault); }, [jaarDefault]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const huidigJaar = new Date().getFullYear();
  const beschikbareJaren = [huidigJaar, huidigJaar - 1, huidigJaar - 2].filter(j => j >= 2024);

  const typeMeta = RAPPORT_TYPES.find(t => t.value === type)!;

  // Periode label en maand-suffix voor bestandsnaam
  const { periodeLabel, maandSuffix } = (() => {
    if (periode === "jaar") return { periodeLabel: `Heel jaar ${jaar}`, maandSuffix: undefined };
    if (periode === "kwartaal") return { periodeLabel: `Q${kwartaal} ${jaar}`, maandSuffix: `Q${kwartaal}` };
    return { periodeLabel: `${MAANDEN_VOL[maandIdx]} ${jaar}`, maandSuffix: MAANDEN_VOL[maandIdx] };
  })();

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    // Sluit de modal eerst zodat html2canvas een schone dashboard ziet,
    // niet de modal met backdrop/blur. Wacht 250ms voor re-render.
    onClose();
    await new Promise(r => setTimeout(r, 250));
    try {
      await generateRapportPDF({
        targetId,
        clientName,
        clientSlug,
        reportType: type,
        reportTypeLabel: typeMeta.label,
        jaar,
        maand: maandSuffix,
        periodeLabel,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Genereren mislukt");
      // Modal kan al gesloten zijn — toon dan een alert
      alert(`PDF-genereren mislukt: ${e instanceof Error ? e.message : "Onbekende fout"}`);
    } finally {
      setGenerating(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-navy-700 text-lg">Rapport genereren</h3>
            <p className="text-xs text-gray-400 mt-0.5">Stel rapporttype en periode in. Download als PDF met voorblad.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type kiezen */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Rapporttype
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RAPPORT_TYPES.map((t) => {
                const Icon = t.icon;
                const isActive = type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => t.beschikbaar && setType(t.value)}
                    disabled={!t.beschikbaar}
                    title={t.tooltip}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      !t.beschikbaar
                        ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : isActive
                        ? "border-navy-700 bg-navy-700/5 text-navy-700"
                        : "border-gray-200 hover:border-navy-300 text-navy-700"
                    }`}
                  >
                    <Icon size={16} className={!t.beschikbaar ? "text-gray-300" : isActive ? "text-navy-700" : "text-gray-400"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{t.label}</div>
                      {!t.beschikbaar && <div className="text-[10px] text-gray-400">Binnenkort</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periode kiezen */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Periode
            </label>
            <div className="flex gap-2 mb-3">
              {(["jaar", "kwartaal", "maand"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    periode === p
                      ? "bg-navy-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p === "jaar" ? "Heel jaar" : p === "kwartaal" ? "Kwartaal" : "Maand"}
                </button>
              ))}
            </div>

            {/* Jaar selector — altijd zichtbaar */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">Jaar:</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {beschikbareJaren.map(j => (
                  <button
                    key={j}
                    onClick={() => setJaar(j)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      jaar === j ? "bg-white text-navy-700 shadow-sm" : "text-gray-500 hover:text-navy-700"
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Specifieke selectie */}
            {periode === "kwartaal" && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {([1, 2, 3, 4] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setKwartaal(q)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      kwartaal === q ? "bg-white text-navy-700 shadow-sm" : "text-gray-500 hover:text-navy-700"
                    }`}
                  >
                    Q{q}
                  </button>
                ))}
              </div>
            )}

            {periode === "maand" && (
              <div className="grid grid-cols-6 gap-1 bg-gray-100 rounded-lg p-1">
                {MAANDEN.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMaandIdx(i)}
                    className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      maandIdx === i ? "bg-white text-navy-700 shadow-sm" : "text-gray-500 hover:text-navy-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Voorbeeld</p>
            <div className="space-y-1 text-sm text-navy-700">
              <p><strong>{clientName}</strong> — {typeMeta.label}</p>
              <p className="text-xs text-gray-500">{periodeLabel}</p>
              <p className="text-[11px] text-gray-400 font-mono mt-2 break-all">
                {`${clientName.replace(/\s+/g, "-")}-${typeMeta.label.replace(/\s+/g, "-")}-${jaar}${maandSuffix ? "-" + maandSuffix : ""}.pdf`}
              </p>
            </div>
          </div>

          {periode !== "jaar" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
              <strong>Let op:</strong> kwartaal/maand-filtering werkt op dit moment alleen via de filterbalk op het dashboard. Selecteer eerst de juiste maand voor je hier op &quot;Genereren&quot; klikt.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={generating}
            className="text-sm font-semibold text-gray-500 hover:text-navy-700 px-4 py-2 disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {generating ? "Genereren..." : "Genereer PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

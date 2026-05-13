"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal, RefreshCw, Presentation, FileText, ChevronDown,
} from "lucide-react";
import { downloadDashboardPDF } from "@/lib/pdf-export";

interface ActiesMenuProps {
  onRefresh: () => void;
  onPresentatie: () => void;
  refreshing?: boolean;
  presentatieDisabled?: boolean;
  pdf?: {
    targetId: string;
    filename: string;
    clientName: string;
    reportType: string;
    jaar?: number;
  };
}

export default function ActiesMenu({
  onRefresh, onPresentatie, refreshing, presentatieDisabled, pdf,
}: ActiesMenuProps) {
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function handlePdf() {
    if (!pdf) return;
    setPdfLoading(true);
    try {
      await downloadDashboardPDF(pdf);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF-export mislukt. Probeer opnieuw of neem contact op.");
    } finally {
      setPdfLoading(false);
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-navy-700 border border-gray-200 hover:border-navy-300 rounded-lg px-3 py-1.5 font-semibold transition-colors"
      >
        <MoreHorizontal size={12} />
        Acties
        <ChevronDown size={10} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <button
            onClick={() => { onRefresh(); setOpen(false); }}
            disabled={refreshing}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "text-gray-400 animate-spin" : "text-gray-400"} />
            <div>
              <div className="font-semibold">Vernieuwen</div>
              <div className="text-[10px] text-gray-400">Verse data uit Exact ophalen</div>
            </div>
          </button>

          <button
            onClick={() => { onPresentatie(); setOpen(false); }}
            disabled={presentatieDisabled}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <Presentation size={14} className="text-gray-400" />
            <div>
              <div className="font-semibold">Presentatie</div>
              <div className="text-[10px] text-gray-400">Fullscreen carrousel</div>
            </div>
          </button>

          {pdf && (
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <FileText size={14} className={pdfLoading ? "text-gray-400 animate-pulse" : "text-gray-400"} />
              <div>
                <div className="font-semibold">{pdfLoading ? "Bezig…" : "PDF downloaden"}</div>
                <div className="text-[10px] text-gray-400">Hele dashboard als rapport</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

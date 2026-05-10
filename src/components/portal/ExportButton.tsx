"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { exportToXlsx, exportToCsv } from "@/lib/export-xlsx";

interface ExportButtonProps {
  filename: string;
  rows: Record<string, unknown>[];
  sheetName?: string;
  size?: "sm" | "md";
  variant?: "primary" | "ghost";
  disabled?: boolean;
}

export default function ExportButton({
  filename,
  rows,
  sheetName,
  size = "sm",
  variant = "ghost",
  disabled,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [open]);

  const isEmpty = rows.length === 0;

  const sizeClass = size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2";
  const variantClass = variant === "primary"
    ? "bg-navy-700 hover:bg-navy-600 text-white"
    : "text-gray-500 hover:text-navy-700 border border-gray-200 hover:border-navy-300";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled || isEmpty}
        title={isEmpty ? "Geen data om te exporteren" : "Exporteer naar Excel of CSV"}
        className={`flex items-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${variantClass}`}
      >
        <Download size={size === "sm" ? 12 : 14} />
        Exporteren
        <ChevronDown size={size === "sm" ? 10 : 12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <button
            onClick={() => { exportToXlsx(filename, rows, sheetName); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors text-left"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <div>
              <div className="font-semibold">Excel (.xlsx)</div>
              <div className="text-[10px] text-gray-400">Met formatting</div>
            </div>
          </button>
          <button
            onClick={() => { exportToCsv(filename, rows); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors text-left"
          >
            <FileText size={14} className="text-blue-600" />
            <div>
              <div className="font-semibold">CSV (.csv)</div>
              <div className="text-[10px] text-gray-400">Universeel formaat</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

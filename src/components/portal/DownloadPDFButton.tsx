"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  /** ID van het DOM-element dat als PDF moet worden geëxporteerd */
  targetId: string;
  /** Bestandsnaam (zonder .pdf) */
  filename: string;
  /** Optionele label naast het icoon */
  label?: string;
}

/**
 * Knop die het opgegeven dashboard-element omzet naar een PDF.
 * Gebruikt html2canvas + jsPDF (client-side, geen server nodig).
 */
export default function DownloadPDFButton({ targetId, filename, label = "Download PDF" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Lazy-load — pas inladen wanneer gebruikt (~150KB)
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = document.getElementById(targetId);
      if (!element) throw new Error(`Element met id="${targetId}" niet gevonden`);

      // Render het dashboard naar canvas (2x scale = scherper)
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header met datum
      const today = new Date().toLocaleDateString("nl-NL", {
        day: "2-digit", month: "long", year: "numeric",
      });
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`Khalaf BI — Gegenereerd op ${today}`, margin, 7);

      // Multi-page support: split de afbeelding over pagina's heen
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        // Header op elke pagina
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(`Khalaf BI — Gegenereerd op ${today}`, margin, 7);
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save(`${filename}.pdf`);
    } catch (e) {
      console.error("PDF generatie mislukt:", e);
      alert("PDF genereren mislukt. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-white bg-navy-700 hover:bg-navy-800 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {loading ? "Genereren..." : label}
    </button>
  );
}

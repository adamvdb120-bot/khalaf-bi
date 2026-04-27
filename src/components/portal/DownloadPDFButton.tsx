"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  /** ID van het DOM-element dat als PDF moet worden geëxporteerd */
  targetId: string;
  /** Bestandsnaam (zonder .pdf) */
  filename: string;
  /** Naam van de klant (bv. "Attiva Zorg") */
  clientName: string;
  /** Type rapport (bv. "Financieel overzicht") */
  reportType: string;
  /** Jaartal (bv. 2025) */
  jaar?: number;
  /** Optionele label naast het icoon */
  label?: string;
}

/**
 * Knop die het opgegeven dashboard-element omzet naar een professionele PDF
 * met header (Khalaf BI + klant info), pagina nummers, en landscape formaat.
 */
export default function DownloadPDFButton({
  targetId,
  filename,
  clientName,
  reportType,
  jaar,
  label = "Download PDF",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = document.getElementById(targetId);
      if (!element) throw new Error(`Element met id="${targetId}" niet gevonden`);

      // Render dashboard naar canvas (2x scale = scherper)
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      // Landscape A4 — bredere charts passen beter
      const pdf = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 10;
      const headerHeight = 22;
      const footerHeight = 10;
      const contentTop = headerHeight + margin;
      const contentBottom = pdfHeight - footerHeight - margin;
      const contentMaxHeight = contentBottom - contentTop;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const today = new Date().toLocaleDateString("nl-NL", {
        day: "2-digit", month: "long", year: "numeric",
      });

      // Aantal pagina's berekenen
      const totalPages = Math.max(1, Math.ceil(imgHeight / contentMaxHeight));

      function drawHeader(pageNum: number) {
        // Donkere balk bovenaan
        pdf.setFillColor(27, 58, 92); // navy-700
        pdf.rect(0, 0, pdfWidth, headerHeight, "F");

        // Khalaf BI branding (links)
        pdf.setTextColor(201, 168, 76); // gold-500
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text("KHALAF BI", margin, 10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.text("Driven by data", margin, 15);

        // Klant info (rechts)
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        const clientText = clientName;
        pdf.text(clientText, pdfWidth - margin, 9, { align: "right" });

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        const reportText = jaar ? `${reportType} — ${jaar}` : reportType;
        pdf.text(reportText, pdfWidth - margin, 14, { align: "right" });
        pdf.text(`Gegenereerd op ${today}`, pdfWidth - margin, 18, { align: "right" });

        // Subtle line onder header
        pdf.setDrawColor(201, 168, 76);
        pdf.setLineWidth(0.5);
        pdf.line(0, headerHeight, pdfWidth, headerHeight);
      }

      function drawFooter(pageNum: number) {
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.text("khalaf-bi.vercel.app", margin, pdfHeight - 5);
        pdf.text(`Pagina ${pageNum} van ${totalPages}`, pdfWidth - margin, pdfHeight - 5, { align: "right" });
      }

      // Eerste pagina
      drawHeader(1);
      drawFooter(1);

      // Sliding window technique: schuif image omhoog per pagina
      let renderedHeight = 0;
      let pageNum = 1;

      // De truc: we plakken telkens de hele image, maar verschuiven hem omhoog,
      // en clippen het zichtbare gebied via de page-bounds.
      pdf.addImage(imgData, "PNG", margin, contentTop, imgWidth, imgHeight);
      renderedHeight += contentMaxHeight;

      while (renderedHeight < imgHeight) {
        pdf.addPage();
        pageNum++;
        drawHeader(pageNum);
        drawFooter(pageNum);
        // Image verschuiven zodat het juiste deel zichtbaar is
        const yPos = contentTop - renderedHeight;
        pdf.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight);
        renderedHeight += contentMaxHeight;
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

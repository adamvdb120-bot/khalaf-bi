/**
 * PDF-export utilities voor klant-rapporten.
 *
 * downloadDashboardPDF()  — legacy: hele dashboard als 1 stuk (gebruikt door Acties-menu)
 * generateRapportPDF()    — nieuw: voorblad + dashboard, met smart bestandsnaam
 */

export type RapportType = "financieel" | "cashflow" | "crediteuren" | "declaraties";

export interface RapportOpts {
  targetId: string;
  clientName: string;          // bv. "Attiva Zorg"
  clientSlug: string;          // bv. "attiva"
  reportType: RapportType;
  reportTypeLabel: string;     // bv. "Financieel Overzicht"
  jaar: number;
  maand?: string;              // bv. "Mei" — optional, alleen als periode = "maand"
  periodeLabel: string;        // bv. "Heel jaar 2025", "Mei 2025", "Q1 2025"
  logoSrc?: string;            // bv. "/logos/attiva.svg" — optional
}

export function buildRapportFilename(opts: Pick<RapportOpts, "clientName" | "reportTypeLabel" | "jaar" | "maand">): string {
  const safeKlant = opts.clientName.replace(/\s+/g, "-");
  const safeType = opts.reportTypeLabel.replace(/\s+/g, "-");
  const parts = [safeKlant, safeType, String(opts.jaar)];
  if (opts.maand) parts.push(opts.maand);
  return `${parts.join("-")}.pdf`;
}

/**
 * Genereer een rapport met voorblad + dashboard-content.
 */
export async function generateRapportPDF(opts: RapportOpts): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const element = document.getElementById(opts.targetId);
  if (!element) throw new Error(`Element met id="${opts.targetId}" niet gevonden`);

  // A4 landscape
  const pageWidth = 297;
  const pageHeight = 210;
  const pdf = new jsPDF("l", "mm", "a4");

  // ─── PAGINA 1: VOORBLAD ────────────────────────────────────────────────
  // Navy hoofdvlak (bovenste 2/3)
  pdf.setFillColor(27, 58, 92); // navy-700
  pdf.rect(0, 0, pageWidth, 145, "F");

  // Subtle gold accent strip
  pdf.setFillColor(201, 168, 76); // gold-500
  pdf.rect(0, 145, pageWidth, 2, "F");

  // KHALAF BI logo (text-based)
  pdf.setTextColor(201, 168, 76);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("KHALAF BI", 24, 30);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("DRIVEN BY DATA", 24, 35);

  // Datum rechtsboven
  pdf.setTextColor(180, 195, 210);
  pdf.setFontSize(9);
  pdf.text(
    `Gegenereerd op ${new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`,
    pageWidth - 24,
    30,
    { align: "right" }
  );

  // Hoofdtitel
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(36);
  pdf.text(opts.clientName, 24, 78);

  // Sub-titel: rapporttype + periode
  pdf.setTextColor(201, 168, 76);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "normal");
  pdf.text(opts.reportTypeLabel, 24, 92);

  pdf.setTextColor(180, 195, 210);
  pdf.setFontSize(14);
  pdf.text(opts.periodeLabel, 24, 105);

  // "Vertrouwelijk" tag
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.setDrawColor(201, 168, 76);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(24, 118, 38, 8, 2, 2, "S");
  pdf.setTextColor(201, 168, 76);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("VERTROUWELIJK", 43, 123.5, { align: "center" });

  // Onderste sectie (lichtgrijs)
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 147, pageWidth, pageHeight - 147, "F");

  // Inhoudsopgave (samenvatting van wat in het rapport zit)
  pdf.setTextColor(27, 58, 92);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("WAT VIND JE IN DIT RAPPORT", 24, 162);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const onderwerpen = [
    "1.  Management samenvatting — kerncijfers en YoY-vergelijking",
    "2.  AI-conclusie — wat betekenen de cijfers",
    "3.  Actiepunten — concrete vervolgstappen",
    "4.  Grafieken — omzet, kosten, marge en trends",
  ];
  let y = 170;
  for (const item of onderwerpen) {
    pdf.text(item, 24, y);
    y += 6;
  }

  // Footer voorblad
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(8);
  pdf.text("Khalaf BI · Driven by data · info@khalafbi.nl", pageWidth / 2, pageHeight - 10, { align: "center" });

  // ─── PAGINA 2+: DASHBOARD CONTENT ──────────────────────────────────────
  pdf.addPage();

  // Render dashboard naar canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 14; // ruimte voor header
  let pageNum = 2;
  const totalPages = 1 + Math.ceil(imgHeight / (pageHeight - 14));

  function addHeader(num: number) {
    pdf.setFillColor(27, 58, 92);
    pdf.rect(0, 0, pageWidth, 12, "F");
    pdf.setTextColor(201, 168, 76);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("KHALAF BI", 14, 8);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${opts.clientName} — ${opts.reportTypeLabel} ${opts.jaar}`, pageWidth / 2, 8, { align: "center" });
    pdf.setFontSize(7);
    pdf.text(`Pagina ${num} / ${totalPages}`, pageWidth - 14, 8, { align: "right" });
  }

  addHeader(pageNum);
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 14;

  while (heightLeft > 0) {
    pdf.addPage();
    pageNum++;
    position = heightLeft - imgHeight + 14;
    addHeader(pageNum);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 14;
  }

  // ─── SAVE ──────────────────────────────────────────────────────────────
  const filename = buildRapportFilename({
    clientName: opts.clientName,
    reportTypeLabel: opts.reportTypeLabel,
    jaar: opts.jaar,
    maand: opts.maand,
  });
  pdf.save(filename);
}

// ─── LEGACY: behouden voor Acties-menu zonder modal ────────────────────────
export async function downloadDashboardPDF(opts: {
  targetId: string;
  filename: string;
  clientName: string;
  reportType: string;
  jaar?: number;
}): Promise<void> {
  return generateRapportPDF({
    targetId: opts.targetId,
    clientName: opts.clientName,
    clientSlug: "attiva", // legacy fallback
    reportType: "financieel",
    reportTypeLabel: opts.reportType,
    jaar: opts.jaar ?? new Date().getFullYear(),
    periodeLabel: `Heel jaar ${opts.jaar ?? new Date().getFullYear()}`,
  });
}

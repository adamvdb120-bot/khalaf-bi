/**
 * Exporteer een DOM-element naar een professionele PDF met
 * header (Khalaf BI + klant), pagina nummers en landscape formaat.
 */
export async function downloadDashboardPDF(opts: {
  targetId: string;
  filename: string;
  clientName: string;
  reportType: string;
  jaar?: number;
}): Promise<void> {
  const { targetId, filename, clientName, reportType, jaar } = opts;

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const element = document.getElementById(targetId);
  if (!element) throw new Error(`Element met id="${targetId}" niet gevonden`);

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgWidth = 297; // A4 landscape mm
  const pageHeight = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  const pdf = new jsPDF("l", "mm", "a4");

  // Header (alle paginas)
  function addHeader(pageNum: number, totalPages: number) {
    pdf.setFillColor(27, 58, 92);
    pdf.rect(0, 0, imgWidth, 14, "F");
    pdf.setTextColor(201, 168, 76);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("KHALAF BI", 14, 10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${clientName} — ${reportType}${jaar ? ` ${jaar}` : ""}`, imgWidth / 2, 10, { align: "center" });
    pdf.setFontSize(8);
    pdf.text(`Pagina ${pageNum} / ${totalPages}`, imgWidth - 14, 10, { align: "right" });
  }

  const totalPages = Math.ceil(imgHeight / (pageHeight - 14));
  let position = 14;
  let pageNum = 1;

  addHeader(pageNum, totalPages);
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 14;

  while (heightLeft > 0) {
    pdf.addPage();
    pageNum++;
    position = heightLeft - imgHeight + 14;
    addHeader(pageNum, totalPages);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 14;
  }

  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(safeFilename);
}

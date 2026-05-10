/**
 * Reusable Excel-export utility — werkt 100% in de browser.
 * Genereert een .xlsx file uit een array van objecten en trigger automatisch de download.
 */
export async function exportToXlsx(
  filename: string,
  rows: Record<string, unknown>[],
  sheetName: string = "Data"
): Promise<void> {
  if (rows.length === 0) {
    alert("Geen data om te exporteren");
    return;
  }

  // Dynamisch importeren — voorkom dat xlsx in de hoofd-bundle terechtkomt
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit kolommen op basis van inhoud-lengte
  const cols = Object.keys(rows[0]);
  worksheet["!cols"] = cols.map((c) => {
    const maxLen = Math.max(
      c.length,
      ...rows.map((r) => String(r[c] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  // Triggert browser-download
  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

/**
 * CSV alternative — voor wie liever CSV wil
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[]
): void {
  if (rows.length === 0) {
    alert("Geen data om te exporteren");
    return;
  }
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
  ];
  const csv = "﻿" + lines.join("\n"); // BOM voor Excel-Unicode

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

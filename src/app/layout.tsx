import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khalaf BI – Driven by data",
  description:
    "Geïntegreerde BI-dashboards voor MKB-ondernemers. Eén centrale plek voor al uw KPI's, financiën en bedrijfsdata.",
  keywords: ["business intelligence", "MKB", "dashboard", "Power BI", "KPI", "data"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}

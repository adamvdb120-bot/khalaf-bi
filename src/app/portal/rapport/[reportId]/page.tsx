import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import PowerBIEmbed from "@/components/portal/PowerBIEmbed";

interface Props {
  params: Promise<{ reportId: string }>;
}

export default async function RapportPage({ params }: Props) {
  const { reportId } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("id, name, description, embed_url")
    .eq("id", reportId)
    .single();

  if (!report) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/portal"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors"
        >
          <ChevronLeft size={16} />
          Terug naar overzicht
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-700">{report.name}</h1>
        {report.description && (
          <p className="text-gray-500 mt-1">{report.description}</p>
        )}
      </div>

      {/* Power BI Embedded rapport */}
      <PowerBIEmbed embedUrl={report.embed_url} />
    </div>
  );
}

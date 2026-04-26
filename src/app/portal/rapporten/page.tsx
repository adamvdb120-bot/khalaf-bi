import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";

export default async function RapportenPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-700">Rapporten</h1>
        <p className="text-gray-500 mt-1">Al uw Power BI dashboards op één plek.</p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/portal/rapport/${report.id}`}
              className="card group border-2 border-transparent hover:border-navy-700"
            >
              <div className="w-12 h-12 bg-navy-700/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy-700 transition-colors">
                <BarChart3 size={22} className="text-navy-700 group-hover:text-gold-400 transition-colors" />
              </div>
              <h3 className="font-bold text-navy-700 mb-1">{report.name}</h3>
              {report.description && (
                <p className="text-gray-500 text-sm mb-4">{report.description}</p>
              )}
              <div className="flex items-center gap-1 text-gold-500 text-sm font-medium">
                Openen <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          Nog geen rapporten beschikbaar.
        </div>
      )}
    </div>
  );
}

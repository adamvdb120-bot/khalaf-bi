import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import DashboardCharts from "@/components/portal/DashboardCharts";
import DashboardChat from "@/components/portal/DashboardChat";
import { requireClientAccess } from "@/lib/portal/access";
import { CLIENTS } from "@/lib/clients/config";

const AREYS_FEATURES = CLIENTS.areys.features;

export default async function AreysDashboard() {
  const user = await requireClientAccess("areys");

  const admin = createAdminClient();

  // Haal de meest recente upload op met "restaurant" in de naam
  const { data: upload } = await admin
    .from("uploads")
    .select("id, name, rows, columns, created_at")
    .ilike("name", "%restaurant%")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const rows = (upload?.rows as Record<string, unknown>[]) ?? [];
  const columns = (upload?.columns as string[]) ?? [];
  const uploadDate = upload
    ? new Date(upload.created_at).toLocaleDateString("nl-NL")
    : "";

  return (
    <div className="space-y-8">
      {user.role === "admin" && (
        <Link href="/portal/admin/klanten" className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors">
          <ChevronLeft size={16} /> Terug naar klanten
        </Link>
      )}

      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex-shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/areys.svg" alt="Areys Restaurant" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Areys Restaurant</h1>
          <p className="text-gray-400 text-sm">Somali Restaurant · Dashboard op basis van: {upload?.name ?? "—"} · {uploadDate}</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <DashboardCharts rows={rows} columns={columns} uploadName={upload!.name} />
          {AREYS_FEATURES.aiChat && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-navy-700 mb-4">BI Assistent — Stel een vraag over de data</h2>
              <DashboardChat uploadId={upload!.id} />
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <p>Geen data gevonden. Upload eerst een bestand via Data uploaden.</p>
        </div>
      )}
    </div>
  );
}

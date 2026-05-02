import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/portal/DashboardCharts";
import DashboardChat from "@/components/portal/DashboardChat";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";

// Routeer ingelogde klanten direct naar hun eigen dashboard
const CLIENT_DASHBOARDS: { match: RegExp; href: string }[] = [
  { match: /attiva/i, href: "/portal/dashboard/attiva" },
  { match: /areys/i, href: "/portal/dashboard/areys" },
  { match: /quba|markaz/i, href: "/portal/dashboard/markaz-quba" },
];

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Profielcheck: admins blijven hier, klanten worden doorgestuurd
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role === "client") {
      const haystack = `${profile.company ?? ""} ${profile.full_name ?? ""} ${user.email ?? ""}`;
      const match = CLIENT_DASHBOARDS.find((d) => d.match.test(haystack));
      if (match) redirect(match.href);
    }
  }

  const firstName = user?.email?.split("@")[0] ?? "ondernemer";

  // Haal meest recente upload op
  const { data: upload } = await supabase
    .from("uploads")
    .select("id, name, rows, columns, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-700">
            Goededag, <span className="text-gold-500 capitalize">{firstName}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {upload
              ? `Dashboard op basis van: ${upload.name} · ${new Date(upload.created_at).toLocaleDateString("nl-NL")}`
              : "Upload je eerste databestand om het dashboard te vullen."}
          </p>
        </div>
        <Link href="/portal/data-uploaden" className="btn-primary flex items-center gap-2 text-sm">
          <Upload size={15} />
          Data uploaden
        </Link>
      </div>

      {upload ? (
        <>
          <DashboardCharts
            rows={upload.rows as Record<string, unknown>[]}
            columns={upload.columns as string[]}
            uploadName={upload.name}
          />
          <div className="mt-8">
            <h2 className="text-xl font-bold text-navy-700 mb-4">BI Assistent — Stel een vraag over je data</h2>
            <DashboardChat uploadId={upload.id} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 bg-navy-700/10 rounded-2xl flex items-center justify-center mb-4">
            <Upload size={28} className="text-navy-700" />
          </div>
          <h3 className="text-xl font-bold text-navy-700 mb-2">Nog geen data</h3>
          <p className="text-gray-400 max-w-sm mb-6">
            Upload een Excel of CSV bestand om je dashboard automatisch te vullen met grafieken en KPI&apos;s.
          </p>
          <Link href="/portal/data-uploaden" className="btn-primary">
            Eerste bestand uploaden
          </Link>
        </div>
      )}
    </div>
  );
}

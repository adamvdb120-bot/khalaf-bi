import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus, Users, FileSpreadsheet, Calendar, LayoutDashboard, Clock } from "lucide-react";

// Vaste demo-klanten (eigen relaties Khalaf BI)
const DEMO_CLIENTS = [
  {
    id: "areys",
    name: "Areys Restaurant",
    sector: "Somali Restaurant",
    logo: "/logos/areys.svg",
    color: "#C9A84C",
    dashboardHref: "/portal/dashboard/areys",
    status: "actief" as const,
  },
  {
    id: "attiva",
    name: "Attiva Zorg",
    sector: "Zorginstelling",
    logo: "/logos/attiva.svg",
    color: "#2563a8",
    dashboardHref: "/portal/dashboard/attiva",
    status: "in-aanbouw" as const,
  },
  {
    id: "quba",
    name: "Markaz Quba",
    sector: "Islamitisch Centrum",
    logo: "/logos/quba.svg",
    color: "#1B7A8C",
    dashboardHref: "/portal/dashboard/markaz-quba",
    status: "actief" as const,
  },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/portal");

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, company, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const { data: uploads } = await admin
    .from("uploads")
    .select("id, user_id, name, created_at");

  const clientsWithData = (profiles ?? []).map((p) => ({
    ...p,
    uploads: (uploads ?? []).filter((u) => u.user_id === p.id),
  }));

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Admin — Klantenbeheer</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {DEMO_CLIENTS.length} klanten · {clientsWithData.length} portaalgebruiker{clientsWithData.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/portal/admin/klant-toevoegen" className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus size={15} />
          Klant toevoegen
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        {[
          { label: "Actieve klanten", value: DEMO_CLIENTS.length, icon: Users },
          { label: "Uploads totaal", value: (uploads ?? []).length, icon: FileSpreadsheet },
          { label: "Actief deze maand", value: (uploads ?? []).filter(u =>
              new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)
            ).length, icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="card">
            <s.icon size={20} className="text-gold-500 mb-3" />
            <div className="text-3xl font-bold text-navy-700">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Klanten met logos */}
      <h2 className="text-lg font-bold text-navy-700 mb-4">Klanten</h2>
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {DEMO_CLIENTS.map((client) => (
          <div key={client.id} className="card flex flex-col">
            {/* Logo + naam */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={client.logo} alt={client.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold text-navy-700 leading-tight">{client.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{client.sector}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-5">
              {client.status === "actief" ? (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Dashboard actief
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <Clock size={11} />
                  In aanbouw
                </span>
              )}
            </div>

            {/* Dashboard link */}
            <div className="mt-auto">
              <Link
                href={client.dashboardHref}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-navy-700/20 text-navy-700 hover:bg-navy-700 hover:text-white transition-all duration-200"
              >
                <LayoutDashboard size={15} />
                Dashboard bekijken
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Portaalgebruikers */}
      {clientsWithData.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-navy-700 mb-4">Portaalgebruikers</h2>
          <div className="space-y-4">
            {clientsWithData.map((client) => (
              <div key={client.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(client.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-navy-700">{client.full_name}</div>
                    <div className="text-sm text-gray-400">{client.company}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="text-center">
                    <div className="font-bold text-navy-700">{client.uploads.length}</div>
                    <div className="text-xs text-gray-400">uploads</div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="font-medium">
                      {client.uploads[0]
                        ? new Date(client.uploads[0].created_at).toLocaleDateString("nl-NL")
                        : "—"}
                    </div>
                    <div className="text-xs text-gray-400">laatste upload</div>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Actief
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {clientsWithData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nog geen portaalgebruikers. Voeg een klant toe.</p>
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  UserPlus, Users, FileSpreadsheet, LayoutDashboard, Clock, Mail,
  Calendar, ChevronLeft, MoreVertical,
} from "lucide-react";

const DEMO_CLIENTS = [
  {
    id: "areys",
    name: "Areys Restaurant",
    sector: "Somali Restaurant",
    logo: "/logos/areys.svg",
    color: "#C9A84C",
    dashboardHref: "/portal/dashboard/areys",
    status: "actief" as const,
    sinds: "2024-09",
    bronnen: ["Excel"],
  },
  {
    id: "attiva",
    name: "Attiva Zorg",
    sector: "Zorginstelling",
    logo: "/logos/attiva.svg",
    color: "#2563a8",
    dashboardHref: "/portal/dashboard/attiva",
    status: "actief" as const,
    sinds: "2025-01",
    bronnen: ["Exact Online", "Declaraties"],
  },
  {
    id: "quba",
    name: "Markaz Quba",
    sector: "Islamitisch Centrum",
    logo: "/logos/quba.svg",
    color: "#1B7A8C",
    dashboardHref: "/portal/dashboard/markaz-quba",
    status: "actief" as const,
    sinds: "2025-03",
    bronnen: ["Excel"],
  },
];

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const dag = Math.floor(ms / 86400000);
  if (dag < 1) return "vandaag";
  if (dag === 1) return "gisteren";
  if (dag < 30) return `${dag} dagen geleden`;
  if (dag < 365) return `${Math.floor(dag / 30)} maand${Math.floor(dag / 30) === 1 ? "" : "en"} geleden`;
  return new Date(date).toLocaleDateString("nl-NL");
}

export default async function KlantenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/portal");

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, company, role, client_slug, created_at")
    .order("created_at", { ascending: false });

  const { data: uploads } = await admin
    .from("uploads")
    .select("id, user_id, name, created_at");

  const allProfiles = profiles ?? [];
  const clientProfiles = allProfiles.filter(p => p.role === "client");
  const adminProfiles = allProfiles.filter(p => p.role === "admin");

  const profileMap = new Map(allProfiles.map(p => [p.id, p]));

  const uploadsPerUser = new Map<string, { name: string; created_at: string }[]>();
  for (const u of (uploads ?? [])) {
    if (!uploadsPerUser.has(u.user_id)) uploadsPerUser.set(u.user_id, []);
    uploadsPerUser.get(u.user_id)!.push({ name: u.name, created_at: u.created_at });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/portal/admin" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors mb-2">
            <ChevronLeft size={14} /> Terug naar overzicht
          </Link>
          <h1 className="text-2xl font-bold text-navy-700">Klanten</h1>
          <p className="text-gray-400 text-sm mt-1">
            {DEMO_CLIENTS.length} actieve klanten · {clientProfiles.length} portaalgebruiker{clientProfiles.length === 1 ? "" : "s"} · {adminProfiles.length} admin{adminProfiles.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/portal/admin/klant-toevoegen" className="btn-primary inline-flex items-center gap-2 text-sm">
          <UserPlus size={15} />
          Klant toevoegen
        </Link>
      </div>

      {/* Klanten kaarten — detailed */}
      <div>
        <h2 className="font-bold text-navy-700 mb-3 px-1">Klantorganisaties</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_CLIENTS.map((client) => (
            <div key={client.id} className="card flex flex-col">
              {/* Logo + naam */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={client.logo} alt={client.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-700 leading-tight truncate">{client.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{client.sector}</div>
                </div>
              </div>

              {/* Status & info */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={12} className="text-gray-400" />
                  <span>Klant sinds {new Date(client.sinds + "-01").toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <FileSpreadsheet size={12} className="text-gray-400" />
                  <span>Bron: {client.bronnen.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    client.status === "actief"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      client.status === "actief" ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    {client.status === "actief" ? "Dashboard actief" : "In aanbouw"}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Link
                href={client.dashboardHref}
                className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium border border-navy-700/20 text-navy-700 hover:bg-navy-700 hover:text-white transition-all"
              >
                <LayoutDashboard size={14} />
                Dashboard openen
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Portaalgebruikers tabel */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-navy-700">Portaalgebruikers</h2>
          <span className="text-xs text-gray-400">{clientProfiles.length} klant{clientProfiles.length === 1 ? "" : "en"} · {adminProfiles.length} admin{adminProfiles.length === 1 ? "" : "s"}</span>
        </div>

        {allProfiles.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nog geen portaalgebruikers. Voeg een klant toe om te starten.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left font-medium py-3 px-5">Gebruiker</th>
                  <th className="text-left font-medium py-3 px-3">Bedrijf</th>
                  <th className="text-left font-medium py-3 px-3">Rol</th>
                  <th className="text-left font-medium py-3 px-3">Dashboardtoegang</th>
                  <th className="text-right font-medium py-3 px-3">Uploads</th>
                  <th className="text-left font-medium py-3 px-3">Laatste activiteit</th>
                  <th className="text-right font-medium py-3 px-3">Lid sinds</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {allProfiles.map((p) => {
                  const userUploads = uploadsPerUser.get(p.id) ?? [];
                  const laatste = userUploads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  const slug = (p as { client_slug?: string | null }).client_slug ?? null;
                  const klantInfo = slug ? DEMO_CLIENTS.find(c => c.id === slug) : null;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                            p.role === "admin" ? "bg-gold-500" : "bg-navy-700"
                          }`}>
                            {(p.full_name ?? "?")[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-700 truncate">{p.full_name ?? "Geen naam"}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                              <Mail size={10} />
                              {p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{p.company ?? "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                          p.role === "admin" ? "bg-gold-500/15 text-gold-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.role === "admin" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide bg-gold-500/15 text-gold-700 px-2 py-0.5 rounded">
                            Alle dashboards
                          </span>
                        ) : klantInfo ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={klantInfo.logo} alt={klantInfo.name} className="w-4 h-4 object-contain" />
                            <span className="font-medium text-navy-700">{klantInfo.name}</span>
                            <span className="text-[10px] text-gray-400">({slug})</span>
                          </span>
                        ) : slug ? (
                          <span className="text-xs text-gray-500 italic">{slug}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide bg-red-50 text-red-700 px-2 py-0.5 rounded">
                            Geen toegang
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-navy-700">{userUploads.length}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {laatste ? `${laatste.name.slice(0, 25)}${laatste.name.length > 25 ? "…" : ""} · ${timeAgo(laatste.created_at)}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-gray-500">
                        {timeAgo(p.created_at)}
                      </td>
                      <td className="py-3 pr-5">
                        <button className="text-gray-300 hover:text-navy-700 transition-colors" title="Acties (binnenkort)">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lege state actie */}
      {clientProfiles.length === 0 && (
        <div className="card text-center py-8 space-y-3">
          <Users size={24} className="mx-auto text-gray-300" />
          <div>
            <p className="font-semibold text-navy-700">Nog geen klantgebruikers</p>
            <p className="text-xs text-gray-500 mt-1">Voeg je eerste klant toe om hun toegang in te stellen.</p>
          </div>
          <Link
            href="/portal/admin/klant-toevoegen"
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
          >
            <UserPlus size={14} />
            Eerste klant toevoegen
          </Link>
        </div>
      )}
    </div>
  );
}

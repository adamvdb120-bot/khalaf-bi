import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAttivaOverzicht, type Klantgezondheid } from "@/lib/portal/signals";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  UserPlus, Users, FileSpreadsheet, Calendar, LayoutDashboard, Clock,
  AlertTriangle, TrendingUp, Wallet, Sparkles, ArrowRight,
  Activity, BarChart3, RefreshCw, Bell,
} from "lucide-react";

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
    status: "actief" as const,
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

interface ActivityItem {
  type: "upload" | "klant" | "cache" | "doel";
  titel: string;
  detail: string;
  tijd: string;
  icon: typeof Activity;
}

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "net nu";
  if (min < 60) return `${min} min geleden`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur} uur geleden`;
  const dag = Math.floor(uur / 24);
  if (dag < 30) return `${dag} dag${dag === 1 ? "" : "en"} geleden`;
  return new Date(date).toLocaleDateString("nl-NL");
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/portal");

  const admin = createAdminClient();

  // ─── Data ophalen ──────────────────────────────────────────────────────────
  // Aandachtspunten komen uit dezelfde bron als de sidebar-meldingen
  // (buildAttivaSignals), zodat beide tellers altijd gelijk zijn.
  const [profilesRes, uploadsRes, doelenRes, signalsResult] = await Promise.all([
    admin.from("profiles").select("id, full_name, company, role, created_at").eq("role", "client").order("created_at", { ascending: false }),
    admin.from("uploads").select("id, user_id, name, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("attiva_doelen").select("jaar, updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    buildAttivaOverzicht(admin),
  ]);

  const profiles = profilesRes.data ?? [];
  const uploads = uploadsRes.data ?? [];
  const laatsteDoelen = doelenRes.data;
  const { notifications: signalen, attivaLastRefresh, openTaken, gezondheid } = signalsResult;

  // Kerncijfers per klant. Alleen Attiva heeft (nog) een eigen signaalbron,
  // Exact-cache en takenlijst; andere klanten tonen 0 / — / "Nog geen data".
  const meldingenPerKlant: Record<string, {
    open: number; alarm: number; laatsteRefresh: string | null;
    openTaken: number; gezondheid: Klantgezondheid;
  }> = {
    attiva: {
      open: signalen.length,
      alarm: signalen.filter(s => s.severity === "alarm").length,
      laatsteRefresh: attivaLastRefresh,
      openTaken,
      gezondheid,
    },
  };

  // ─── Activity feed ─────────────────────────────────────────────────────────
  const activity: ActivityItem[] = [];

  // Recente uploads
  for (const u of uploads.slice(0, 4)) {
    const ownerProfile = profiles.find(p => p.id === u.user_id);
    activity.push({
      type: "upload",
      titel: `Nieuwe upload: ${u.name}`,
      detail: ownerProfile?.full_name ?? ownerProfile?.company ?? "Door admin",
      tijd: timeAgo(u.created_at),
      icon: FileSpreadsheet,
    });
  }

  // Nieuwe portaalgebruikers
  for (const p of profiles.slice(0, 2)) {
    activity.push({
      type: "klant",
      titel: `Nieuwe portaalgebruiker`,
      detail: `${p.full_name ?? "Onbekend"} · ${p.company ?? "geen bedrijf"}`,
      tijd: timeAgo(p.created_at),
      icon: Users,
    });
  }

  // Cache refresh
  if (attivaLastRefresh) {
    activity.push({
      type: "cache",
      titel: "Attiva Exact-data ververst",
      detail: "Automatische sync uit Exact Online",
      tijd: timeAgo(attivaLastRefresh),
      icon: RefreshCw,
    });
  }

  // Doelen aangepast
  if (laatsteDoelen?.updated_at) {
    activity.push({
      type: "doel",
      titel: `Attiva-doelen aangepast (${laatsteDoelen.jaar})`,
      detail: "Jaardoelen omzet/kosten/marge bijgewerkt",
      tijd: timeAgo(laatsteDoelen.updated_at),
      icon: TrendingUp,
    });
  }

  // Sorteren op meest recent — we hebben echter al gesorteerd via timeAgo. Voor zekerheid:
  activity.sort((a, b) => {
    // Quick sort: tijd-string "X min geleden" — heuristisch op cijfer
    const score = (s: string) => {
      if (s === "net nu") return 0;
      const m = /(\d+)\s*(min|uur|dag)/.exec(s);
      if (!m) return 999999;
      const n = parseInt(m[1]);
      const mult = m[2] === "min" ? 1 : m[2] === "uur" ? 60 : 1440;
      return n * mult;
    };
    return score(a.tijd) - score(b.tijd);
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const uploadsDezeMaand = uploads.filter(u =>
    new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)
  ).length;
  const urgentTotaal = signalen.filter(s => s.severity === "alarm").length;

  // Voornaam uit full_name. Als die ontbreekt of nog het e-mailadres bevat
  // (oude profielen kregen het e-mailadres als full_name), tonen we alleen
  // de begroeting zonder naam — een e-mailadres in de header oogt onaf.
  const rawNaam = profile?.full_name?.trim() ?? "";
  const naam = rawNaam && !rawNaam.includes("@") ? rawNaam.split(" ")[0] : "";
  const vandaag = new Date().toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const uur = new Date().getHours();
  const groet = uur < 12 ? "Goedemorgen" : uur < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <div className="space-y-6">
      {/* ── Welkomstheader ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-700 to-navy-600 rounded-2xl p-6 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/15 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
              {groet}{naam && <>, <span className="text-gold-400 capitalize">{naam}</span></>} 👋
            </h1>
            <p className="text-navy-200 text-sm mt-1 capitalize">{vandaag}</p>
            <p className="text-navy-200 text-sm mt-3 max-w-xl">
              {signalen.length === 0
                ? "Alles loopt soepel — geen urgente acties vandaag."
                : `${signalen.length} aandachtspunt${signalen.length === 1 ? "" : "en"} ${urgentTotaal > 0 ? `waarvan ${urgentTotaal} urgent` : "voor jouw aandacht"}.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/portal/admin/klant-toevoegen"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <UserPlus size={14} />
              Klant toevoegen
            </Link>
            <Link
              href="/portal/dashboard/attiva"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <BarChart3 size={14} />
              Naar Attiva
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Actieve klanten" value={DEMO_CLIENTS.length} icon={Users} accent="navy" />
        <StatCard
          label="Aandachtspunten"
          value={signalen.length}
          icon={Bell}
          accent={urgentTotaal > 0 ? "red" : signalen.length > 0 ? "amber" : "emerald"}
          sub={urgentTotaal > 0 ? `${urgentTotaal} urgent` : undefined}
        />
        <StatCard
          label="Uploads (30d)"
          value={uploadsDezeMaand}
          icon={FileSpreadsheet}
          accent="gold"
        />
        <StatCard
          label="Portaalgebruikers"
          value={profiles.length}
          icon={Users}
          accent="navy"
        />
      </div>

      {/* ── Aandachtspunten ── */}
      {signalen.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={15} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-navy-700">Aandachtspunten</h2>
              <p className="text-[11px] text-gray-400">Zelfde meldingen als in de zijbalk — acties die je deze week niet wil missen</p>
            </div>
          </div>

          <div className="space-y-2">
            {signalen.map((s) => {
              const ernstStyle = {
                alarm: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", icon: "text-red-500" },
                attention: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", icon: "text-amber-500" },
                info: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", icon: "text-blue-500" },
              }[s.severity];
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className={`flex items-center gap-3 ${ernstStyle.bg} ${ernstStyle.border} border rounded-xl p-3 hover:shadow-sm transition-shadow group`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0`}>
                    {s.severity === "alarm" ? <AlertTriangle size={15} className={ernstStyle.icon} />
                      : s.severity === "attention" ? <Wallet size={15} className={ernstStyle.icon} />
                      : <Sparkles size={15} className={ernstStyle.icon} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-navy-700">{s.titel}</span>
                      {s.klant && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">· {s.klant}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{s.beschrijving}</p>
                    {s.actie && (
                      <p className={`mt-1 flex items-start gap-1 text-[11px] font-semibold ${ernstStyle.text}`}>
                        <ArrowRight size={12} className="flex-shrink-0 mt-px" />
                        <span className="truncate">{s.actie}</span>
                      </p>
                    )}
                  </div>
                  {s.bedrag && (
                    <div className={`text-sm font-bold ${ernstStyle.text} flex-shrink-0`}>{s.bedrag}</div>
                  )}
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2-Column Layout: Klanten links, Activity rechts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Klanten grid */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-navy-700 px-1">Klanten</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {DEMO_CLIENTS.map((client) => {
              const m = meldingenPerKlant[client.id];
              const openMeldingen = m?.open ?? 0;
              const heeftAlarm = (m?.alarm ?? 0) > 0;
              const laatsteRefresh = m?.laatsteRefresh ?? null;
              const openTakenKlant = m?.openTaken ?? 0;
              const gez = m?.gezondheid ?? null;
              const gezStyle = gez
                ? {
                    groen: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
                    oranje: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
                    rood: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
                  }[gez.kleur]
                : null;
              return (
                <Link
                  key={client.id}
                  href={client.dashboardHref}
                  className="card hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={client.logo} alt={client.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-700 leading-tight text-sm truncate">{client.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate">{client.sector}</div>
                    </div>
                    {gez && gezStyle ? (
                      <span
                        title={gez.redenen.join(" · ")}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${gezStyle.bg} ${gezStyle.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${gezStyle.dot} ${gez.kleur === "rood" ? "animate-pulse" : ""}`} />
                        {gez.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 bg-gray-100 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        Nog geen data
                      </span>
                    )}
                  </div>

                  {/* Per-klant kerncijfers */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        <RefreshCw size={10} /> Laatste update
                      </div>
                      <div className="text-xs font-bold text-navy-700 mt-0.5 truncate">
                        {laatsteRefresh ? timeAgo(laatsteRefresh) : "Nog geen data"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        <Bell size={10} /> Open meldingen
                      </div>
                      <div className={`text-xs font-bold mt-0.5 truncate ${
                        openMeldingen === 0 ? "text-emerald-600" : heeftAlarm ? "text-red-600" : "text-amber-600"
                      }`}>
                        {openMeldingen === 0
                          ? "Geen"
                          : `${openMeldingen} open${heeftAlarm ? ` · ${m?.alarm} urgent` : ""}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {client.status === "actief" ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 flex-shrink-0">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Actief
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 flex-shrink-0">
                          <Clock size={10} />
                          In aanbouw
                        </span>
                      )}
                      {openTakenKlant > 0 && (
                        <span className="text-gray-400 truncate">· {openTakenKlant} open {openTakenKlant === 1 ? "taak" : "taken"}</span>
                      )}
                    </div>
                    <span className="text-gray-400 group-hover:text-navy-700 transition-colors flex items-center gap-1 flex-shrink-0">
                      Open <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-bold text-navy-700 mb-3 text-sm">Snelle acties</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <QuickAction icon={UserPlus} label="Klant toevoegen" href="/portal/admin/klant-toevoegen" />
              <QuickAction icon={FileSpreadsheet} label="Data uploaden" href="/portal/data-uploaden" />
              <QuickAction icon={LayoutDashboard} label="Mijn instellingen" href="/portal/instellingen" />
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="space-y-3">
          <h2 className="font-bold text-navy-700 px-1">Recent gebeurd</h2>
          <div className="card">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nog geen activiteit.</p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <a.icon size={13} className="text-navy-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700 leading-snug">{a.titel}</p>
                      <p className="text-xs text-gray-500 truncate">{a.detail}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{a.tijd}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: number | string; icon: typeof Users;
  accent: "navy" | "gold" | "emerald" | "red" | "amber";
  sub?: string;
}) {
  const accentMap = {
    navy: "border-t-navy-700 bg-navy-700/10 text-navy-700",
    gold: "border-t-gold-500 bg-gold-500/10 text-gold-600",
    emerald: "border-t-emerald-500 bg-emerald-50 text-emerald-600",
    red: "border-t-red-500 bg-red-50 text-red-600",
    amber: "border-t-amber-500 bg-amber-50 text-amber-600",
  }[accent];
  const [borderTopClass, iconBgClass, iconColorClass] = accentMap.split(" ");
  return (
    <div className={`card border-t-4 ${borderTopClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBgClass} flex items-center justify-center`}>
          <Icon size={16} className={iconColorClass} />
        </div>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-navy-700 mt-1">{value}</p>
      {sub && <p className={`text-xs font-semibold mt-0.5 ${iconColorClass}`}>{sub}</p>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: typeof Users; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-gray-50 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-navy-700/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-navy-700" />
      </div>
      <span className="text-sm font-medium text-navy-700 group-hover:text-navy-900 leading-tight">{label}</span>
    </Link>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, AlertTriangle, AlertCircle, Bell, ListChecks, Clock } from "lucide-react";
import AttivaTabs from "./AttivaTabs";
import { requireClientAccess } from "@/lib/portal/access";
import { buildAttivaOverzicht } from "@/lib/portal/signals";

export default async function AttivaDashboard() {
  // Vereist: admin of klant met client_slug='attiva'
  const user = await requireClientAccess("attiva");

  const admin = createAdminClient();
  const [{ data: tokenRow }, overzicht] = await Promise.all([
    admin
      .from("exact_tokens")
      .select("access_token")
      .eq("client_name", "attiva")
      .single(),
    buildAttivaOverzicht(admin),
  ]);

  const isConnected = !!tokenRow?.access_token;
  const { gezondheid, notifications, openTaken, attivaLastRefresh } = overzicht;
  const meldingen = notifications.length;
  const urgent = notifications.filter((n) => n.severity === "alarm").length;
  const bijgewerkt = attivaLastRefresh
    ? new Date(attivaLastRefresh).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    : null;
  const gezStyle = {
    groen: { rand: "border-l-emerald-500", bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700", Icon: ShieldCheck },
    oranje: { rand: "border-l-amber-500", bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700", Icon: AlertTriangle },
    rood: { rand: "border-l-red-500", bg: "bg-red-50", dot: "bg-red-500", text: "text-red-700", Icon: AlertCircle },
  }[gezondheid.kleur];

  return (
    <div className="space-y-8">
      {/* Back-link alleen voor admins (klanten zien hun eigen dashboard direct) */}
      {user.role === "admin" && (
        <Link href="/portal/admin/klanten" className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors">
          <ChevronLeft size={16} /> Terug naar klanten
        </Link>
      )}

      {/* Cockpit — klant + status (links) en klantgezondheid (rechts) in één
          band, zodat de top als één dashboard-hoofd voelt i.p.v. losse blokken. */}
      <div className={`card border-l-4 ${gezStyle.rand} flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between`}>
        {/* Links: identiteit + koppelstatus */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/attiva.svg" alt="Attiva Zorg" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-navy-700 leading-tight">Attiva Zorg</h1>
            <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
              <span>Zorgorganisatie</span>
              <span className="text-gray-300">·</span>
              {isConnected
                ? <span className="inline-flex items-center gap-1.5 text-green-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Exact Online gekoppeld</span>
                : <span className="inline-flex items-center gap-1.5 text-orange-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" />Niet gekoppeld</span>}
            </p>
            {/* Meta-strip — maakt de cockpit een echte status-balk i.p.v. een lege kaart */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Bell size={13} className="text-gray-400" />
                {meldingen} {meldingen === 1 ? "melding" : "meldingen"}
                {urgent > 0 && <span className="text-red-600 font-semibold">· {urgent} urgent</span>}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks size={13} className="text-gray-400" />
                {openTaken} open {openTaken === 1 ? "taak" : "taken"}
              </span>
              {bijgewerkt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400" />
                  Bijgewerkt {bijgewerkt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rechts: klantgezondheid — stoplicht-score afgeleid uit de meldingen */}
        <div className={`flex items-center gap-3 rounded-xl ${gezStyle.bg} px-4 py-3 lg:max-w-md lg:flex-shrink-0`}>
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
            <gezStyle.Icon size={18} className={gezStyle.text} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${gezStyle.dot}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Klantgezondheid</span>
            </div>
            <p className={`text-sm font-bold ${gezStyle.text} leading-tight mt-0.5`}>{gezondheid.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{gezondheid.redenen.join(" · ")}</p>
          </div>
        </div>
      </div>

      <AttivaTabs isConnected={isConnected} />
    </div>
  );
}

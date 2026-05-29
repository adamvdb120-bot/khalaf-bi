import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
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
  const { gezondheid } = overzicht;
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

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex-shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/attiva.svg" alt="Attiva Zorg" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Attiva Zorg</h1>
          <p className="text-gray-400 text-sm">
            Zorgorganisatie ·{" "}
            {isConnected
              ? <span className="text-green-500 font-medium">Exact Online gekoppeld</span>
              : <span className="text-orange-400 font-medium">Niet gekoppeld</span>}
          </p>
        </div>
      </div>

      {/* Klantgezondheid — stoplicht-score afgeleid uit de meldingen */}
      <div className={`card border-l-4 ${gezStyle.rand} flex items-center gap-4 py-4`}>
        <div className={`w-11 h-11 rounded-xl ${gezStyle.bg} flex items-center justify-center flex-shrink-0`}>
          <gezStyle.Icon size={20} className={gezStyle.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${gezStyle.dot}`} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Klantgezondheid</span>
          </div>
          <p className={`text-base font-bold ${gezStyle.text} leading-tight mt-0.5`}>{gezondheid.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{gezondheid.redenen.join(" · ")}</p>
        </div>
      </div>

      <AttivaTabs isConnected={isConnected} />
    </div>
  );
}

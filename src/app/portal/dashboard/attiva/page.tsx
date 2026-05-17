import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AttivaTabs from "./AttivaTabs";
import WatVraagtAandacht from "./WatVraagtAandacht";
import { requireClientAccess } from "@/lib/portal/access";

export default async function AttivaDashboard() {
  // Vereist: admin of klant met client_slug='attiva'
  const user = await requireClientAccess("attiva");

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("exact_tokens")
    .select("access_token")
    .eq("client_name", "attiva")
    .single();

  const isConnected = !!tokenRow?.access_token;

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

      {/* "Wat moet ik deze week doen?" — bovenaan, tab-onafhankelijk. */}
      <WatVraagtAandacht />

      <AttivaTabs isConnected={isConnected} />
    </div>
  );
}

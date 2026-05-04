import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AttivaTabs from "./AttivaTabs";

export default async function AttivaDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("exact_tokens")
    .select("access_token")
    .eq("client_name", "attiva")
    .single();

  const isConnected = !!tokenRow?.access_token;

  return (
    <div className="space-y-8">
      <Link href="/portal/admin" className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-700 transition-colors">
        <ChevronLeft size={16} /> Terug naar klantenbeheer
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex-shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/attiva.svg" alt="Attiva Zorg" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-700"></h1>
          <p className="text-gray-400 text-sm">
            Zorgorganisatie ·{" "}
            {isConnected
              ? <span className="text-green-500 font-medium">Exact Online gekoppeld</span>
              : <span className="text-orange-400 font-medium">Niet gekoppeld</span>}
          </p>
        </div>
      </div>

      <AttivaTabs isConnected={isConnected} />
    </div>
  );
}

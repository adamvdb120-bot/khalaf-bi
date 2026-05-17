"use client";

import { useRouter } from "next/navigation";
import { Mail, LogOut, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GeenToegang() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="card max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={28} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-700 mb-2">Geen dashboardtoegang</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Je account is nog niet gekoppeld aan een klantdashboard. Neem contact op met Khalaf BI om toegang te activeren.
          </p>
        </div>
        <div className="space-y-2">
          <a
            href="mailto:info@khalafbi.nl"
            className="w-full inline-flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Mail size={16} />
            Mail Khalaf BI
          </a>
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-navy-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Uitloggen
          </button>
        </div>
      </div>
    </div>
  );
}

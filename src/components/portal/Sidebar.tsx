"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, Settings, Upload, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const nav = [
  { href: "/portal", label: "Overzicht", icon: Home, exact: true },
  { href: "/portal/data-uploaden", label: "Data uploaden", icon: Upload, exact: false },
  { href: "/portal/instellingen", label: "Instellingen", icon: Settings, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.email?.split("@")[0] ?? "");
      const { data: profile } = await supabase
        .from("profiles").select("role, full_name").eq("id", user.id).single();
      if (profile?.role === "admin") setIsAdmin(true);
      if (profile?.full_name) setUserName(profile.full_name);
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-navy-700 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-navy-600">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none">KHALAF BI</div>
            <div className="text-gold-400 text-[9px] font-medium tracking-widest uppercase leading-none mt-0.5">
              Driven by data
            </div>
          </div>
        </Link>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active ? "bg-gold-500 text-white shadow-md" : "text-navy-200 hover:bg-navy-600 hover:text-white"
              )}>
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}

        {/* Admin sectie */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4">
              <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Admin</span>
            </div>
            <Link href="/portal/admin/klanten"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                pathname.startsWith("/portal/admin/klanten") || pathname.startsWith("/portal/admin/klant-toevoegen")
                  ? "bg-gold-500 text-white shadow-md"
                  : "text-navy-200 hover:bg-navy-600 hover:text-white"
              )}>
              <ShieldCheck size={18} />
              Klanten
            </Link>
          </>
        )}
      </nav>

      {/* Gebruiker + uitloggen */}
      <div className="px-3 py-4 border-t border-navy-600 space-y-1">
        <div className="px-4 py-2">
          <div className="text-xs text-navy-400">Ingelogd als</div>
          <div className="text-sm font-semibold text-white capitalize truncate">{userName}</div>
          {isAdmin && (
            <span className="text-[10px] bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full font-semibold">Admin</span>
          )}
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-navy-300 hover:bg-navy-600 hover:text-white transition-all w-full">
          <LogOut size={18} />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}

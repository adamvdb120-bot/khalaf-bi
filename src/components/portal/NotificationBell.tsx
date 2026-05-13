"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, AlertTriangle, AlertCircle, Info, Wallet, TrendingDown,
  Plug, Database, X, ArrowRight,
} from "lucide-react";

interface Notification {
  id: string;
  type: "crediteur" | "marge" | "exact" | "data" | "info";
  severity: "alarm" | "attention" | "info";
  titel: string;
  beschrijving: string;
  href: string;
  klant?: string;
  bedrag?: string;
}

const TYPE_ICONS = {
  crediteur: Wallet,
  marge: TrendingDown,
  exact: Plug,
  data: Database,
  info: Info,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setNotifications(json.notifications ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // Auto-refresh elke 5 min
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const alarmCount = notifications.filter(n => n.severity === "alarm").length;
  const totalCount = notifications.length;

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setOpen(!open)}
        title="Meldingen"
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors w-full ${
          open ? "bg-navy-600 text-white" : "text-navy-200 hover:bg-navy-600 hover:text-white"
        }`}
      >
        <Bell size={16} />
        <span>Meldingen</span>
        {totalCount > 0 && (
          <span className={`ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
            alarmCount > 0 ? "bg-red-500 text-white" : "bg-gold-500 text-white"
          }`}>
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full ml-2 top-0 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-navy-700 text-sm">Meldingen</h3>
              <p className="text-[10px] text-gray-400">
                {loading ? "Laden..." : totalCount === 0 ? "Alles in orde" : `${totalCount} ${totalCount === 1 ? "punt" : "punten"} voor je aandacht`}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Sluit"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Lijst */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="space-y-1 p-3">
                {[0,1,2].map(i => (
                  <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-2 bg-gray-50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-navy-700 text-sm">Geen openstaande meldingen</p>
                <p className="text-xs text-gray-400 mt-1">Alles loopt soepel — geen actie nodig.</p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const TypeIcon = TYPE_ICONS[n.type] ?? Info;
                  const sev = {
                    alarm: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", icon: AlertCircle },
                    attention: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle },
                    info: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", icon: Info },
                  }[n.severity];
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${sev.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon size={14} className={sev.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="text-xs font-bold text-navy-700 leading-snug">{n.titel}</p>
                          {n.bedrag && (
                            <span className={`text-xs font-bold flex-shrink-0 ${sev.text}`}>
                              {n.bedrag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">{n.beschrijving}</p>
                        {n.klant && (
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-1">
                            {n.klant}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={12} className="text-gray-300 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

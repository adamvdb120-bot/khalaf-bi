"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";

interface NarratiefData {
  samenvatting: string;
  punten: string[];
  cached?: boolean;
  age_seconds?: number;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return "net nu";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min geleden`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} uur geleden`;
  return `${Math.round(seconds / 86400)} dagen geleden`;
}

export default function AINarratief({ jaar }: { jaar: number }) {
  const [data, setData] = useState<NarratiefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(forceRefresh = false) {
    if (forceRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attiva/narratief?jaar=${jaar}${forceRefresh ? "&refresh=1" : ""}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [jaar]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700 via-navy-600 to-navy-700 text-white shadow-lg">
      {/* Decoratieve glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-navy-500/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={17} className="text-gold-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
                Executive briefing
              </p>
              <h3 className="text-base font-bold text-white">
                AI-samenvatting van je cijfers
                {data?.cached && data.age_seconds !== undefined && (
                  <span className="ml-2 text-[10px] font-normal text-white/50">
                    · {formatAge(data.age_seconds)}
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Vraag een nieuwe samenvatting"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Vernieuwen
          </button>
        </div>

        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-11/12" />
            <div className="h-4 bg-white/10 rounded w-4/5" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-200">
            Kon samenvatting niet laden: {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Verhaal — neemt 2 kolommen */}
            <div className="lg:col-span-2">
              <p className="text-base text-white leading-relaxed">
                {data.samenvatting}
              </p>
            </div>

            {/* Highlights — rechter kolom */}
            {data.punten.length > 0 && (
              <div className="space-y-2 lg:border-l lg:border-white/15 lg:pl-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400 mb-3">
                  Kernpunten
                </p>
                {data.punten.map((punt, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <ChevronRight size={14} className="text-gold-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{punt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

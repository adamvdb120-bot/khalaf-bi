"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface NarratiefData {
  samenvatting: string;
  aanbeveling: string;
  cached?: boolean;
  age_seconds?: number;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return "net";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} u`;
  return `${Math.round(seconds / 86400)} d`;
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
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-navy-700/8 flex items-center justify-center flex-shrink-0">
          <Sparkles size={15} className="text-navy-700" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-700">Wat betekent dit?</h3>
              {data?.cached && data.age_seconds !== undefined && (
                <span className="text-[10px] text-gray-400">· {formatAge(data.age_seconds)} geleden</span>
              )}
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Vernieuwen"
              className="text-gray-300 hover:text-navy-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          {loading && (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-11/12" />
              <div className="h-3 bg-gray-100 rounded w-3/5 mt-2.5" />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {!loading && !error && data && (
            <>
              <p className="text-sm text-gray-700 leading-relaxed">
                {data.samenvatting}
              </p>
              {data.aanbeveling && (
                <p className="mt-2 text-sm text-navy-700">
                  <span className="font-bold text-gold-600">Actie:</span>{" "}
                  <span>{data.aanbeveling}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

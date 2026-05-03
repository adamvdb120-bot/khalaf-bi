"use client";

import { useEffect, useState } from "react";
import { Pin, X, RefreshCw } from "lucide-react";
import { ChartRenderer, ChartDef } from "./ChartRenderer";

interface PinnedChart {
  id: string;
  tab: string;
  title: string;
  chart_type: "bar" | "line" | "pie";
  chart_data: Record<string, unknown>[];
  chart_keys: { key: string; color: string; label: string }[];
  question?: string;
  created_at: string;
}

export default function PinnedChartsSection({
  tab,
  refresh,
}: {
  tab: string;
  refresh: number;
}) {
  const [charts, setCharts] = useState<PinnedChart[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attiva/pinned-charts?tab=${tab}`);
      if (res.ok) setCharts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, refresh]);

  async function remove(id: string) {
    setCharts(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/attiva/pinned-charts?id=${id}`, { method: "DELETE" });
  }

  if (loading) return null;
  if (charts.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gold-500/15 rounded-lg flex items-center justify-center">
            <Pin size={12} className="text-gold-600" />
          </div>
          <span className="text-sm font-bold text-navy-700">Mijn dashboard</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {charts.length} {charts.length === 1 ? "grafiek" : "grafieken"}
          </span>
        </div>
        <button
          onClick={load}
          className="text-xs text-gray-400 hover:text-navy-700 flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Charts grid */}
      <div className={`grid gap-4 ${charts.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-2"}`}>
        {charts.map((c) => {
          const chartDef: ChartDef = {
            type: c.chart_type,
            title: c.title,
            data: c.chart_data,
            keys: c.chart_keys,
          };
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
              {/* Remove button */}
              <button
                onClick={() => remove(c.id)}
                className="absolute top-3 right-3 z-10 w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title="Verwijder van dashboard"
              >
                <X size={11} />
              </button>

              {/* Question label */}
              {c.question && (
                <div className="px-4 pt-3 pb-0">
                  <p className="text-[10px] text-gray-400 truncate italic">"{c.question}"</p>
                </div>
              )}

              <ChartRenderer chart={chartDef} height={220} />
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-2" />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pin, PinOff, Download, Check } from "lucide-react";

export interface ChartDef {
  type: "bar" | "line" | "pie" | "none";
  title: string;
  data: Record<string, unknown>[];
  keys: { key: string; color: string; label: string; format?: "euro" | "number" }[];
}

function euro(v: number) {
  return `€ ${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

function isEuro(key: string, keys: ChartDef["keys"]) {
  const k = keys.find(x => x.key === key);
  if (k?.format === "number") return false;
  const lc = key.toLowerCase();
  if (lc.includes("pct") || lc.includes("procent") || lc.includes("%") || lc.includes("marge")) return false;
  if (/^\d{4}$/.test(key)) return true;
  return lc.includes("omzet") || lc.includes("kosten") || lc.includes("winst") ||
    lc.includes("bedrag") || lc.includes("uitbetaald") || lc.includes("loon") ||
    lc.includes("zorg") || lc.includes("ontvangen") || lc.includes("gedeclareerd") ||
    lc.includes("inkomsten") || lc.includes("uitgaven") || lc.includes("netto") || lc.includes("cumulatief");
}

export function ChartRenderer({
  chart,
  height = 300,
  onPin,
  isPinned = false,
  question,
}: {
  chart: ChartDef;
  height?: number;
  onPin?: (chart: ChartDef, question?: string) => Promise<void>;
  isPinned?: boolean;
  question?: string;
}) {
  const [pinState, setPinState] = useState<"idle" | "loading" | "done">("idle");
  const chartRef = useRef<HTMLDivElement>(null);

  if (chart.type === "none" || !chart.data?.length) return null;

  const allKeys = Object.keys(chart.data[0]);
  const labelKey = allKeys.find(k => typeof chart.data[0][k] === "string") ?? allKeys[0];

  const hasValidData = chart.keys.some(k =>
    chart.data.some(row => typeof row[k.key] === "number" && (row[k.key] as number) !== 0)
  );
  if (!hasValidData) return (
    <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-4 text-center text-sm text-gray-400">
      Grafiek kon niet worden gegenereerd — stel de vraag anders of specifieker.
    </div>
  );

  function fmt(v: number, key: string) {
    return isEuro(key, chart.keys) ? euro(v) : v.toLocaleString("nl-NL", { maximumFractionDigits: 0 });
  }
  function axisFmt(v: number) {
    const firstKey = chart.keys[0]?.key ?? "";
    if (isEuro(firstKey, chart.keys)) return v > 999 ? `€${(v / 1000).toFixed(0)}K` : `€${v}`;
    return v > 999 ? `${(v / 1000).toFixed(1)}K` : String(v);
  }

  async function handlePin() {
    if (!onPin || pinState !== "idle") return;
    setPinState("loading");
    try {
      await onPin(chart, question);
      setPinState("done");
      setTimeout(() => setPinState("idle"), 2500);
    } catch {
      setPinState("idle");
    }
  }

  async function handleDownload() {
    if (!chartRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${chart.title.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback: do nothing silently
    }
  }

  return (
    <div className="mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="font-semibold text-navy-700 text-sm">{chart.title}</h4>
        <div className="flex items-center gap-1">
          {/* Download button */}
          <button
            onClick={handleDownload}
            title="Download als PNG"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
          >
            <Download size={13} />
          </button>
          {/* Pin button */}
          {onPin && (
            <button
              onClick={handlePin}
              disabled={pinState === "loading" || isPinned}
              title={isPinned ? "Al gepind" : "Pin aan dashboard"}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                pinState === "done" || isPinned
                  ? "bg-emerald-50 text-emerald-600"
                  : pinState === "loading"
                  ? "bg-gray-50 text-gray-400"
                  : "bg-navy-700/5 text-navy-700 hover:bg-navy-700/10"
              }`}
            >
              {pinState === "done" || isPinned ? (
                <><Check size={11} /> Gepind</>
              ) : pinState === "loading" ? (
                <><Pin size={11} /> Pinnen...</>
              ) : (
                <><Pin size={11} /> Pin</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={height}>
          {chart.type === "bar" ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <Tooltip
                formatter={(v: unknown, name: string) => {
                  const key = chart.keys.find(k => k.key === name);
                  return [fmt(v as number, name), key?.label ?? name];
                }}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Legend iconType="circle" iconSize={8} formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
              {chart.keys.map((k) => (
                <Bar key={k.key} dataKey={k.key} fill={k.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v: unknown, name: string) => {
                  const key = chart.keys.find(k => k.key === name);
                  return [fmt(v as number, name), key?.label ?? name];
                }}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Legend iconType="circle" iconSize={8} formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
              {chart.keys.map((k) => (
                <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color}
                  strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={chart.data} dataKey={chart.keys[0]?.key ?? "value"}
                nameKey={labelKey} cx="50%" cy="50%" outerRadius={Math.round(height * 0.28)}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={["#1B3A5C", "#C9A84C", "#3d7ac8", "#e07b39", "#56a88f", "#9b59b6"][i % 6]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown, name: string) => [fmt(v as number, name), name]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

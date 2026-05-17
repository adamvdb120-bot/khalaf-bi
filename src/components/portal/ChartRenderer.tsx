"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { Formatter, ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { Pin, Download, Check, Maximize2, X } from "lucide-react";

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
  allowZoom = true,
}: {
  chart: ChartDef;
  height?: number;
  onPin?: (chart: ChartDef, question?: string) => Promise<void>;
  isPinned?: boolean;
  question?: string;
  allowZoom?: boolean; // disable zoom als grafiek al in modal staat
}) {
  const [pinState, setPinState] = useState<"idle" | "loading" | "done">("idle");
  const [zoomed, setZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Portal target — pas na mount beschikbaar (SSR-safe)
  useEffect(() => { setMounted(true); }, []);

  // Esc om zoom modal te sluiten + body scroll lock
  useEffect(() => {
    if (!zoomed) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomed]);

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

  // Inline-modus = compacte kaart in chat/pinned. Modal-modus = zonder header/border.
  const inlineMode = allowZoom;
  const wrapperClass = inlineMode
    ? "mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden"
    : "bg-white rounded-xl overflow-hidden"; // geen border in modal — die heeft eigen kader
  const chartPadding = inlineMode ? "px-2 pb-4" : "px-2 py-2"; // minder verticale ruimte in modal

  return (
    <>
    <div className={wrapperClass}>
      {/* Chart header — alleen in inline-modus (modal heeft eigen header met titel + knoppen) */}
      {inlineMode && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h4 className="font-semibold text-navy-700 text-sm">{chart.title}</h4>
          <div className="flex items-center gap-1">
            {/* Vergroten button */}
            <button
              onClick={() => setZoomed(true)}
              title="Vergroot grafiek"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
            >
              <Maximize2 size={13} />
            </button>
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
      )}

      {/* Chart */}
      <div ref={chartRef} className={chartPadding}>
        <ResponsiveContainer width="100%" height={height}>
          {chart.type === "bar" ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={axisFmt} />
              <Tooltip
                formatter={((v, name) => {
                  const key = chart.keys.find(k => k.key === name);
                  return [fmt(Number(v ?? 0), String(name ?? "")), key?.label ?? name];
                }) as Formatter<ValueType, NameType>}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
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
                formatter={((v, name) => {
                  const key = chart.keys.find(k => k.key === name);
                  return [fmt(Number(v ?? 0), String(name ?? "")), key?.label ?? name];
                }) as Formatter<ValueType, NameType>}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
              {chart.keys.map((k) => (
                <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color}
                  strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={chart.data} dataKey={chart.keys[0]?.key ?? "value"}
                nameKey={labelKey} cx="50%" cy="50%" outerRadius={Math.round(height * 0.28)}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={["#1B3A5C", "#C9A84C", "#3d7ac8", "#e07b39", "#56a88f", "#9b59b6"][i % 6]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((v, name) => [fmt(Number(v ?? 0), String(name ?? "")), name]) as Formatter<ValueType, NameType>}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>

    {/* Zoom modal — gerenderd via Portal direct naar document.body
        zodat parent transforms (zoals chat-paneel translate-x) het niet beperken */}
    {mounted && zoomed && createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}
        onClick={() => setZoomed(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[92vw] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-navy-700 text-lg truncate pr-4">{chart.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                title="Download als PNG"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy-700 border border-gray-200 hover:border-navy-300 rounded-lg px-3 py-2 transition-colors"
              >
                <Download size={13} />
                Download
              </button>
              {onPin && (
                <button
                  onClick={handlePin}
                  disabled={pinState === "loading" || isPinned}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                    pinState === "done" || isPinned
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-navy-700 text-white hover:bg-navy-600"
                  }`}
                >
                  {pinState === "done" || isPinned ? (
                    <><Check size={12} /> Gepind</>
                  ) : pinState === "loading" ? (
                    <><Pin size={12} /> Pinnen...</>
                  ) : (
                    <><Pin size={12} /> Pin aan dashboard</>
                  )}
                </button>
              )}
              <button
                onClick={() => setZoomed(false)}
                aria-label="Sluiten"
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body — grote grafiek vult bijna hele modalbreedte */}
          <div className="flex-1 overflow-auto px-6 py-4 bg-gray-50/30">
            <ChartRenderer chart={chart} height={500} allowZoom={false} question={question} />
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

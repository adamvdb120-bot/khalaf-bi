"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ChartDef {
  type: "bar" | "line" | "pie" | "none";
  title: string;
  data: Record<string, unknown>[];
  keys: { key: string; color: string; label: string; format?: "euro" | "number" }[];
}

interface Message {
  role: "user" | "assistant";
  text: string;
  chart?: ChartDef;
}

const SUGGESTIONS = [
  "Vergelijk deze maand met vorige maand",
  "Wat is de omzet per categorie?",
  "Welke dag heeft de hoogste omzet?",
  "Toon de top 5 kostenposten",
  "Hoe ontwikkelt de brutomarge zich?",
];

function euro(v: number) {
  return `€ ${Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}

function ChartRenderer({ chart }: { chart: ChartDef }) {
  if (chart.type === "none" || !chart.data?.length) return null;

  // Zoek de string-sleutel (label/naam) — niet de numerieke waarde-sleutels
  const allKeys = Object.keys(chart.data[0]);
  const labelKey = allKeys.find(k => typeof chart.data[0][k] === "string") ?? allKeys[0];

  // Valideer: check of minstens één chart.key daadwerkelijk in de data zit met een getal
  const hasValidData = chart.keys.some(k =>
    chart.data.some(row => typeof row[k.key] === "number" && (row[k.key] as number) !== 0)
  );
  if (!hasValidData) return (
    <div className="mt-4 bg-gray-50 rounded-xl border border-gray-100 p-4 text-center text-sm text-gray-400">
      Grafiek kon niet worden gegenereerd — stel de vraag anders of specifieker.
    </div>
  );
  // Detecteer of waarden euro of gewone getallen zijn
  function isEuro(key: string) {
    const k = chart.keys.find(x => x.key === key);
    if (k?.format === "number") return false;
    const lc = key.toLowerCase();
    if (lc.includes("pct") || lc.includes("procent") || lc.includes("%") || lc.includes("marge")) return false;
    if (/^\d{4}$/.test(key)) return true; // jaarvergelijking (2024, 2025 etc.)
    return lc.includes("omzet") || lc.includes("kosten") || lc.includes("winst") || lc.includes("bedrag") || lc.includes("uitbetaald") || lc.includes("loon") || lc.includes("zorg");
  }
  function fmt(v: number, key: string) {
    return isEuro(key) ? euro(v) : v.toLocaleString("nl-NL", { maximumFractionDigits: 0 });
  }
  function axisFmt(v: number) {
    const firstKey = chart.keys[0]?.key ?? "";
    if (isEuro(firstKey)) return v > 999 ? `€${(v/1000).toFixed(0)}K` : `€${v}`;
    return v > 999 ? `${(v/1000).toFixed(1)}K` : String(v);
  }

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 w-full">
      <h4 className="font-semibold text-navy-700 text-sm mb-4">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={340}>
        {chart.type === "bar" ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={axisFmt} />
            <Tooltip formatter={(v: number, name: string) => {
              const key = chart.keys.find(k => k.key === name);
              return [fmt(v, name), key?.label ?? name];
            }} />
            <Legend formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
            {chart.keys.map((k) => (
              <Bar key={k.key} dataKey={k.key} fill={k.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={axisFmt} domain={["auto", "auto"]} />
            <Tooltip formatter={(v: number, name: string) => {
              const key = chart.keys.find(k => k.key === name);
              return [fmt(v, name), key?.label ?? name];
            }} />
            <Legend formatter={(value) => chart.keys.find(k => k.key === value)?.label ?? value} />
            {chart.keys.map((k) => (
              <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color}
                strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={chart.data} dataKey={chart.keys[0]?.key ?? "value"}
              nameKey={labelKey}
              cx="50%" cy="50%" outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}>
              {chart.data.map((_, i) => (
                <Cell key={i} fill={["#1B3A5C","#C9A84C","#3d7ac8","#e07b39","#56a88f","#9b59b6"][i % 6]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, name: string) => [fmt(v, name), name]} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardChat({ uploadId, uploadIds, context }: { uploadId?: string; uploadIds?: string[]; context?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hallo! Ik ben je BI-assistent. Stel een vraag over je data — ik analyseer het en maak automatisch een grafiek als dat nuttig is.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, uploadIds: uploadIds ?? (uploadId ? [uploadId] : []), context }),
      });
      const data = await res.json();
      setMessages((m) => [...m, {
        role: "assistant",
        text: data.text ?? data.error ?? "Er ging iets mis.",
        chart: data.chart?.type !== "none" ? data.chart : undefined,
      }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Fout: ${err instanceof Error ? err.message : "Onbekend"}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col" style={{ height: 600 }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 flex-shrink-0">
        <div className="w-9 h-9 bg-navy-700 rounded-xl flex items-center justify-center">
          <Sparkles size={16} className="text-gold-400" />
        </div>
        <div>
          <div className="font-bold text-navy-700 text-sm">BI Assistent</div>
          <div className="text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Online
          </div>
        </div>
        <div className="ml-auto">
          <TrendingUp size={16} className="text-gray-300" />
        </div>
      </div>

      {/* Berichten */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-2">
            {/* Tekstbubbel */}
            <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "assistant" ? "bg-navy-700" : "bg-gold-500"
              }`}>
                {msg.role === "assistant"
                  ? <Bot size={14} className="text-white" />
                  : <User size={14} className="text-white" />}
              </div>
              <div className="max-w-[80%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-gray-50 text-gray-700 rounded-tl-sm"
                    : "bg-navy-700 text-white rounded-tr-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
            {/* Grafiek full-width eronder */}
            {msg.chart && <ChartRenderer chart={msg.chart} />}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-navy-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggesties */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-xs bg-navy-700/5 hover:bg-navy-700/10 text-navy-700 px-3 py-1.5 rounded-full transition-colors border border-navy-700/10">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Stel een vraag over je data..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
          disabled={loading}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="w-10 h-10 bg-navy-700 hover:bg-navy-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

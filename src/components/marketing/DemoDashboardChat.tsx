"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, TrendingUp } from "lucide-react";
import { ChartRenderer, ChartDef } from "@/components/portal/ChartRenderer";

interface Message {
  role: "user" | "assistant";
  text: string;
  chart?: ChartDef;
  question?: string;
}

export default function DemoDashboardChat({
  context,
  suggestions,
}: {
  context: string;
  suggestions?: string[];
}) {
  const defaultSuggestions = suggestions ?? [
    "Maak een grafiek van de omzet vs kosten",
    "Welke maand had het hoogste resultaat?",
    "Toon de kosten als taartdiagram",
    "Hoe ontwikkelt de marge zich?",
    "Vergelijk de beste en slechtste maand",
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hallo! Ik ben de Khalaf BI demo-assistent. Stel een vraag over de voorbeelddata of vraag me om een grafiek te maken.",
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
      const res = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.text ?? data.error ?? "Er ging iets mis.",
          chart: data.chart?.type !== "none" ? data.chart : undefined,
          question,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Fout: ${err instanceof Error ? err.message : "Onbekend"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col" style={{ height: 600 }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 flex-shrink-0">
        <div className="w-9 h-9 bg-navy-700 rounded-xl flex items-center justify-center">
          <Sparkles size={16} className="text-gold-400" />
        </div>
        <div>
          <div className="font-bold text-navy-700 text-sm">BI Assistent — Demo</div>
          <div className="text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Online · probeer een vraag
          </div>
        </div>
        <div className="ml-auto">
          <TrendingUp size={16} className="text-gray-300" />
        </div>
      </div>

      {/* Berichten */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "assistant" ? "bg-navy-700" : "bg-gold-500"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot size={14} className="text-white" />
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-gray-50 text-gray-700 rounded-tl-sm"
                      : "bg-navy-700 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
            {msg.chart && (
              <div className="ml-10">
                <ChartRenderer chart={msg.chart} height={280} question={msg.question} />
              </div>
            )}
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
                  <div
                    key={i}
                    className="w-2 h-2 bg-navy-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
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
          {defaultSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-navy-700/5 hover:bg-navy-700/10 text-navy-700 px-3 py-1.5 rounded-full transition-colors border border-navy-700/10"
            >
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
          placeholder="Vraag iets of zeg 'maak een grafiek van...'"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-navy-700 hover:bg-navy-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

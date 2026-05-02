"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Zap, CheckCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-navy-700 flex items-center overflow-hidden">
      {/* Background decoratie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gold-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy-500/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-navy-600/20 rounded-full blur-3xl" />
        {/* Grid patroon */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Tekst */}
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-500/15 text-gold-400 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-gold-500/20">
              <Zap size={14} className="fill-gold-400" />
              <span>BI-oplossingen voor het MKB</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Grip op je{" "}
              <span className="text-gold-400 relative">
                cijfers.
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C50 2.5 100 1 150 3.5C200 6 250 7 299 4"
                    stroke="#C9A84C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-navy-200 mb-4 leading-relaxed">
              Jouw data bestaat al. Wij maken het zichtbaar. Khalaf BI koppelt
              je boekhouding, kassasysteem en declaraties aan één helder
              dashboard zodat je altijd, realtime ziet hoe je bedrijf
              ervoor staat.
            </p>

            <div className="flex flex-col gap-2 mb-8">
              {[
                "Live verbinding met Exact Online",
                "AI-assistent die uw data begrijpt",
                "Automatische maandrapportages per e-mail",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-navy-200 text-sm">
                  <CheckCircle size={15} className="text-gold-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="btn-primary flex items-center gap-2 text-base px-6 py-3 shadow-lg shadow-gold-500/20"
              >
                Gratis demo aanvragen
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/diensten"
                className="btn-outline border-white/30 text-white hover:bg-white hover:text-navy-700 text-base px-6 py-3"
              >
                Bekijk diensten
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-8">
              {[
                { value: "30u", label: "tijdsbesparing per maand" },
                { value: "100%", label: "realtime financieel inzicht" },
                { value: "2×", label: "snellere besluitvorming" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-gold-400">{stat.value}</div>
                  <div className="text-sm text-navy-300 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-gold-500/10 rounded-3xl blur-3xl -z-10 scale-110" />

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Header mockup */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-white/90 font-semibold text-sm">Attiva Zorg</div>
                  <div className="text-white/40 text-xs mt-0.5">Financieel overzicht · 2025</div>
                </div>
                <div className="flex gap-2">
                  {["Week", "Maand", "Jaar"].map((t) => (
                    <span
                      key={t}
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        t === "Maand"
                          ? "bg-gold-500 text-white"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: TrendingUp, label: "Omzet", value: "€ 42.800", trend: "+12%", up: true },
                  { icon: BarChart3, label: "Marge", value: "38,5%", trend: "+4%", up: true },
                  { icon: TrendingUp, label: "Kosten", value: "€ 26.400", trend: "-3%", up: false },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/8 rounded-xl p-3 border border-white/5">
                    <kpi.icon size={14} className="text-gold-400 mb-2" />
                    <div className="text-white font-bold text-sm">{kpi.value}</div>
                    <div className="text-white/40 text-[10px] mt-0.5">{kpi.label}</div>
                    <div className={`text-[10px] mt-1 font-semibold ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                      {kpi.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart mockup */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">Omzet per maand</div>
                <div className="flex items-end gap-1.5 h-20">
                  {[35, 58, 42, 72, 50, 85, 64, 78, 55, 90, 70, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background:
                          i === 11
                            ? "rgb(201 168 76)"
                            : i >= 9
                            ? "rgba(201,168,76,0.4)"
                            : "rgba(255,255,255,0.12)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Jan", "Mrt", "Mei", "Jul", "Sep", "Nov"].map((m) => (
                    <span key={m} className="text-white/25 text-[9px]">{m}</span>
                  ))}
                </div>
              </div>

              {/* AI prompt */}
              <div className="bg-navy-600/50 rounded-xl p-3 border border-white/5">
                <div className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">AI-assistent</div>
                <div className="text-white/60 text-xs italic">
                  &ldquo;De omzet in november is 12% hoger dan het jaargemiddelde. Wilt u een prognose voor december?&rdquo;
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-medium">Omzet groei</div>
                <div className="text-sm font-bold text-navy-700">+24% YoY</div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-16 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-gold-500/10 flex items-center justify-center">
                <Zap size={13} className="text-gold-500" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-medium">Live data</div>
                <div className="text-sm font-bold text-navy-700">Nu bijgewerkt</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

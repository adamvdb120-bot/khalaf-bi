import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-navy-700 flex items-center overflow-hidden">
      {/* Background decoratie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy-500/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-navy-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Tekst */}
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Zap size={14} />
              <span>BI-oplossingen voor het MKB</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Eén dashboard.{" "}
              <span className="text-gold-400">Al uw data.</span>
            </h1>
            <p className="text-xl text-navy-200 mb-8 leading-relaxed">
              Geen losse Excel-bestanden meer. Khalaf BI brengt uw boekhouding,
              kassasysteem en CRM samen in één helder dashboard — zodat u altijd
              weet hoe uw bedrijf ervoor staat.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="btn-primary flex items-center gap-2">
                Gratis demo aanvragen
                <ArrowRight size={18} />
              </Link>
              <Link href="/diensten" className="btn-outline border-white text-white hover:bg-white hover:text-navy-700">
                Meer over onze diensten
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              {[
                { value: "62%", label: "van MKB gebruikt geen BI-tool" },
                { value: "30u", label: "tijdsbesparing per maand" },
                { value: "1 plek", label: "voor alle bedrijfsdata" },
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Header mockup */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-3 w-32 bg-white/20 rounded mb-2" />
                  <div className="h-2 w-20 bg-white/10 rounded" />
                </div>
                <div className="flex gap-2">
                  {["Vandaag", "Week", "Maand"].map((t) => (
                    <span
                      key={t}
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        t === "Maand"
                          ? "bg-gold-500 text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: TrendingUp, label: "Omzet", value: "€ 42.800", up: true },
                  { icon: BarChart3, label: "Brutomarge", value: "38,5%", up: true },
                  { icon: TrendingUp, label: "Cashflow", value: "€ 8.200", up: false },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/10 rounded-xl p-3">
                    <kpi.icon size={16} className="text-gold-400 mb-2" />
                    <div className="text-white font-bold text-sm">{kpi.value}</div>
                    <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
                    <div
                      className={`text-xs mt-1 font-medium ${
                        kpi.up ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {kpi.up ? "▲ 12%" : "▼ 3%"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart mockup */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="h-2 w-24 bg-white/20 rounded mb-4" />
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: i === 11
                          ? "rgb(201 168 76)"
                          : "rgba(255,255,255,0.15)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Jan", "Mrt", "Mei", "Jul", "Sep", "Nov"].map((m) => (
                    <span key={m} className="text-white/30 text-[10px]">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gold-500/5 rounded-2xl blur-2xl -z-10 scale-110" />
          </div>
        </div>
      </div>
    </section>
  );
}

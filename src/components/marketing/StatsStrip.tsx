import { Clock, Database, Zap, ShieldCheck } from "lucide-react";

const stats = [
  {
    value: "24/7",
    label: "zien wat anderen missen",
    sub: "beslis sneller, groei harder",
    icon: Clock,
  },
  {
    value: "100%",
    label: "real-time financieel inzicht",
    sub: "rechtstreeks uit je systemen",
    icon: Zap,
  },
  {
    value: "5+",
    label: "systemen in één dashboard",
    sub: "boekhouding, kassa, declaraties",
    icon: Database,
  },
  {
    value: "AVG",
    label: "compliant & veilig",
    sub: "data blijft binnen EU",
    icon: ShieldCheck,
  },
];

export default function StatsStrip() {
  return (
    <section className="bg-gradient-to-br from-navy-700 to-navy-600 py-20 relative overflow-hidden">
      {/* Decoratie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-gold-400 font-semibold text-sm uppercase tracking-widest">
            Cijfers die voor zich spreken
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3">
            Waarom MKB-ondernemers voor Khalaf BI kiezen
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-colors"
            >
              <div className="w-11 h-11 bg-gold-500/15 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gold-500/20">
                <stat.icon size={20} className="text-gold-400" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold text-gold-400 mb-2 leading-none">
                {stat.value}
              </div>
              <div className="text-sm text-white font-medium leading-snug">
                {stat.label}
              </div>
              <div className="text-xs text-navy-300 mt-1.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

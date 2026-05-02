import Link from "next/link";
import { Quote, ArrowRight, Clock, TrendingUp } from "lucide-react";

const cases = [
  {
    sector: "Horeca",
    name: "Areys Restaurant",
    role: "Somali Restaurant",
    logo: "/logos/areys.svg",
    quote:
      "Ik was vroeger 30 uur per maand bezig met cijfers verzamelen uit drie systemen. Nu zie ik alles op één scherm — per dag wat er overblijft en wanneer ik kan investeren.",
    kpis: ["Omzet per dag", "Brutomarge", "Personeelskosten", "Menuanalyse"],
    result: "30 uur bespaard per maand",
    resultIcon: Clock,
    color: "bg-amber-50 border-amber-200",
    resultColor: "bg-amber-100 text-amber-700",
  },
  {
    sector: "Zorg",
    name: "Attiva Zorg",
    role: "Zorginstelling",
    logo: "/logos/attiva.svg",
    quote:
      "Per cliënt weet ik nu direct hoeveel PGB-budget er nog beschikbaar is en hoeveel er gedeclareerd is. Ik kan vooruit plannen in plaats van achteraf constateren.",
    kpis: ["PGB-budget per cliënt", "Declaraties", "Openstaande posten", "Cashflow"],
    result: "100% inzicht in declaraties",
    resultIcon: TrendingUp,
    color: "bg-teal-50 border-teal-200",
    resultColor: "bg-teal-100 text-teal-700",
  },
];

export default function Cases() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Praktijkcases
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Ondernemers die u voor gingen
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Van horeca tot zorg — zie hoe Khalaf BI zorgt voor minder stress
            en betere beslissingen.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cases.map((c) => (
            <div
              key={c.name}
              className={`rounded-2xl border-2 p-8 ${c.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-bold text-navy-700">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.role}</div>
                </div>
                <span className="ml-auto text-xs font-semibold bg-white px-3 py-1 rounded-full text-gray-600 border">
                  {c.sector}
                </span>
              </div>

              {/* Resultaat badge */}
              <div className={`inline-flex items-center gap-2 ${c.resultColor} text-xs font-bold px-3 py-1.5 rounded-full mb-5`}>
                <c.resultIcon size={12} />
                {c.result}
              </div>

              {/* Quote */}
              <div className="relative mb-6">
                <Quote size={32} className="text-gray-200 absolute -top-2 -left-1" />
                <p className="text-gray-700 leading-relaxed pl-6 italic">
                  &ldquo;{c.quote}&rdquo;
                </p>
              </div>

              {/* KPI tags */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Dashboard KPI&apos;s
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.kpis.map((kpi) => (
                    <span
                      key={kpi}
                      className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full"
                    >
                      {kpi}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/klanten"
            className="inline-flex items-center gap-2 text-navy-700 font-semibold hover:text-gold-500 transition-colors"
          >
            Bekijk alle praktijkcases <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

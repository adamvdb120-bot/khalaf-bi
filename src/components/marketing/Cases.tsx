import Link from "next/link";
import { Quote, ArrowRight } from "lucide-react";

const cases = [
  {
    sector: "Horeca",
    name: "Areys Restaurant",
    role: "Somali Restaurant",
    logo: "/logos/areys.svg",
    quote:
      "Ik was vroeger 30 uur per maand bezig met cijfers verzamelen uit drie systemen. Nu zie ik alles op één scherm. Ik kan nu per dag zien wat er overblijft en wanneer ik kan investeren.",
    kpis: ["Omzet per dag", "Brutomarge", "Personeelskosten", "Menuanalyse"],
    color: "bg-amber-50 border-amber-200",
  },
  {
    sector: "Zorg",
    name: "Attiva Zorg",
    role: "Zorginstelling",
    logo: "/logos/attiva.svg",
    quote:
      "Per cliënt weet ik nu direct hoeveel PGB-budget er nog beschikbaar is en hoeveel er gedeclareerd is. Dit geeft rust en ik kan nu vooruit plannen in plaats van achteraf constateren.",
    kpis: ["PGB-budget per cliënt", "Declaraties", "Openstaande posten", "Cashflow"],
    color: "bg-teal-50 border-teal-200",
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
            Resultaten die spreken
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Ondernemers in horeca en zorg gingen u voor. Zie hoe Khalaf BI hun
            besluitvorming heeft verbeterd.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cases.map((c) => (
            <div
              key={c.name}
              className={`rounded-2xl border-2 p-8 ${c.color} hover:shadow-lg transition-shadow duration-300`}
            >
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

              <div className="relative mb-6">
                <Quote
                  size={32}
                  className="text-gray-200 absolute -top-2 -left-1"
                />
                <p className="text-gray-700 leading-relaxed pl-6 italic">
                  &ldquo;{c.quote}&rdquo;
                </p>
              </div>

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
            Bekijk de volledige praktijkcases <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

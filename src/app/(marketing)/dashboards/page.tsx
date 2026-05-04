import Link from "next/link";
import { BarChart2, TrendingUp, Users, ShoppingCart, Megaphone } from "lucide-react";

const dashboards = [
  {
    icon: BarChart2,
    title: "Finance",
    description: "Omzet, kosten, marge en winstgevendheid",
    href: "/dashboards/finance",
  },
  {
    icon: TrendingUp,
    title: "Cashflow",
    description: "Liquiditeit, inkomsten en uitgaven",
    href: "/dashboards/cashflow",
  },
  {
    icon: ShoppingCart,
    title: "Sales",
    description: "Klantomzet, pipeline en conversie",
    href: "/dashboards/sales",
  },
  {
    icon: Users,
    title: "HR",
    description: "Personeelskosten, FTE's en ziekteverzuim",
    href: "/dashboards/hr",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    description: "ROI, leads en kanaalperformance",
    href: "/dashboards/marketing",
  },
];

export default function DashboardsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B3A5C] to-[#0f2540] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
            Live demo beschikbaar
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Bekijk onze live demo dashboards
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Interactieve dashboards met echte grafieken en een AI-assistent. Probeer het zelf.
          </p>
        </div>
      </section>

      {/* Cards grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.href}
                href={d.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#1B3A5C]/20 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#1B3A5C]/8 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1B3A5C]/12 transition-colors">
                  <Icon size={22} className="text-[#1B3A5C]" />
                </div>
                <h2 className="text-lg font-bold text-[#1B3A5C] mb-1">{d.title}</h2>
                <p className="text-sm text-gray-500 mb-4">{d.description}</p>
                <span className="text-sm font-semibold text-[#C9A84C] group-hover:underline">
                  Bekijk demo →
                </span>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-[#1B3A5C] to-[#0f2540] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Klaar voor uw eigen data?</h2>
          <p className="text-white/70 mb-6">
            Khalaf BI bouwt dashboards op maat voor uw bedrijf — inclusief AI-assistent.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973e] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Neem contact op
          </Link>
        </div>
      </section>
    </div>
  );
}

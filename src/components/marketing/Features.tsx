import { Database, LayoutDashboard, Link2, ShieldCheck, Smartphone, Users } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Data-integratie",
    desc: "Wij koppelen uw boekhouding (Exact Online), kassasysteem (Lightspeed), CRM en Excel-bestanden aan één centrale databron.",
    accent: "bg-blue-50 text-blue-600",
    border: "border-t-blue-500",
  },
  {
    icon: LayoutDashboard,
    title: "Maatwerk dashboards",
    desc: "Overzichtelijke en interactieve dashboards met realtime KPI's. Filter op periode, afdeling of product met één klik.",
    accent: "bg-gold-500/10 text-gold-600",
    border: "border-t-gold-500",
  },
  {
    icon: Link2,
    title: "KPI-framework op maat",
    desc: "Wij definiëren samen met u welke KPI's er écht toe doen voor uw bedrijf. Geen losse cijfers, maar één versie van de waarheid.",
    accent: "bg-violet-50 text-violet-600",
    border: "border-t-violet-500",
  },
  {
    icon: Smartphone,
    title: "Altijd en overal inzicht",
    desc: "Uw dashboard is beschikbaar via de browser op uw laptop, tablet of telefoon. Geen installatie nodig.",
    accent: "bg-emerald-50 text-emerald-600",
    border: "border-t-emerald-500",
  },
  {
    icon: Users,
    title: "Persoonlijke begeleiding",
    desc: "Van intake tot livegang. Wij begeleiden u intensief en bieden maandelijkse check-ins voor optimalisatie.",
    accent: "bg-teal-50 text-teal-600",
    border: "border-t-teal-500",
  },
  {
    icon: ShieldCheck,
    title: "Veilig en betrouwbaar",
    desc: "Uw data is afgeschermd achter beveiligde login. Wij werken met enterprise-cloudinfrastructuur en strikte toegangsbeheer.",
    accent: "bg-navy-700/10 text-navy-700",
    border: "border-t-navy-700",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Wat wij doen
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Alles voor datagedreven beslissingen
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Van data-integratie tot live dashboard — wij leveren een complete
            BI-oplossing die direct bruikbaar is voor uw dagelijkse sturing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${f.border} p-7 shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
              <div className={`w-12 h-12 ${f.accent} rounded-xl flex items-center justify-center mb-5`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-navy-700 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

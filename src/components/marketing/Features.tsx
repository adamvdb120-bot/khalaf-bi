import { Database, LayoutDashboard, Link2, ShieldCheck, Smartphone, BrainCircuit } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Alles op één plek",
    desc: "Exact Online, Lightspeed, Excel — wij koppelen al uw bronsystemen aan één centrale databron. Geen losse bestanden meer.",
    accent: "bg-blue-50 text-blue-600",
    border: "border-t-blue-500",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard op maat",
    desc: "Interactieve KPI-dashboards die precies laten zien wat voor ú belangrijk is. Filter op periode, afdeling of locatie.",
    accent: "bg-gold-500/10 text-gold-600",
    border: "border-t-gold-500",
  },
  {
    icon: BrainCircuit,
    title: "AI-assistent inbegrepen",
    desc: "Stel gewoon een vraag in het Nederlands: \"Hoe was mijn marge vorige maand?\" De AI analyseert uw data en antwoordt direct.",
    accent: "bg-violet-50 text-violet-600",
    border: "border-t-violet-500",
  },
  {
    icon: Smartphone,
    title: "Overal bereikbaar",
    desc: "Uw dashboard werkt op laptop, tablet en telefoon — zonder installatie. Altijd en overal de laatste cijfers bij de hand.",
    accent: "bg-emerald-50 text-emerald-600",
    border: "border-t-emerald-500",
  },
  {
    icon: Link2,
    title: "KPI-framework op maat",
    desc: "Samen bepalen we welke cijfers er écht toe doen voor uw bedrijf. Geen ruis, geen overbodige grafieken — alleen wat telt.",
    accent: "bg-teal-50 text-teal-600",
    border: "border-t-teal-500",
  },
  {
    icon: ShieldCheck,
    title: "Veilig en betrouwbaar",
    desc: "Uw data is afgeschermd achter een beveiligde login. Wij werken met enterprise-cloudinfrastructuur en strikte toegangscontrole.",
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
            Wat u krijgt
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Eén platform. Alle inzichten.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Van data-integratie tot AI-analyse — Khalaf BI levert een complete
            oplossing die direct bruikbaar is voor uw dagelijkse sturing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${f.border} p-7 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
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

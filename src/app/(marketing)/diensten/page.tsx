import { ArrowRight, BarChart2, Database, MessageSquare, Rocket, Settings } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    num: "01",
    icon: MessageSquare,
    title: "Intake & KPI-sessie",
    desc: "We starten met een diepgaand gesprek over uw bedrijf, processen en doelen. Samen definiëren we welke KPI's voor u echt van belang zijn. Dit is de basis van alles.",
    accent: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    num: "02",
    icon: Database,
    title: "Data-integratie",
    desc: "Wij koppelen uw bronsystemen (boekhouding, kassa, CRM, Excel) via API's of connectoren aan een centraal datamodel. Datakwaliteit wordt gecontroleerd en gevalideerd.",
    accent: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    num: "03",
    icon: BarChart2,
    title: "Dashboard bouwen",
    desc: "Op basis van het datamodel bouwen wij uw maatwerk dashboard. Interactief, overzichtelijk en afgestemd op uw branche. U valideert elke stap.",
    accent: "bg-gold-500/10 text-gold-600 border-gold-200",
  },
  {
    num: "04",
    icon: Rocket,
    title: "Livegang & training",
    desc: "Na akkoord gaat het dashboard live in uw persoonlijk portaal. Wij trainen u en uw team zodat iedereen de cijfers begrijpt en vertrouwt.",
    accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    num: "05",
    icon: Settings,
    title: "Doorlopende optimalisatie",
    desc: "Maandelijkse check-ins om KPI's te evalueren, dashboards bij te werken en nieuwe inzichten toe te voegen naarmate uw bedrijf groeit.",
    accent: "bg-teal-50 text-teal-600 border-teal-100",
  },
];

const integrations = [
  "Exact Online", "Lightspeed", "AFAS", "Twinfield", "Salesforce",
  "HubSpot", "Excel / CSV", "PGB-portalen", "Reserveringssystemen",
];

export default function DienstenPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-navy-700 py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 60%)" }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-block bg-gold-500/20 text-gold-400 font-semibold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Onze diensten
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mt-2 mb-6 leading-tight">
            Van versnipperde data<br />
            <span className="text-gold-400">naar één dashboard</span>
          </h1>
          <p className="text-navy-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Wij leveren een complete BI-oplossing: van data-integratie en KPI-structuur
            tot een live maatwerk dashboard dat uw besluitvorming vereenvoudigt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
              Gratis demo aanvragen <ArrowRight size={18} />
            </Link>
            <Link href="/klanten" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
              Bekijk klantcases
            </Link>
          </div>
        </div>
      </section>

      {/* Aanpak — tijdlijn */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">Werkwijze</span>
            <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">Onze aanpak</h2>
            <p className="text-gray-500 text-lg">Stap voor stap naar een datagedreven organisatie</p>
          </div>

          <div className="relative">
            {/* Verticale lijn */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-100" />

            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={s.num} className="relative flex gap-6">
                  {/* Icoon cirkel */}
                  <div className={`relative z-10 w-14 h-14 rounded-2xl border-2 ${s.accent} flex items-center justify-center flex-shrink-0 bg-white`}>
                    <s.icon size={22} />
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100 ${i === steps.length - 1 ? "" : "mb-0"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 tracking-widest">{s.num}</span>
                      <h3 className="text-lg font-bold text-navy-700">{s.title}</h3>
                    </div>
                    <p className="text-gray-500 leading-relaxed text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integraties */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">Koppelingen</span>
          <h2 className="text-3xl font-bold text-navy-700 mt-3 mb-4">Wij koppelen uw systemen</h2>
          <p className="text-gray-500 mb-10">
            Khalaf BI ondersteunt de meest gebruikte MKB-softwarepakketten.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((i) => (
              <span key={i} className="bg-white border border-gray-200 text-navy-700 font-medium text-sm px-5 py-2.5 rounded-full shadow-sm hover:border-navy-700 transition-colors">
                {i}
              </span>
            ))}
            <span className="bg-navy-700 text-white font-medium text-sm px-5 py-2.5 rounded-full">
              + meer op aanvraag
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C9A84C 0%, transparent 60%)" }} />
        <div className="max-w-2xl mx-auto text-center px-4 relative">
          <h2 className="text-4xl font-bold text-white mb-4">Klaar om te starten?</h2>
          <p className="text-navy-200 mb-8 text-lg">
            Vraag een gratis demo aan en ontdek wat Khalaf BI voor uw bedrijf kan betekenen.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Demo aanvragen <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

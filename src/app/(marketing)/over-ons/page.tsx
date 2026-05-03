import Link from "next/link";
import { ArrowRight, Award, Clock, Target, TrendingUp, Users } from "lucide-react";

const stats = [
  { value: "2+", label: "Tevreden klanten" },
  { value: "30u", label: "Tijdsbesparing per maand" },
  { value: "100%", label: "Maatwerk aanpak" },
  { value: "48u", label: "Reactietijd garantie" },
];

const waarden = [
  {
    icon: Target,
    title: "Missie",
    desc: "Elk MKB-bedrijf verdient heldere, betrouwbare stuurinformatie. Wij maken dat mogelijk — betaalbaar en praktisch.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Aanpak",
    desc: "Eerst begrijpen, dan bouwen. Wij starten altijd met een KPI-sessie zodat het dashboard écht bruikbaar is voor jouw dagelijkse sturing.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Award,
    title: "Expertise",
    desc: "Finance & Control × maatwerk dashboards × SQL. De combinatie die jouw data omzet in concrete stuurinformatie.",
    accent: "bg-gold-500/10 text-gold-600",
  },
];

export default function OverOnsPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-navy-700 py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 60%, #C9A84C 0%, transparent 55%)" }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-gold-500/20 text-gold-400 font-semibold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
                Over ons
              </span>
              <h1 className="text-5xl font-bold text-white mt-2 mb-5 leading-tight">
                Finance & BI<br />
                <span className="text-gold-400">in één persoon</span>
              </h1>
              <p className="text-navy-200 text-lg leading-relaxed">
                Khalaf BI is opgericht door Adan Abdulahi, Finance & Control student
                en ondernemer — met één missie: MKB-bedrijven laten sturen op feiten
                in plaats van gevoel.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-bold text-gold-400 mb-1">{s.value}</div>
                  <div className="text-navy-200 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verhaal */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">Het verhaal</span>
              <h2 className="text-3xl font-bold text-navy-700 mt-3 mb-6">Waarom Khalaf BI?</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Als Finance & Control student zag ik tijdens stages en gesprekken
                  met ondernemers steeds hetzelfde patroon: bedrijven die willen groeien,
                  maar hun eigen prestaties niet kunnen meten. Data staat verspreid over
                  systemen, KPI&apos;s zijn onduidelijk en beslissingen worden te vaak op gevoel
                  genomen.
                </p>
                <p>
                  Grote organisaties hebben wél toegang tot goede managementinformatie.
                  Waarom het MKB niet? Dat is de vraag die mij dreef om Khalaf BI op te
                  richten.
                </p>
                <p>
                  Wat mij uniek maakt: ik combineer financiële kennis (control, brutomarge,
                  cashflow, budgettering) met technische BI-vaardigheden (maatwerk dashboards,
                  SQL, datamodellering). Precies dát is wat het MKB nodig heeft.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4 p-5 bg-navy-700/5 rounded-2xl border border-navy-700/10">
                <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-bold text-lg">A</span>
                </div>
                <div>
                  <div className="font-bold text-navy-700">Adan Abdulahi</div>
                  <div className="text-sm text-gray-500">Oprichter Khalaf BI · Finance & Control</div>
                </div>
              </div>
            </div>

            {/* Waarden */}
            <div className="space-y-5">
              {waarden.map((v) => (
                <div key={v.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex gap-4">
                  <div className={`w-12 h-12 ${v.accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <v.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-700 mb-1.5">{v.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}

              <div className="bg-navy-700 rounded-2xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-gold-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1.5">Voor wie?</h3>
                  <p className="text-navy-200 text-sm leading-relaxed">
                    MKB-ondernemers in horeca, zorg, retail of dienstverlening die
                    datagedreven willen werken zonder een grote IT-afdeling nodig te hebben.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tijdlijn */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">Tijdlijn</span>
          <h2 className="text-3xl font-bold text-navy-700 mt-3 mb-12">Mijlpalen</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, jaar: "2023", tekst: "Khalaf BI opgericht tijdens Finance & Control studie" },
              { icon: Users, jaar: "2024", tekst: "Eerste klanten: Areys Restaurant en Attiva Zorg live" },
              { icon: TrendingUp, jaar: "2025", tekst: "Uitbreiding dienstverlening met realtime koppelingen en AI-assistent" },
            ].map((m) => (
              <div key={m.jaar} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <m.icon size={18} className="text-gold-400" />
                </div>
                <div className="text-2xl font-bold text-gold-500 mb-2">{m.jaar}</div>
                <p className="text-gray-500 text-sm leading-relaxed">{m.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 60%)" }} />
        <div className="max-w-2xl mx-auto text-center px-4 relative">
          <h2 className="text-4xl font-bold text-white mb-4">
            Samen je data op orde brengen?
          </h2>
          <p className="text-navy-200 mb-8 text-lg">
            Neem contact op voor een vrijblijvend kennismakingsgesprek.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Contact opnemen <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

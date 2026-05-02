import { Plug, LayoutDashboard, Bell } from "lucide-react";

const steps = [
  {
    icon: Plug,
    step: "01",
    title: "Koppeling in één dag",
    desc: "Wij koppelen uw Exact Online, kassasysteem of andere bronsystemen. Geen technische kennis vereist — wij regelen alles.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: LayoutDashboard,
    step: "02",
    title: "Uw dashboard gaat live",
    desc: "Binnen 48 uur ziet u alle KPI's op één overzichtelijk scherm. Realtime bijgewerkt, altijd actueel, op elk apparaat.",
    color: "bg-gold-500/10 text-gold-600",
  },
  {
    icon: Bell,
    step: "03",
    title: "Automatische rapportages",
    desc: "Elke maand ontvangt u automatisch een rapport in uw inbox. En als er iets opvallends is, krijgt u direct een melding.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Hoe het werkt
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Van nul naar inzicht in 48 uur
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Geen maandenlange trajecten. Geen dure consultants. Gewoon snel en
            helder inzicht in uw bedrijfscijfers.
          </p>
        </div>

        <div className="relative">
          {/* Verbindingslijn */}
          <div className="hidden lg:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-200 via-gold-300 to-emerald-200" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Stap nummer + icoon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${s.color} flex items-center justify-center shadow-sm`}>
                    <s.icon size={26} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-navy-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-navy-700 mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

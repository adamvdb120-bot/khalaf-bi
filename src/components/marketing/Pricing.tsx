import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "€ 500",
    period: "eenmalig",
    sub: "+ € 150/maand",
    desc: "Perfect voor bedrijven die voor het eerst met BI aan de slag gaan.",
    features: [
      "1 gekoppeld bronsysteem",
      "Standaard KPI-dashboard",
      "Maandelijkse check-in",
      "E-mail support",
      "Toegang klantportaal",
    ],
    cta: "Start met Starter",
    highlight: false,
  },
  {
    name: "Groei",
    price: "€ 2.000",
    period: "eenmalig",
    sub: "+ € 175/maand",
    desc: "De meest gekozen oplossing voor MKB-bedrijven met meerdere systemen.",
    features: [
      "Tot 3 gekoppelde bronsystemen",
      "KPI-sessie op maat",
      "Maatwerk dashboard in Power BI",
      "2× maandelijkse optimalisatie",
      "Prioriteit support",
      "Toegang klantportaal",
      "Demo voor uw team",
    ],
    cta: "Start met Groei",
    highlight: true,
  },
  {
    name: "Scale-up",
    price: "Op aanvraag",
    period: "",
    sub: "Maandabonnement op maat",
    desc: "Voor complexere omgevingen met meerdere afdelingen of locaties.",
    features: [
      "Onbeperkte bronsystemen",
      "Multi-locatie dashboards",
      "SQL datamodellering",
      "Dedicated consultant",
      "SLA en uptime garantie",
      "Volledige onboarding",
    ],
    cta: "Neem contact op",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Tarieven
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Transparante prijzen
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Een eenmalige implementatiefee en een laag maandabonnement voor
            onderhoud, hosting en support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border-2 ${
                plan.highlight
                  ? "bg-navy-700 border-gold-500 shadow-2xl scale-105"
                  : "bg-white border-gray-200 hover:border-navy-300"
              } transition-all duration-300`}
            >
              {plan.highlight && (
                <div className="text-center mb-4">
                  <span className="bg-gold-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Meest gekozen
                  </span>
                </div>
              )}

              <h3
                className={`text-xl font-bold mb-1 ${
                  plan.highlight ? "text-white" : "text-navy-700"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.highlight ? "text-navy-200" : "text-gray-500"
                }`}
              >
                {plan.desc}
              </p>

              <div className="mb-1">
                <span
                  className={`text-4xl font-bold ${
                    plan.highlight ? "text-gold-400" : "text-navy-700"
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ml-2 ${
                      plan.highlight ? "text-navy-300" : "text-gray-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              <div
                className={`text-sm mb-8 font-medium ${
                  plan.highlight ? "text-gold-400" : "text-gray-500"
                }`}
              >
                {plan.sub}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.highlight ? "text-gold-400" : "text-navy-700"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.highlight ? "text-navy-100" : "text-gray-600"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={`block text-center font-semibold py-3 rounded-lg transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gold-500 hover:bg-gold-400 text-white"
                    : "bg-navy-700 hover:bg-navy-800 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

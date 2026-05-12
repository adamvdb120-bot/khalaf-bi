"use client";

import { useState } from "react";
import { Plus, Minus, MessageCircle } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    vraag: "Hoe snel staat mijn dashboard live?",
    antwoord:
      "Binnen 48 uur. Na een korte intake koppelen wij je Exact Online (en eventueel kassasysteem) en bouwen we het dashboard op maat voor jouw sector. Geen technische kennis nodig — wij doen het werk.",
  },
  {
    vraag: "Wat kost het maandelijks?",
    antwoord:
      "Vanaf €150 per maand voor het basisdashboard, inclusief Exact-koppeling, AI-assistent en automatische maandrapportages. Maatwerk en extra koppelingen zijn mogelijk vanaf €250/mnd. Geen verborgen kosten, opzegging maandelijks.",
  },
  {
    vraag: "Is mijn data veilig?",
    antwoord:
      "Ja. Wij werken volgens AVG (GDPR) en je data wordt versleuteld opgeslagen op Europese servers (Supabase, Vercel EU). Alleen jij en geautoriseerde gebruikers zien jouw cijfers. Niemand anders, ook wij niet zonder toestemming.",
  },
  {
    vraag: "Werkt het ook als ik niet met Exact Online werk?",
    antwoord:
      "Ja. We koppelen ook met andere boekhoudsystemen (e-Boekhouden, Visma, Yuki) en data-bronnen zoals Excel, kassasystemen (Lightspeed, Mplus), declaratiesystemen en bankrekeningen. Vraag de demo aan, dan kijken we wat past.",
  },
  {
    vraag: "Wat als ik wil stoppen?",
    antwoord:
      "Geen probleem. Opzegging is altijd mogelijk per maand. We verwijderen je data binnen 30 dagen en leveren een export aan zodat je zelfstandig verder kunt. Geen lock-in, geen gedoe.",
  },
  {
    vraag: "Kan ik mijn boekhouder toegang geven?",
    antwoord:
      "Zeker. Je kunt extra gebruikers uitnodigen met eigen inloggegevens — bijvoorbeeld je boekhouder, accountant of compagnon. Iedereen ziet dezelfde dashboards in real-time.",
  },
  {
    vraag: "Hoe werkt de AI-assistent precies?",
    antwoord:
      "De assistent kent al jouw cijfers en kan vragen beantwoorden in gewone taal: 'Welke maand was mijn beste?' of 'Welke klant levert de meeste omzet?'. Hij maakt ook grafieken op basis van je vraag. Volledig in het Nederlands.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Veelgestelde vragen
          </span>
          <h2 className="text-4xl font-bold text-navy-700 mt-3 mb-4">
            Antwoorden op uw twijfels
          </h2>
          <p className="text-lg text-gray-500">
            Geen verkoperspraat, gewoon eerlijk antwoord.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="font-semibold text-navy-700 text-base">
                    {faq.vraag}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen
                        ? "bg-gold-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-gray-600 leading-relaxed text-sm">
                    {faq.antwoord}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nog meer vragen */}
        <div className="mt-12 bg-navy-700 rounded-2xl p-8 text-center text-white">
          <MessageCircle size={32} className="mx-auto mb-4 text-gold-400" />
          <h3 className="text-2xl font-bold mb-2">Andere vraag?</h3>
          <p className="text-navy-200 mb-5 max-w-md mx-auto">
            Plan een gratis 30-minuten kennismaking — geen verkooppraat, gewoon
            kijken of wij iets voor jou kunnen betekenen.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Plan een kennismaking
          </Link>
        </div>
      </div>
    </section>
  );
}

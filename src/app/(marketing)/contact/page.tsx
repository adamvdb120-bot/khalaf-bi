"use client";

import { useState } from "react";
import { CheckCircle, Clock, Mail, Phone, Send, Star } from "lucide-react";

const voordelen = [
  { icon: Clock, tekst: "Reactie binnen 48 uur, vaak al eerder" },
  { icon: Star, tekst: "Gratis en vrijblijvend kennismakingsgesprek" },
  { icon: CheckCircle, tekst: "Maatwerk advies voor jouw specifieke branche" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-navy-700 py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #C9A84C 0%, transparent 55%)" }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-block bg-gold-500/20 text-gold-400 font-semibold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Contact
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mt-2 mb-5 leading-tight">
            Vraag een <span className="text-gold-400">gratis demo</span> aan
          </h1>
          <p className="text-navy-200 text-xl max-w-xl mx-auto">
            Binnen 48 uur nemen wij contact met je op voor een kennismakingsgesprek op maat.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-5 gap-12">
          {/* Links */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-navy-700 mb-3">Neem contact op</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Heb je vragen over onze diensten of wil je direct een demo plannen?
                Wij helpen je graag verder.
              </p>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              {[
                { icon: Mail, label: "E-mail", value: "info@khalafbi.nl", href: "mailto:info@khalafbi.nl" },
                { icon: Phone, label: "Telefoon", value: "+31 6 12 34 56 78", href: "tel:+31612345678" },
              ].map((c) => (
                <a key={c.label} href={c.href}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-navy-700/20 hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-navy-700/10 group-hover:bg-navy-700 rounded-xl flex items-center justify-center transition-colors">
                    <c.icon size={18} className="text-navy-700 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{c.label}</div>
                    <div className="font-semibold text-navy-700 text-sm">{c.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Voordelen */}
            <div className="bg-navy-700 rounded-2xl p-6 space-y-4">
              <div className="text-sm font-bold text-white mb-4">Waarom Khalaf BI?</div>
              {voordelen.map((v) => (
                <div key={v.tekst} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <v.icon size={15} className="text-gold-400" />
                  </div>
                  <span className="text-navy-200 text-sm leading-relaxed">{v.tekst}</span>
                </div>
              ))}
            </div>

            {/* Klanten */}
            <div className="border border-gray-100 rounded-2xl p-5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Zij gingen je voor</div>
              <div className="space-y-3">
                {[
                  { naam: "Areys Restaurant", sector: "Horeca" },
                  { naam: "Attiva Zorg", sector: "Zorg" },
                ].map((k) => (
                  <div key={k.naam} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-700">{k.naam}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{k.sector}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulier */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Send size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-navy-700 mb-3">Bericht ontvangen!</h3>
                <p className="text-gray-500 max-w-sm">
                  Bedankt voor je bericht. Wij nemen binnen 48 uur contact met je op.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-navy-700 mb-6">Stuur ons een bericht</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Naam *</label>
                      <input
                        required type="text"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
                        placeholder="Je naam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrijf</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
                        placeholder="Bedrijfsnaam"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mailadres *</label>
                    <input
                      required type="email"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
                      placeholder="jij@bedrijf.nl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefoonnummer</label>
                    <input
                      type="tel"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition"
                      placeholder="+31 6 ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Je bericht *</label>
                    <textarea
                      required rows={5}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition resize-none"
                      placeholder="Vertel ons over je bedrijf en wat je zoekt..."
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {loading ? "Versturen..." : <><Send size={16} /> Verstuur bericht</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

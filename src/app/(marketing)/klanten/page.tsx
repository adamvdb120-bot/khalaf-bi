import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Clock,
  MessageSquare,
  Quote,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const cases = [
  {
    sector: "Horeca",
    accent: "bg-gold-500/10 text-gold-600 border-gold-200",
    accentDot: "bg-gold-500",
    statGetal: "30u",
    statLabel: "bespaard per maand",
    name: "Areys Restaurant",
    role: "Somali Restaurant — Amsterdam",
    logo: "/logos/areys.svg",
    uitdaging:
      "Areys Restaurant draaide op gevoel. Omzetcijfers kwamen uit het kassasysteem, personeelskosten uit Excel en inkoopdata uit losse facturen. De eigenaar besteedde elke maand zo'n 30 uur aan het samenstellen van een overzicht — en dan was het al verouderd.",
    oplossing:
      "Khalaf BI koppelde het kassasysteem, de personeelsplanning en de inkoopdata aan één centraal dashboard — dagelijks automatisch bijgewerkt. Menuanalyse toont per gerecht de brutomarge.",
    resultaten: [
      "Van 30 uur per maand naar 0 uur handmatig rapporteren",
      "Dagelijks inzicht in omzet, kosten en resterende marge",
      "Menuanalyse per gerecht — onrendabele items gesignaleerd",
      "Cashflowprognose voor betere investeringsbeslissingen",
    ],
    quote:
      "Ik was vroeger 30 uur per maand bezig met cijfers verzamelen uit drie systemen. Nu zie ik alles op één scherm. Ik kan nu per dag zien wat er overblijft en wanneer ik kan investeren.",
    kpis: ["Omzet per dag", "Brutomarge", "Personeelskosten", "Menuanalyse"],
  },
  {
    sector: "Zorg",
    accent: "bg-teal-50 text-teal-700 border-teal-200",
    accentDot: "bg-teal-500",
    statGetal: "100%",
    statLabel: "realtime inzicht",
    name: "Attiva Zorg",
    role: "Zorginstelling — Amsterdam",
    logo: "/logos/attiva.svg",
    uitdaging:
      "Attiva Zorg werkt met PGB-gefinancierde cliënten. Per cliënt moest handmatig worden bijgehouden hoeveel budget er nog beschikbaar was, hoeveel er gedeclareerd was en wat er uitstond. Dit kostte veel tijd en leidde tot last-minute verrassingen.",
    oplossing:
      "Khalaf BI bouwde een portaal dat rechtstreeks koppelt met Exact Online. Per cliënt is realtime zichtbaar hoeveel PGB-budget beschikbaar is, wat er gedeclareerd is en wat er nog openstaat.",
    resultaten: [
      "Realtime PGB-budgetbewaking per cliënt",
      "Automatische koppeling met Exact Online — altijd actueel",
      "Declaratieoverzicht met openstaande posten per debiteur",
      "Jaar-op-jaar vergelijking van geleverde zorg en maandloon",
    ],
    quote:
      "Per cliënt weet ik nu direct hoeveel PGB-budget er nog beschikbaar is en hoeveel er gedeclareerd is. Dit geeft rust en ik kan nu vooruit plannen in plaats van achteraf constateren.",
    kpis: ["PGB-budget per cliënt", "Declaraties", "Openstaande posten", "Cashflow"],
  },
];

const heroStats = [
  { icon: Users, value: "2+", label: "Klanten bediend" },
  { icon: Clock, value: "30u", label: "Tijdsbesparing/mnd" },
  { icon: TrendingUp, value: "100%", label: "Realtime inzicht" },
  { icon: Sparkles, value: "48u", label: "Reactietijd" },
];

const sectoren = [
  { naam: "Horeca", kleur: "bg-gold-500" },
  { naam: "Zorg", kleur: "bg-teal-500" },
  { naam: "Retail", kleur: "bg-violet-500", soon: true },
  { naam: "Dienstverlening", kleur: "bg-emerald-500", soon: true },
];

export default function KlantenPage() {
  return (
    <div className="pt-16">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-navy-700 pt-24 pb-32 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 65% 40%, #C9A84C 0%, transparent 55%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center">
            <span className="inline-block bg-gold-500/20 text-gold-400 font-semibold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Praktijkcases
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white mt-2 mb-6 leading-tight">
              Ondernemers die sturen<br />
              <span className="text-gold-400">op data in plaats van gevoel</span>
            </h1>
            <p className="text-lg text-navy-200 max-w-2xl mx-auto mb-10">
              Van horeca tot zorg — Khalaf BI brengt versnipperde data samen in één
              overzicht. Bekijk hoe onze klanten tijd besparen en beter beslissen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                Gratis demo aanvragen <ArrowRight size={18} />
              </Link>
              <Link
                href="/diensten"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                Bekijk onze diensten
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 bg-gold-500/15 rounded-lg flex items-center justify-center mb-3">
                  <s.icon size={16} className="text-gold-400" />
                </div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-navy-300 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intro / sectoren ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
              Branches
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-700 mt-3 mb-4">
              Werkzaam in uiteenlopende sectoren
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Elke branche heeft eigen KPI&apos;s en uitdagingen. Wij verdiepen ons in
              uw sector zodat het dashboard écht aansluit op uw dagelijkse sturing.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {sectoren.map((s) => (
              <div
                key={s.naam}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center relative"
              >
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${s.kleur} mb-3`}
                />
                <div className="font-semibold text-navy-700 text-sm">{s.naam}</div>
                {s.soon && (
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mt-1">
                    Binnenkort
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cases ────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
              Klantverhalen
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-700 mt-3 mb-4">
              Concrete resultaten, echte cijfers
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Lees hoe ondernemers in horeca en zorg de stap maakten naar
              datagedreven sturing.
            </p>
          </div>

          <div className="space-y-10">
            {cases.map((c) => (
              <article
                key={c.name}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-navy-700">{c.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.accent}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${c.accentDot}`}
                          />
                          {c.sector}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-0.5">{c.role}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-navy-700">
                      {c.statGetal}
                    </div>
                    <div className="text-gray-500 text-xs">{c.statLabel}</div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 grid md:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        De uitdaging
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {c.uitdaging}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        De oplossing
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {c.oplossing}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Resultaten
                    </h4>
                    <ul className="space-y-3">
                      {c.resultaten.map((r) => (
                        <li key={r} className="flex items-start gap-2.5">
                          <CheckCircle
                            size={15}
                            className="text-navy-700 flex-shrink-0 mt-0.5"
                          />
                          <span className="text-gray-600 text-sm leading-relaxed">
                            {r}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Dashboard KPI&apos;s
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {c.kpis.map((kpi) => (
                          <span
                            key={kpi}
                            className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full font-medium"
                          >
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <Quote size={20} className="text-gray-300 mb-2" />
                      <p className="text-gray-500 italic text-sm leading-relaxed">
                        &ldquo;{c.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Assistant ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-gold-500 font-semibold text-sm uppercase tracking-widest">
              <Sparkles size={14} /> Nieuw · AI-assistent
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-700 mt-3 mb-4">
              Stel vragen aan uw eigen data
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Ieder dashboard krijgt een geïntegreerde AI-chatbot die uw cijfers
              begrijpt. Vraag een analyse, laat een grafiek maken of vergelijk
              periodes — gewoon door het te typen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Left: features */}
            <div className="space-y-5">
              {[
                {
                  icon: MessageSquare,
                  title: "Vraag in gewoon Nederlands",
                  desc: "Geen formules of SQL. Typ uw vraag en krijg direct antwoord op basis van úw data.",
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  icon: BarChart3,
                  title: "Genereert grafieken voor u",
                  desc: "De assistent maakt automatisch de visualisatie die past bij uw vraag — staaf, lijn of vergelijking.",
                  color: "bg-gold-500/10 text-gold-600",
                },
                {
                  icon: Sparkles,
                  title: "Concrete conclusies",
                  desc: "Geen losse cijfers maar echte analyses: oorzaken, trends en concrete actiepunten.",
                  color: "bg-violet-50 text-violet-600",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 shadow-sm"
                >
                  <div
                    className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-700 mb-1">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: chat mockup */}
            <div className="bg-gradient-to-br from-navy-700 to-navy-700/95 rounded-3xl p-6 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, #C9A84C 0%, transparent 55%)",
                }}
              />
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-9 h-9 bg-gold-500/20 rounded-lg flex items-center justify-center">
                    <Bot size={18} className="text-gold-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      BI Assistent
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-xs">Online</span>
                    </div>
                  </div>
                </div>

                {/* Chat */}
                <div className="space-y-3 mt-5">
                  <div className="flex justify-end">
                    <div className="bg-gold-500 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                      Waarom is de omzet in maart gedaald?
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 bg-gold-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-gold-400" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 text-white text-sm px-4 py-3 rounded-2xl rounded-tl-md max-w-[85%]">
                      <p className="mb-2">
                        De omzet daalde met <strong>€8.420 (-12%)</strong> doordat
                        cliënt A. Duale is uitgestroomd. De resterende klanten
                        groeiden licht (+3%).
                      </p>
                      <div className="bg-white/5 rounded-lg p-3 mt-3 border border-white/10">
                        <div className="flex items-end gap-2 h-16">
                          <div
                            className="flex-1 bg-gold-400/80 rounded-t"
                            style={{ height: "85%" }}
                          />
                          <div
                            className="flex-1 bg-gold-400/80 rounded-t"
                            style={{ height: "78%" }}
                          />
                          <div
                            className="flex-1 bg-rose-400/80 rounded-t"
                            style={{ height: "55%" }}
                          />
                        </div>
                        <div className="flex gap-2 mt-1.5 text-[10px] text-white/60">
                          <span className="flex-1 text-center">Jan</span>
                          <span className="flex-1 text-center">Feb</span>
                          <span className="flex-1 text-center">Mrt</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="bg-gold-500 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                      Maak een grafiek per cliënt
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 bg-gold-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-gold-400" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-md">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Werkwijze tease ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-navy-700 to-navy-700/95 rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 30%, #C9A84C 0%, transparent 50%)",
              }}
            />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-gold-400 font-semibold text-sm uppercase tracking-widest">
                  Onze werkwijze
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
                  Van intake tot live dashboard in 5 stappen
                </h2>
                <p className="text-navy-200 leading-relaxed">
                  Iedere klantcase begint met een KPI-sessie. Daarna koppelen wij uw
                  systemen, bouwen het dashboard, gaan live en blijven optimaliseren.
                </p>
                <Link
                  href="/diensten"
                  className="inline-flex items-center gap-2 mt-6 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Bekijk de werkwijze <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  "Intake & KPI-sessie",
                  "Data-integratie",
                  "Dashboard bouwen",
                  "Livegang & training",
                  "Doorlopende optimalisatie",
                ].map((stap, i) => (
                  <div
                    key={stap}
                    className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="text-white text-sm font-medium">{stap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            Aan de slag
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-navy-700 mt-3 mb-4">
            Wil uw bedrijf ook zo werken?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Plan een gratis kennismaking en ontdek wat Khalaf BI voor uw specifieke
            situatie kan betekenen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Gratis demo aanvragen <ArrowRight size={18} />
            </Link>
            <Link
              href="/over-ons"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-navy-700 text-navy-700 font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Meer over Khalaf BI
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

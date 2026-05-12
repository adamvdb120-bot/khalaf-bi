/* eslint-disable @next/next/no-img-element */

const klanten = [
  { naam: "Attiva Zorg", logo: "/logos/attiva.svg", sector: "Zorg" },
  { naam: "Areys Restaurant", logo: "/logos/areys.svg", sector: "Horeca" },
];

export default function TrustBar() {
  return (
    <section className="bg-white border-y border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
          Vertrouwd door MKB-ondernemers in zorg, horeca en meer
        </p>
        <div className="flex items-center justify-center flex-wrap gap-x-14 gap-y-6">
          {klanten.map((k) => (
            <div
              key={k.naam}
              className="flex items-center gap-4 hover:scale-105 transition-transform"
              title={`${k.naam} — ${k.sector}`}
            >
              <img
                src={k.logo}
                alt={k.naam}
                className="h-16 w-auto object-contain"
              />
              <span className="text-base font-bold text-navy-700 hidden md:inline">
                {k.naam}
              </span>
            </div>
          ))}
          <div className="text-sm text-gray-400 italic border-l border-gray-200 pl-6">
            + nieuwe klanten in onboarding
          </div>
        </div>
      </div>
    </section>
  );
}

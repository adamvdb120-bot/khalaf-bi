"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Loader2, Info } from "lucide-react";

interface PersoonApi {
  naam: string;
  totaal: number;
  perMaand: number[];
}

interface DeclaratiesPerPersoonResponse {
  jaar: number;
  totaal: number;
  aantalPersonen: number;
  personen: PersoonApi[];
}

interface ClientDelta {
  naam: string;
  nu: number;
  vorig: number;
  delta: number;
}

interface Props {
  categorie: string;
  huidigJaar: number;
  vorigJaar: number;
  /** Aantal maanden met data in huidig jaar — voor eerlijke YTD-vergelijking. */
  aantalMaanden: number;
}

function euro(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}
function euroSigned(v: number) {
  const sign = v < 0 ? "−" : v > 0 ? "+" : "";
  return `${sign}€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

function sumPerMaand(perMaand: number[] | undefined, limit: number): number {
  if (!perMaand) return 0;
  const end = Math.min(limit, perMaand.length);
  let s = 0;
  for (let i = 0; i < end; i++) s += perMaand[i] ?? 0;
  return s;
}

// Heuristiek: omzetcategorieën met "pgb" in de naam komen voort uit PGB-zorg
// en de cliënt-info zit dan in attiva_declaraties (budgethouder), niet in
// Exact's TransactionLines (die toont SVB als payer).
function isPgbCategorie(naam: string): boolean {
  return naam.toLowerCase().includes("pgb");
}

export default function ClientOmzetDrilldown({
  categorie, huidigJaar, vorigJaar, aantalMaanden,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClientDelta[]>([]);

  const pgb = isPgbCategorie(categorie);

  useEffect(() => {
    if (!pgb) {
      // Voor non-PGB categorieën hebben we (nog) geen betrouwbare cliënt-bron.
      // De Exact TransactionLines-route bleek bankniveau te tonen ipv cliënten,
      // dus we tonen liever niets dan misleidende data.
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [resHuidig, resVorig] = await Promise.all([
          fetch(`/api/attiva/declaraties-per-persoon?jaar=${huidigJaar}`),
          fetch(`/api/attiva/declaraties-per-persoon?jaar=${vorigJaar}`),
        ]);

        const huidig: DeclaratiesPerPersoonResponse | null = resHuidig.ok ? await resHuidig.json() : null;
        const vorig: DeclaratiesPerPersoonResponse | null = resVorig.ok ? await resVorig.json() : null;

        if (!huidig && !vorig) {
          if (!cancelled) {
            setError("Kon declaratiedata niet ophalen.");
            setLoading(false);
          }
          return;
        }

        const personenHuidig = huidig?.personen ?? [];
        const personenVorig = vorig?.personen ?? [];

        const nuMap = new Map<string, number>();
        for (const p of personenHuidig) {
          nuMap.set(p.naam, sumPerMaand(p.perMaand, aantalMaanden));
        }
        const vorigMap = new Map<string, number>();
        for (const p of personenVorig) {
          vorigMap.set(p.naam, sumPerMaand(p.perMaand, aantalMaanden));
        }

        const allNamen = new Set<string>([...nuMap.keys(), ...vorigMap.keys()]);
        const merged: ClientDelta[] = Array.from(allNamen).map(naam => {
          const nu = nuMap.get(naam) ?? 0;
          const vorig = vorigMap.get(naam) ?? 0;
          return { naam, nu, vorig, delta: nu - vorig };
        })
          // Materialiteit
          .filter(c => Math.abs(c.delta) > 500)
          // Sorteer op absolute impact
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 8);

        if (!cancelled) {
          setData(merged);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Onbekende fout");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pgb, huidigJaar, vorigJaar, aantalMaanden]);

  return (
    <div className="mt-2 ml-9 rounded-lg bg-gray-50 border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Cliënten binnen {categorie}
        </p>
        {pgb && !loading && !error && data.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
            <Info size={9} />
            Bron: declaratiedata
          </span>
        )}
      </div>

      {!pgb && (
        <div className="py-2">
          <p className="text-xs text-gray-500">
            Cliëntdetail is voor deze omzetcategorie niet beschikbaar — alleen voor PGB-categorieën, waar individuele budgethouders bekend zijn uit de declaratie-administratie.
          </p>
        </div>
      )}

      {pgb && loading && (
        <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
          <Loader2 size={12} className="animate-spin" />
          Cliëntdata ophalen…
        </div>
      )}

      {pgb && error && (
        <p className="py-2 text-xs text-red-600">{error}</p>
      )}

      {pgb && !loading && !error && data.length === 0 && (
        <p className="py-2 text-xs text-gray-500">Geen materiele cliëntverschillen gevonden in declaraties.</p>
      )}

      {pgb && !loading && !error && data.length > 0 && (
        <>
          <div className="space-y-1.5">
            {data.map((c, i) => {
              const isStijger = c.delta > 0;
              const tone = isStijger ? "text-emerald-700" : "text-amber-700";
              const iconColor = isStijger ? "text-emerald-600" : "text-amber-600";
              const Icon = isStijger ? ArrowUp : ArrowDown;
              return (
                <div key={c.naam} className="flex items-center gap-2 py-1.5 px-2 rounded bg-white border border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy-700 truncate" title={c.naam}>
                      {c.naam}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Was {euro(c.vorig)} → nu {euro(c.nu)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Icon size={11} className={iconColor} />
                    <span className={`text-xs font-bold ${tone}`}>{euroSigned(c.delta)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">
            Bedragen kunnen iets afwijken van de Exact-omzetcategorie door SVB-timing — de cliënt-beweging is wel inhoudelijk juist.
          </p>
        </>
      )}
    </div>
  );
}

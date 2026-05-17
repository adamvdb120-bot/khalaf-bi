"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";

interface KlantApi {
  naam: string;
  totaal: number;
  perMaand: number[];
}

interface ApiResponse {
  jaar: number;
  categorie: string;
  totaal: number;
  aantalKlanten: number;
  klanten: KlantApi[];
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
  /**
   * Aantal maanden met data in het huidige jaar. We tellen voor beide jaren
   * alleen periodes 1..aantalMaanden mee zodat de vergelijking eerlijk is.
   */
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

export default function ClientOmzetDrilldown({
  categorie, huidigJaar, vorigJaar, aantalMaanden,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClientDelta[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cat = encodeURIComponent(categorie);
        const [resHuidig, resVorig] = await Promise.all([
          fetch(`/api/exact/omzet-per-klant?jaar=${huidigJaar}&categorie=${cat}&type=omzet`),
          fetch(`/api/exact/omzet-per-klant?jaar=${vorigJaar}&categorie=${cat}&type=omzet`),
        ]);

        // Een 4xx/5xx van één van beide is niet meteen fataal — we tonen wat we hebben.
        const huidig: ApiResponse | null = resHuidig.ok ? await resHuidig.json() : null;
        const vorig: ApiResponse | null = resVorig.ok ? await resVorig.json() : null;

        if (!huidig && !vorig) {
          if (!cancelled) {
            setError("Kon cliëntdata niet ophalen uit Exact.");
            setLoading(false);
          }
          return;
        }

        const klantenHuidig = huidig?.klanten ?? [];
        const klantenVorig = vorig?.klanten ?? [];

        const nuMap = new Map<string, number>();
        for (const k of klantenHuidig) {
          nuMap.set(k.naam, sumPerMaand(k.perMaand, aantalMaanden));
        }
        const vorigMap = new Map<string, number>();
        for (const k of klantenVorig) {
          vorigMap.set(k.naam, sumPerMaand(k.perMaand, aantalMaanden));
        }

        const allNamen = new Set<string>([...nuMap.keys(), ...vorigMap.keys()]);
        const merged: ClientDelta[] = Array.from(allNamen).map(naam => {
          const nu = nuMap.get(naam) ?? 0;
          const vorig = vorigMap.get(naam) ?? 0;
          return { naam, nu, vorig, delta: nu - vorig };
        })
          // Filter ruis: alleen materiele verschuivingen.
          .filter(c => Math.abs(c.delta) > 500)
          // Sorteer op absolute impact, ongeacht richting.
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
  }, [categorie, huidigJaar, vorigJaar, aantalMaanden]);

  return (
    <div className="mt-2 ml-9 rounded-lg bg-gray-50 border border-gray-100 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
        Cliënten binnen {categorie}
      </p>

      {loading && (
        <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
          <Loader2 size={12} className="animate-spin" />
          Cliëntdata ophalen…
        </div>
      )}

      {error && (
        <p className="py-2 text-xs text-red-600">{error}</p>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="py-2 text-xs text-gray-500">Geen materiele cliëntverschillen gevonden.</p>
      )}

      {!loading && !error && data.length > 0 && (
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
      )}
    </div>
  );
}

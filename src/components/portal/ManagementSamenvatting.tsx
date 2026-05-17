"use client";

import { useState, useMemo } from "react";
import {
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, AlertTriangle,
  Scale, CheckCircle2, Briefcase, HelpCircle,
} from "lucide-react";
import WaaromModal, { type WaaromData, type WaaromOorzaak, type WaaromSection } from "./WaaromModal";

type WaaromMetric = "resultaat" | "omzet" | "kosten";

interface PlRow { Amount: number; Description: string; Period: number; IsRevenue: boolean }

interface Props {
  jaar: number;
  pl: PlRow[];
  vorigPl: PlRow[];
}

function euro(v: number) {
  return `€ ${Math.round(v).toLocaleString("nl-NL")}`;
}
function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}
function euroAbs(v: number) {
  return `€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}
function formatSigned(v: number) {
  const sign = v < 0 ? "−" : v > 0 ? "+" : "";
  return `${sign}€ ${Math.round(Math.abs(v)).toLocaleString("nl-NL")}`;
}

// Aggregate pl rows to totals
function sumPl(pl: PlRow[]) {
  let omzet = 0, kosten = 0;
  const maxPeriod = pl.reduce((m, r) => Math.max(m, r.Period), 0);
  for (const r of pl) {
    if (r.Period < 1 || r.Period > 12) continue;
    if (r.IsRevenue) omzet += r.Amount;
    else kosten += r.Amount;
  }
  return { omzet, kosten, marge: omzet - kosten, maxPeriod };
}

// Aggregate categorieën (per Description) split op revenue/kosten
function categoriesByPl(pl: PlRow[], isRevenue: boolean, periodeLimit?: number) {
  const map: Record<string, number> = {};
  for (const r of pl) {
    if (r.IsRevenue !== isRevenue) continue;
    if (r.Period < 1 || r.Period > 12) continue;
    if (periodeLimit !== undefined && r.Period > periodeLimit) continue;
    map[r.Description] = (map[r.Description] ?? 0) + r.Amount;
  }
  return map;
}

export default function ManagementSamenvatting({ jaar, pl, vorigPl }: Props) {
  const [waaromOpen, setWaaromOpen] = useState<WaaromMetric | null>(null);

  // Huidige jaar totalen
  const huidig = sumPl(pl);
  const aantalMaanden = huidig.maxPeriod;

  // Voor eerlijke YoY-vergelijking: vorig jaar same period limit (Jan t/m laatste maand met data)
  const vorigSamePeriod = (() => {
    let omzet = 0, kosten = 0;
    for (const r of vorigPl) {
      if (r.Period < 1 || r.Period > 12) continue;
      if (r.Period > aantalMaanden) continue; // alleen tot zelfde maand vorig jaar
      if (r.IsRevenue) omzet += r.Amount;
      else kosten += r.Amount;
    }
    return { omzet, kosten, marge: omzet - kosten };
  })();

  const margePct = huidig.omzet > 0 ? (huidig.marge / huidig.omzet) * 100 : 0;
  const vorigMargePct = vorigSamePeriod.omzet > 0 ? (vorigSamePeriod.marge / vorigSamePeriod.omzet) * 100 : 0;

  // YoY deltas (%)
  const yoyOmzet = vorigSamePeriod.omzet > 0 ? ((huidig.omzet - vorigSamePeriod.omzet) / vorigSamePeriod.omzet) * 100 : null;
  const yoyKosten = vorigSamePeriod.kosten > 0 ? ((huidig.kosten - vorigSamePeriod.kosten) / vorigSamePeriod.kosten) * 100 : null;
  const yoyMarge = vorigSamePeriod.marge !== 0 ? ((huidig.marge - vorigSamePeriod.marge) / Math.abs(vorigSamePeriod.marge)) * 100 : null;
  const yoyMargePct = vorigMargePct !== 0 ? margePct - vorigMargePct : null; // delta in procentpunten

  // ─── Grootste afwijking: kostenpost met grootste absolute toename vs vorig jaar ─
  const kostenNu = categoriesByPl(pl, false, aantalMaanden);
  const kostenVorig = categoriesByPl(vorigPl, false, aantalMaanden);
  const allKostenKeys = new Set([...Object.keys(kostenNu), ...Object.keys(kostenVorig)]);
  const kostenAfwijkingen = Array.from(allKostenKeys).map(name => {
    const nu = kostenNu[name] ?? 0;
    const vorig = kostenVorig[name] ?? 0;
    return { name, nu, vorig, delta: nu - vorig, deltaPct: vorig > 0 ? ((nu - vorig) / vorig) * 100 : null };
  })
    // Alleen materiele veranderingen. (a.vorig > 100 OR a.nu > 100) zodat
    // nieuwe kostenposten (vorig jaar 0, dit jaar bv. €8k) ook meekomen.
    .filter(a => Math.abs(a.delta) > 1000 && (a.vorig > 100 || a.nu > 100));
  const grootsteKostenStijging = [...kostenAfwijkingen].sort((a, b) => b.delta - a.delta)[0];
  const grootsteKostenDaling = [...kostenAfwijkingen].sort((a, b) => a.delta - b.delta)[0];

  // Omzet-categorie met grootste daling (= risico)
  const omzetNu = categoriesByPl(pl, true, aantalMaanden);
  const omzetVorig = categoriesByPl(vorigPl, true, aantalMaanden);
  const allOmzetKeys = new Set([...Object.keys(omzetNu), ...Object.keys(omzetVorig)]);
  const omzetAfwijkingen = Array.from(allOmzetKeys).map(name => {
    const nu = omzetNu[name] ?? 0;
    const vorig = omzetVorig[name] ?? 0;
    return { name, nu, vorig, delta: nu - vorig };
  }).filter(a => Math.abs(a.delta) > 1000 && a.vorig > 100);
  const grootsteOmzetDaling = [...omzetAfwijkingen].sort((a, b) => a.delta - b.delta)[0];

  // ─── Break-even: gemiddelde kosten per maand vs gemiddelde omzet per maand ─────
  const gemKostenPerMaand = aantalMaanden > 0 ? huidig.kosten / aantalMaanden : 0;
  const gemOmzetPerMaand = aantalMaanden > 0 ? huidig.omzet / aantalMaanden : 0;
  const breakevenBuffer = gemOmzetPerMaand - gemKostenPerMaand;
  const breakevenStatus: "boven" | "onder" | "rand" =
    breakevenBuffer > gemKostenPerMaand * 0.05 ? "boven" :
    breakevenBuffer < -gemKostenPerMaand * 0.05 ? "onder" : "rand";

  // ─── Waarom-drilldown data voor Resultaat / Omzet / Kosten ──────────────────
  // We bouwen pas zinvolle data als er ook een vorige periode is om mee te vergelijken.
  const heeftVorigeData = vorigSamePeriod.omzet > 0 || vorigSamePeriod.kosten > 0;
  const periodeLabel = `Vergelijking: ${jaar} (t/m maand ${aantalMaanden}) vs zelfde periode ${jaar - 1}`;

  // Hulp-helpers om oorzaak-lijstjes te bouwen
  function topOorzaken(
    bron: { name: string; nu: number; vorig: number; delta: number }[],
    richting: "stijgers" | "dalers",
    limit = 3
  ): WaaromOorzaak[] {
    const gefilterd = richting === "stijgers"
      ? bron.filter(a => a.delta > 0).sort((a, b) => b.delta - a.delta)
      : bron.filter(a => a.delta < 0).sort((a, b) => a.delta - b.delta);
    return gefilterd.slice(0, limit).map(a => ({
      name: a.name, delta: a.delta, vorig: a.vorig, nu: a.nu,
    }));
  }

  // ─── Resultaat ──────────────────────────────────────────────────────────────
  const resultaatWaarom = useMemo<WaaromData | null>(() => {
    if (!heeftVorigeData) return null;

    const omzetDelta = huidig.omzet - vorigSamePeriod.omzet;
    const kostenDelta = huidig.kosten - vorigSamePeriod.kosten;
    const netDelta = huidig.marge - vorigSamePeriod.marge;

    // v1: bij verslechtering tonen we kostenstijgers + omzetdalers (de "schade-posten").
    // Bij verbetering blijft dezelfde lijst zichtbaar (asymmetrie bewust geparkeerd).
    const topKostenStijgers = topOorzaken(kostenAfwijkingen, "stijgers");
    const topOmzetDalers = topOorzaken(omzetAfwijkingen, "dalers");

    const isVerslechtering = netDelta < 0;
    const richting = isVerslechtering ? "gedaald" : "gestegen";
    const omzetEffect = -omzetDelta;
    const kostenEffect = kostenDelta;
    const totaalSchade = Math.abs(omzetEffect) + Math.abs(kostenEffect);

    let hoofdoorzaak = "";
    if (totaalSchade > 0) {
      const kostenAandeel = Math.abs(kostenEffect) / totaalSchade;
      const omzetAandeel = Math.abs(omzetEffect) / totaalSchade;
      if (kostenAandeel > 0.7) hoofdoorzaak = "vooral hogere kosten";
      else if (omzetAandeel > 0.7) hoofdoorzaak = "vooral lagere omzet";
      else hoofdoorzaak = "een combinatie van hogere kosten en lagere omzet";
    }
    const concretePunten: string[] = [];
    if (topKostenStijgers[0]) concretePunten.push(`${topKostenStijgers[0].name} steeg met ${euroAbs(topKostenStijgers[0].delta)}`);
    if (topOmzetDalers[0]) concretePunten.push(`${topOmzetDalers[0].name} daalde met ${euroAbs(topOmzetDalers[0].delta)}`);

    const conclusie = isVerslechtering
      ? `Het resultaat is ${richting} met ${euroAbs(netDelta)} t.o.v. dezelfde periode vorig jaar — ${hoofdoorzaak || "geen duidelijke hoofdoorzaak op postniveau"}.${concretePunten.length > 0 ? ` De grootste posten: ${concretePunten.join(" en ")}.` : ""}`
      : `Het resultaat is ${richting} met ${euroAbs(netDelta)} t.o.v. dezelfde periode vorig jaar.${concretePunten.length > 0 ? ` Belangrijke verschuivingen: ${concretePunten.join(" en ")}.` : ""}`;

    const sections: WaaromSection[] = [
      { label: "Grootste kostenstijgers", iconDirection: "up", tone: "red", oorzaken: topKostenStijgers },
      { label: "Grootste omzetdalers", iconDirection: "down", tone: "amber", oorzaken: topOmzetDalers },
    ];

    return {
      titel: `Waarom is je resultaat ${richting}?`,
      periode: periodeLabel,
      hoofdMetric: {
        label: "Netto-effect",
        waarde: netDelta,
        uitleg: `Opgebouwd uit ${formatSigned(omzetDelta)} omzet en ${formatSigned(-kostenDelta)} kosten-effect (kosten zijn omgekeerd: een stijging drukt het resultaat).`,
        isPositief: netDelta >= 0,
      },
      sections,
      conclusie,
    };
  }, [heeftVorigeData, huidig.omzet, huidig.kosten, huidig.marge, vorigSamePeriod, kostenAfwijkingen, omzetAfwijkingen, periodeLabel]);

  // ─── Omzet ──────────────────────────────────────────────────────────────────
  const omzetWaarom = useMemo<WaaromData | null>(() => {
    if (!heeftVorigeData || vorigSamePeriod.omzet === 0) return null;

    const omzetDelta = huidig.omzet - vorigSamePeriod.omzet;
    const isStijging = omzetDelta >= 0;
    const richting = isStijging ? "gestegen" : "gedaald";

    const sectie: WaaromSection = isStijging
      ? { label: "Grootste omzetstijgers", iconDirection: "up", tone: "emerald", oorzaken: topOorzaken(omzetAfwijkingen, "stijgers") }
      : { label: "Grootste omzetdalers", iconDirection: "down", tone: "amber", oorzaken: topOorzaken(omzetAfwijkingen, "dalers") };

    const concreet = sectie.oorzaken
      .slice(0, 2)
      .map(o => `${o.name} ${isStijging ? "steeg" : "daalde"} met ${euroAbs(o.delta)}`)
      .join(" en ");

    const conclusie = `Je omzet is ${richting} met ${euroAbs(omzetDelta)} t.o.v. dezelfde periode vorig jaar.${concreet ? ` Grootste ${isStijging ? "bijdragen" : "verliezen"}: ${concreet}.` : " Geen materiele verschuivingen op postniveau."}`;

    return {
      titel: `Waarom is je omzet ${richting}?`,
      periode: periodeLabel,
      hoofdMetric: {
        label: "Omzet-effect",
        waarde: omzetDelta,
        isPositief: isStijging,
      },
      sections: [sectie],
      conclusie,
    };
  }, [heeftVorigeData, huidig.omzet, vorigSamePeriod, omzetAfwijkingen, periodeLabel]);

  // ─── Kosten ─────────────────────────────────────────────────────────────────
  const kostenWaarom = useMemo<WaaromData | null>(() => {
    if (!heeftVorigeData || vorigSamePeriod.kosten === 0) return null;

    const kostenDelta = huidig.kosten - vorigSamePeriod.kosten;
    const isStijging = kostenDelta > 0;
    const richting = isStijging ? "gestegen" : "gedaald";

    const sectie: WaaromSection = isStijging
      ? { label: "Grootste kostenstijgers", iconDirection: "up", tone: "red", oorzaken: topOorzaken(kostenAfwijkingen, "stijgers") }
      : { label: "Grootste kostendalers", iconDirection: "down", tone: "emerald", oorzaken: topOorzaken(kostenAfwijkingen, "dalers") };

    const concreet = sectie.oorzaken
      .slice(0, 2)
      .map(o => `${o.name} ${isStijging ? "steeg" : "daalde"} met ${euroAbs(o.delta)}`)
      .join(" en ");

    const conclusie = `Je kosten zijn ${richting} met ${euroAbs(kostenDelta)} t.o.v. dezelfde periode vorig jaar.${concreet ? ` Grootste ${isStijging ? "stijgers" : "besparingen"}: ${concreet}.` : " Geen materiele verschuivingen op postniveau."}`;

    return {
      titel: `Waarom zijn je kosten ${richting}?`,
      periode: periodeLabel,
      hoofdMetric: {
        label: "Kosten-effect",
        waarde: kostenDelta,
        // Kosten omlaag is positief nieuws; kosten omhoog is negatief nieuws.
        isPositief: !isStijging,
      },
      sections: [sectie],
      conclusie,
    };
  }, [heeftVorigeData, huidig.kosten, vorigSamePeriod, kostenAfwijkingen, periodeLabel]);

  // Welke WaaromData hoort bij de momenteel geopende metric?
  const activeWaarom: WaaromData | null =
    waaromOpen === "resultaat" ? resultaatWaarom :
    waaromOpen === "omzet" ? omzetWaarom :
    waaromOpen === "kosten" ? kostenWaarom :
    null;

  return (
    <div className="card">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-navy-700 flex items-center gap-2">
              <Briefcase size={15} className="text-navy-700" />
              Management samenvatting
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {jaar} · gegevens t/m maand {aantalMaanden} · vergelijking met dezelfde periode {jaar - 1}
            </p>
          </div>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KpiTile
            label="Omzet YTD"
            value={euro(huidig.omzet)}
            sub={vorigSamePeriod.omzet > 0 ? `Vorig jaar: ${euro(vorigSamePeriod.omzet)}` : undefined}
            yoyPct={yoyOmzet}
            accent="navy"
            onWaarom={omzetWaarom ? () => setWaaromOpen("omzet") : undefined}
          />
          <KpiTile
            label="Kosten YTD"
            value={euro(huidig.kosten)}
            sub={vorigSamePeriod.kosten > 0 ? `Vorig jaar: ${euro(vorigSamePeriod.kosten)}` : undefined}
            yoyPct={yoyKosten}
            yoyInverse
            accent="gold"
            onWaarom={kostenWaarom ? () => setWaaromOpen("kosten") : undefined}
          />
          <KpiTile
            label="Resultaat YTD"
            value={euro(huidig.marge)}
            sub={vorigSamePeriod.marge !== 0 ? `Vorig jaar: ${euro(vorigSamePeriod.marge)}` : undefined}
            yoyPct={yoyMarge}
            accent={huidig.marge >= 0 ? "emerald" : "red"}
            onWaarom={resultaatWaarom ? () => setWaaromOpen("resultaat") : undefined}
          />
          <KpiTile
            label="Brutomarge"
            value={`${margePct.toFixed(1)}%`}
            sub={vorigMargePct !== 0 ? `Vorig jaar: ${vorigMargePct.toFixed(1)}%` : undefined}
            yoyPct={yoyMargePct}
            yoyAsPp // in procentpunten ipv %
            accent={margePct >= 5 ? "emerald" : margePct >= 0 ? "gold" : "red"}
          />
        </div>

        {/* Insights row: grootste afwijking + break-even */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Grootste afwijking */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={13} className="text-navy-700" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grootste afwijking</span>
            </div>
            {grootsteKostenStijging && grootsteKostenStijging.delta > 0 ? (
              <div>
                <p className="text-sm text-navy-700">
                  <strong>{grootsteKostenStijging.name}</strong> {grootsteKostenStijging.deltaPct !== null && (
                    <span className="text-red-600 font-bold ml-1">
                      +{grootsteKostenStijging.deltaPct.toFixed(0)}% / {euro(grootsteKostenStijging.delta)}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Grootste stijger t.o.v. zelfde periode {jaar - 1}
                  {grootsteOmzetDaling && grootsteOmzetDaling.delta < 0 && (
                    <> · Omzetcategorie <strong>{grootsteOmzetDaling.name}</strong> daalde {euro(Math.abs(grootsteOmzetDaling.delta))}</>
                  )}
                </p>
              </div>
            ) : grootsteKostenDaling && grootsteKostenDaling.delta < 0 ? (
              <div>
                <p className="text-sm text-navy-700">
                  <strong>{grootsteKostenDaling.name}</strong>
                  <span className="text-emerald-600 font-bold ml-1">
                    {grootsteKostenDaling.delta > 0 ? "+" : ""}{euro(grootsteKostenDaling.delta)}
                  </span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">Grootste kostendaling — efficiënter dan vorig jaar</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Geen materiele afwijking vs vorig jaar.</p>
            )}
          </div>

          {/* Break-even */}
          <div className={`rounded-xl border p-3.5 ${
            breakevenStatus === "boven" ? "border-emerald-100 bg-emerald-50/40" :
            breakevenStatus === "onder" ? "border-red-100 bg-red-50/40" :
            "border-amber-100 bg-amber-50/40"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={13} className={
                breakevenStatus === "boven" ? "text-emerald-700" :
                breakevenStatus === "onder" ? "text-red-700" : "text-amber-700"
              } />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Break-even status</span>
              {breakevenStatus === "boven" && <CheckCircle2 size={11} className="text-emerald-600 ml-auto" />}
              {breakevenStatus === "onder" && <AlertTriangle size={11} className="text-red-600 ml-auto" />}
            </div>
            <p className="text-sm text-navy-700 leading-tight">
              Maandelijkse break-even: <strong>{euro(gemKostenPerMaand)}</strong>
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Huidig gemiddelde omzet: {euro(gemOmzetPerMaand)} ·
              {breakevenStatus === "boven" && (
                <span className="text-emerald-700 font-semibold"> Buffer van {euro(breakevenBuffer)}/mnd</span>
              )}
              {breakevenStatus === "onder" && (
                <span className="text-red-700 font-semibold"> Tekort van {euro(Math.abs(breakevenBuffer))}/mnd</span>
              )}
              {breakevenStatus === "rand" && (
                <span className="text-amber-700 font-semibold"> Op de rand — kleine afwijking maakt verschil</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Waarom-modal — één modal voor 3 metrics; data wisselt per geopende KPI */}
      <WaaromModal
        open={waaromOpen !== null}
        onClose={() => setWaaromOpen(null)}
        data={activeWaarom}
      />
    </div>
  );
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────
function KpiTile({
  label, value, sub, yoyPct, yoyInverse, yoyAsPp, accent, onWaarom,
}: {
  label: string;
  value: string;
  sub?: string;
  yoyPct: number | null;
  yoyInverse?: boolean;
  yoyAsPp?: boolean;
  accent: "navy" | "gold" | "emerald" | "red";
  onWaarom?: () => void;
}) {
  // Alleen de waarde krijgt een subtiele kleur (geen luide borders)
  const valueColor = {
    navy: "text-navy-700",
    gold: "text-navy-700",
    emerald: "text-emerald-700",
    red: "text-red-600",
  }[accent];

  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4 relative">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${valueColor}`}>{value}</p>
      <div className="flex items-center justify-between gap-2 mt-2">
        {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
        {yoyPct !== null && <YoyBadge value={yoyPct} inverse={yoyInverse} asPp={yoyAsPp} />}
      </div>
      {onWaarom && (
        <button
          onClick={onWaarom}
          className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold text-navy-700 bg-navy-700/5 hover:bg-navy-700/10 px-2 py-1 rounded-md transition-colors"
          title="Waarom-analyse openen"
        >
          <HelpCircle size={11} />
          Waarom?
        </button>
      )}
    </div>
  );
}

function YoyBadge({ value, inverse, asPp }: { value: number; inverse?: boolean; asPp?: boolean }) {
  const isNeutral = Math.abs(value) < 0.5;
  const isPositive = inverse ? value < 0 : value > 0;
  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
        <Minus size={8} /> {value.toFixed(1)}{asPp ? "pp" : "%"}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
      isPositive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
    }`}>
      {isPositive ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
      {pct(value)}{asPp ? "pp" : ""}
    </span>
  );
}
